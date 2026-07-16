import pandas as pd
import pytest

from forecastiq.models.pipeline import ForecastPipeline

AS_OF = pd.Timestamp("2026-07-15")


def test_pipeline_requires_artifacts_before_inference():
    pipeline = ForecastPipeline()
    with pytest.raises(RuntimeError):
        pipeline.forecast(pd.DataFrame(), horizon_days=30, as_of=AS_OF)


def test_pipeline_train_then_forecast_end_to_end(real_data_dir):
    pipeline = ForecastPipeline(period_days=30)
    df = pipeline.load_data(real_data_dir)

    report = pipeline.validate(df)
    assert not report.is_blocking

    artifacts = pipeline.train(df)
    assert artifacts.train_rows > 0
    assert artifacts.test_rows > 0

    result = pipeline.forecast(df, horizon_days=30, as_of=AS_OF)
    assert result["revenue"]["p50"] > 0

    anomalies = pipeline.detect_anomalies(df)
    assert isinstance(anomalies, list)

    explanation = pipeline.explain(df, top_n=5)
    assert len(explanation["revenue_drivers"]) == 5
    assert len(explanation["roas_drivers"]) == 5


def test_pipeline_save_and_load_artifacts_roundtrip(real_data_dir, tmp_path):
    training_pipeline = ForecastPipeline(period_days=30)
    df = training_pipeline.load_data(real_data_dir)
    training_pipeline.train(df)

    model_path = tmp_path / "model.pkl"
    training_pipeline.save_artifacts(model_path)
    assert model_path.exists()

    # Fresh instance, as run.sh's separate predict.py process would be — never
    # calls train(), only load_artifacts() + forecast().
    inference_pipeline = ForecastPipeline()
    inference_pipeline.load_artifacts(model_path)

    result = inference_pipeline.forecast(df, horizon_days=60, as_of=AS_OF)
    assert result["horizon_days"] == 60
    assert result["revenue"]["p10"] <= result["revenue"]["p50"] <= result["revenue"]["p90"]


def test_pipeline_simulate_budget_matches_forecast_with_overrides(real_data_dir):
    pipeline = ForecastPipeline(period_days=30)
    df = pipeline.load_data(real_data_dir)
    pipeline.train(df)

    result = pipeline.simulate_budget(
        df, horizon_days=30, as_of=AS_OF, budget={"google": 50_000, "meta": 20_000, "microsoft": 10_000}
    )
    assert result["total_budget"] == pytest.approx(80_000, rel=1e-6)


def test_revenue_scales_with_spend_across_all_three_horizons(real_data_dir):
    """Regression guard: the model must be trained on genuine 30/60/90-day
    period examples (see FeatureEngineer.build_training_table), not just
    30-day ones with 60/90 requested only at inference — otherwise
    `period_length_days` is out-of-distribution and revenue flatlines instead
    of scaling with a proportionally larger budget."""
    pipeline = ForecastPipeline(period_days=30)
    df = pipeline.load_data(real_data_dir)
    pipeline.train(df)

    revenue_by_horizon = {}
    for horizon in (30, 60, 90):
        scale = horizon / 30
        budget = {"google": 70_000 * scale, "meta": 7_500 * scale, "microsoft": 4_000 * scale}
        result = pipeline.forecast(df, horizon_days=horizon, as_of=AS_OF, budget_overrides={
            "Google Ads": budget["google"], "Meta Ads": budget["meta"], "Microsoft Ads": budget["microsoft"],
        })
        revenue_by_horizon[horizon] = result["revenue"]["p50"]

    # 90-day revenue at 3x the spend must be meaningfully larger than 30-day
    # revenue — not flat (which is what happens when period_length_days is
    # extrapolated far outside the training range).
    assert revenue_by_horizon[60] > revenue_by_horizon[30] * 1.3
    assert revenue_by_horizon[90] > revenue_by_horizon[30] * 1.8
