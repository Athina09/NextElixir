"""Trains the revenue model and the ROAS model as three-quantile LightGBM
regressors (P10/P50/P90) over the aggregate-period feature table, evaluated on
a held-out time-based split.

Feature/target separation matters here: only columns knowable *before* a
period happens are used as model inputs — the media budget for that period
(`spend`, `daily_budget`), seasonality of the period's start date, campaign
identity, and trailing rolling/lag momentum from *prior* periods. Same-period
outcome columns (clicks, impressions, conversions, ctr, cpa, ...) are
deliberately excluded — they are only known after the period happens and are
themselves functions of revenue/spend, so including them would leak the
target into its own features. This is what makes budget simulation valid:
changing `spend` for a hypothetical future period is a real, unseen input to
the trained model, not a value the model has already "seen" the answer for.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor

from forecastiq.features.engineering import ROLLING_LAG_MEAN_COLUMNS

QUANTILES: tuple[float, ...] = (0.1, 0.5, 0.9)

FEATURE_COLUMNS: tuple[str, ...] = (
    "spend",
    "daily_budget",
    "period_length_days",
    "month",
    "quarter",
    "weekday",
    "is_weekend",
    "campaign_id_code",
    "channel_code",
    "campaign_type_code",
    *ROLLING_LAG_MEAN_COLUMNS,
)

TARGET_REVENUE = "revenue"
TARGET_ROAS = "roas"

#: below this many training rows a quantile model is unreliable; callers should
#: surface this rather than silently training on too little data.
MIN_TRAINING_ROWS = 10


@dataclass(frozen=True)
class Metrics:
    mae: float
    rmse: float
    mape: float
    r2: float

    def to_dict(self) -> dict:
        return {"mae": self.mae, "rmse": self.rmse, "mape": self.mape, "r2": self.r2}


def compute_metrics(y_true, y_pred) -> Metrics:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    errors = y_true - y_pred

    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors**2)))

    nonzero = y_true != 0
    mape = float(np.mean(np.abs(errors[nonzero] / y_true[nonzero])) * 100) if nonzero.any() else float("nan")

    ss_res = float(np.sum(errors**2))
    ss_tot = float(np.sum((y_true - y_true.mean()) ** 2))
    r2 = 1 - ss_res / ss_tot if ss_tot > 0 else float("nan")

    return Metrics(mae=mae, rmse=rmse, mape=mape, r2=r2)


def time_based_split(period_table: pd.DataFrame, test_fraction: float = 0.2) -> tuple[pd.DataFrame, pd.DataFrame]:
    ordered = period_table.sort_values("period_end")
    split_at = max(1, int(len(ordered) * (1 - test_fraction)))
    split_at = min(split_at, len(ordered) - 1) if len(ordered) > 1 else len(ordered)
    return ordered.iloc[:split_at], ordered.iloc[split_at:]


def fit_quantile_models(X: pd.DataFrame, y: pd.Series) -> dict[float, LGBMRegressor]:
    models: dict[float, LGBMRegressor] = {}
    for q in QUANTILES:
        model = LGBMRegressor(
            objective="quantile",
            alpha=q,
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            min_child_samples=5,
            random_state=42,
            verbosity=-1,
        )
        model.fit(X, y)
        models[q] = model
    return models


def predict_quantiles(models: dict[float, LGBMRegressor], X: pd.DataFrame) -> dict[float, np.ndarray]:
    raw = {q: models[q].predict(X) for q in QUANTILES}
    # Independently trained quantile models can "cross" (e.g. P10 > P50) on a small
    # dataset — enforce monotonicity row-wise rather than report a nonsensical band.
    stacked = np.sort(np.column_stack([raw[q] for q in QUANTILES]), axis=1)
    return {q: stacked[:, i] for i, q in enumerate(QUANTILES)}


@dataclass
class TrainingResult:
    revenue_models: dict[float, LGBMRegressor]
    roas_models: dict[float, LGBMRegressor]
    revenue_metrics: Metrics
    roas_metrics: Metrics
    feature_columns: tuple[str, ...]
    train_rows: int
    test_rows: int


def train_models(period_table: pd.DataFrame) -> TrainingResult:
    if len(period_table) < MIN_TRAINING_ROWS:
        raise ValueError(
            f"Only {len(period_table)} period rows available; need at least "
            f"{MIN_TRAINING_ROWS} to fit a meaningful model. Check the ingested date range."
        )

    train_df, test_df = time_based_split(period_table)
    X_train = train_df[list(FEATURE_COLUMNS)]
    X_test = test_df[list(FEATURE_COLUMNS)]

    revenue_models = fit_quantile_models(X_train, train_df[TARGET_REVENUE])
    roas_models = fit_quantile_models(X_train, train_df[TARGET_ROAS])

    revenue_p50 = predict_quantiles(revenue_models, X_test)[0.5]
    roas_p50 = predict_quantiles(roas_models, X_test)[0.5]

    return TrainingResult(
        revenue_models=revenue_models,
        roas_models=roas_models,
        revenue_metrics=compute_metrics(test_df[TARGET_REVENUE], revenue_p50),
        roas_metrics=compute_metrics(test_df[TARGET_ROAS], roas_p50),
        feature_columns=FEATURE_COLUMNS,
        train_rows=len(train_df),
        test_rows=len(test_df),
    )
