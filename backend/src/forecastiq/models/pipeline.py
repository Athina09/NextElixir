"""The single shared pipeline.

`run.sh`'s scripts, the FastAPI service layer, and `train.py` all construct
this one class and call only these methods — there is no second copy of
ingestion, feature engineering, or prediction logic anywhere else in the
codebase.
"""

from __future__ import annotations

import pickle
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from forecastiq.data.ingestion import DataIngestor
from forecastiq.data.validation import DataValidator, ValidationReport
from forecastiq.features.engineering import CategoryEncoder, FeatureEngineer
from forecastiq.models.anomaly import Anomaly, AnomalyDetector
from forecastiq.models.explainability import DriverImportance, Explainer
from forecastiq.models.forecasting import forecast as run_forecast
from forecastiq.models.simulation import simulate_budget as run_simulate_budget
from forecastiq.models.training import Metrics, train_models

SCHEMA_VERSION = 1


@dataclass
class ModelArtifacts:
    schema_version: int
    trained_at: str
    period_days: int
    encoder: CategoryEncoder
    revenue_models: dict[float, object]
    roas_models: dict[float, object]
    revenue_metrics: Metrics
    roas_metrics: Metrics
    anomaly_detector: AnomalyDetector
    feature_columns: tuple[str, ...]
    train_rows: int
    test_rows: int


class ForecastPipeline:
    def __init__(self, period_days: int = 30) -> None:
        self.period_days = period_days
        self.ingestor = DataIngestor()
        self.validator = DataValidator()
        self.feature_engineer = FeatureEngineer(period_days=period_days)
        self.artifacts: ModelArtifacts | None = None

    # ---- data ----
    def load_data(self, data_dir: Path) -> pd.DataFrame:
        return self.ingestor.load(data_dir)

    def validate(self, df: pd.DataFrame) -> ValidationReport:
        return self.validator.validate(df)

    def build_features(self, df: pd.DataFrame, fit: bool, period_days: int | None = None) -> pd.DataFrame:
        return self.feature_engineer.build(df, fit=fit, period_days=period_days)

    # ---- training (offline only; never called from the inference/API path) ----
    def train(self, df: pd.DataFrame) -> ModelArtifacts:
        # Trained on the combined 30/60/90-day period table (not just 30) so
        # `period_length_days` is in-distribution at every horizon the brief
        # requires — see FeatureEngineer.build_training_table.
        period_table = self.feature_engineer.build_training_table(df)
        result = train_models(period_table)
        anomaly_detector = AnomalyDetector().fit(period_table)

        self.artifacts = ModelArtifacts(
            schema_version=SCHEMA_VERSION,
            trained_at=pd.Timestamp.now(tz="UTC").isoformat(),
            period_days=self.period_days,
            encoder=self.feature_engineer.encoder,
            revenue_models=result.revenue_models,
            roas_models=result.roas_models,
            revenue_metrics=result.revenue_metrics,
            roas_metrics=result.roas_metrics,
            anomaly_detector=anomaly_detector,
            feature_columns=result.feature_columns,
            train_rows=result.train_rows,
            test_rows=result.test_rows,
        )
        return self.artifacts

    def save_artifacts(self, path: Path) -> None:
        artifacts = self._require_artifacts()
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(artifacts, f)

    # ---- inference (run.sh, FastAPI, budget simulation — never retrains) ----
    def load_artifacts(self, path: Path) -> None:
        with open(path, "rb") as f:
            self.artifacts = pickle.load(f)
        self.period_days = self.artifacts.period_days
        self.feature_engineer = FeatureEngineer(period_days=self.period_days)
        self.feature_engineer.encoder = self.artifacts.encoder

    def forecast(
        self,
        df: pd.DataFrame,
        horizon_days: int,
        as_of: pd.Timestamp,
        budget_overrides: dict[str, float] | None = None,
    ) -> dict:
        artifacts = self._require_artifacts()
        # Built at the SAME period grain as the requested horizon (the model was
        # trained on 30/60/90-day examples alike) so period_length_days and the
        # scaled spend/revenue/momentum features are in-distribution, not
        # extrapolated from a fixed 30-day training grain.
        period_table = self.build_features(df, fit=False, period_days=horizon_days)
        return run_forecast(
            historical_df=df,
            historical_period_table=period_table,
            encoder=artifacts.encoder,
            revenue_models=artifacts.revenue_models,
            roas_models=artifacts.roas_models,
            horizon_days=horizon_days,
            as_of=as_of,
            budget_overrides=budget_overrides,
        )

    def simulate_budget(
        self,
        df: pd.DataFrame,
        horizon_days: int,
        as_of: pd.Timestamp,
        budget: dict[str, float],
    ) -> dict:
        """Same forecast() call under the hood, with a substituted future budget
        vector — no retraining, matching the budget simulator's requirement."""
        artifacts = self._require_artifacts()
        period_table = self.build_features(df, fit=False, period_days=horizon_days)
        return run_simulate_budget(
            historical_df=df,
            historical_period_table=period_table,
            encoder=artifacts.encoder,
            revenue_models=artifacts.revenue_models,
            roas_models=artifacts.roas_models,
            horizon_days=horizon_days,
            as_of=as_of,
            budget=budget,
        )

    def detect_anomalies(self, df: pd.DataFrame) -> list[Anomaly]:
        artifacts = self._require_artifacts()
        period_table = self.build_features(df, fit=False)
        return artifacts.anomaly_detector.detect(period_table)

    def explain(self, df: pd.DataFrame, top_n: int = 10) -> dict[str, list[DriverImportance]]:
        artifacts = self._require_artifacts()
        period_table = self.build_features(df, fit=False)
        revenue_explainer = Explainer(artifacts.revenue_models[0.5], artifacts.feature_columns)
        roas_explainer = Explainer(artifacts.roas_models[0.5], artifacts.feature_columns)
        return {
            "revenue_drivers": revenue_explainer.top_drivers(period_table, top_n),
            "roas_drivers": roas_explainer.top_drivers(period_table, top_n),
        }

    def _require_artifacts(self) -> ModelArtifacts:
        if self.artifacts is None:
            raise RuntimeError("No model artifacts loaded — call train() or load_artifacts() first.")
        return self.artifacts
