import numpy as np
import pytest

from forecastiq.data.ingestion import DataIngestor
from forecastiq.features.engineering import FeatureEngineer
from forecastiq.models.training import (
    FEATURE_COLUMNS,
    QUANTILES,
    predict_quantiles,
    train_models,
)


@pytest.fixture(scope="module")
def period_table(real_data_dir):
    unified = DataIngestor().load(real_data_dir)
    return FeatureEngineer(period_days=30).build(unified, fit=True)


@pytest.fixture(scope="module")
def training_result(period_table):
    return train_models(period_table)


def test_train_models_returns_finite_metrics(training_result):
    for metrics in (training_result.revenue_metrics, training_result.roas_metrics):
        assert metrics.mae >= 0
        assert metrics.rmse >= 0
        assert not np.isnan(metrics.r2) or metrics.r2 == metrics.r2  # r2 may legitimately be NaN
        assert metrics.mae < float("inf")
        assert metrics.rmse < float("inf")


def test_quantile_predictions_are_monotonic(training_result, period_table):
    X = period_table[list(FEATURE_COLUMNS)]
    preds = predict_quantiles(training_result.revenue_models, X)
    p10, p50, p90 = preds[0.1], preds[0.5], preds[0.9]
    assert (p10 <= p50 + 1e-6).all()
    assert (p50 <= p90 + 1e-6).all()


def test_roas_quantile_predictions_are_monotonic(training_result, period_table):
    X = period_table[list(FEATURE_COLUMNS)]
    preds = predict_quantiles(training_result.roas_models, X)
    assert (preds[0.1] <= preds[0.5] + 1e-6).all()
    assert (preds[0.5] <= preds[0.9] + 1e-6).all()


def test_all_three_quantiles_are_trained(training_result):
    assert set(training_result.revenue_models.keys()) == set(QUANTILES)
    assert set(training_result.roas_models.keys()) == set(QUANTILES)


def test_train_models_rejects_too_little_data():
    import pandas as pd

    from forecastiq.models.training import train_models

    tiny = pd.DataFrame({col: [0.0] * 3 for col in FEATURE_COLUMNS} | {
        "revenue": [1.0, 2.0, 3.0],
        "roas": [1.0, 1.0, 1.0],
        "period_end": pd.date_range("2026-01-01", periods=3),
    })
    with pytest.raises(ValueError):
        train_models(tiny)
