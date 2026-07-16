import pandas as pd
import pytest

from forecastiq.data.ingestion import DataIngestor
from forecastiq.features.engineering import FeatureEngineer
from forecastiq.models.forecasting import forecast
from forecastiq.models.simulation import simulate_budget
from forecastiq.models.training import train_models

AS_OF = pd.Timestamp("2026-07-15")


@pytest.fixture(scope="module")
def trained(real_data_dir):
    unified = DataIngestor().load(real_data_dir)
    engineer = FeatureEngineer(period_days=30)
    period_table = engineer.build(unified, fit=True)
    result = train_models(period_table)
    return unified, period_table, engineer.encoder, result


@pytest.mark.parametrize("horizon_days", [30, 60, 90])
def test_forecast_shape_matches_frontend_contract(trained, horizon_days):
    unified, period_table, encoder, result = trained
    out = forecast(
        historical_df=unified,
        historical_period_table=period_table,
        encoder=encoder,
        revenue_models=result.revenue_models,
        roas_models=result.roas_models,
        horizon_days=horizon_days,
        as_of=AS_OF,
    )

    assert out["horizon_days"] == horizon_days
    assert out["revenue"]["p10"] <= out["revenue"]["p50"] <= out["revenue"]["p90"]
    assert out["roas"]["p10"] <= out["roas"]["p50"] <= out["roas"]["p90"]
    assert 0.5 <= out["confidence"] <= 0.99
    assert len(out["timeline"]) == horizon_days
    assert len(out["distribution"]) == 41
    assert len(out["channels"]) == 3
    assert len(out["campaign_types"]) > 0
    assert len(out["campaigns"]) > 0
    pd.Timestamp(out["generated_at"])  # must be a parseable timestamp

    for point in out["timeline"]:
        assert point["p10"] <= point["p25"] <= point["p50"] <= point["p75"] <= point["p90"]

    for channel in out["channels"]:
        assert channel["name"] in {"Google Ads", "Meta Ads", "Microsoft Ads"}
        assert 0.0 <= channel["confidence"] <= 0.99


def test_forecast_totals_reconcile_with_channel_breakdown(trained):
    unified, period_table, encoder, result = trained
    out = forecast(
        historical_df=unified,
        historical_period_table=period_table,
        encoder=encoder,
        revenue_models=result.revenue_models,
        roas_models=result.roas_models,
        horizon_days=30,
        as_of=AS_OF,
    )
    channel_revenue_sum = sum(c["revenue"] for c in out["channels"])
    assert channel_revenue_sum == pytest.approx(out["revenue"]["p50"], rel=1e-6)


def test_simulate_budget_changes_forecast_without_retraining(trained):
    unified, period_table, encoder, result = trained

    low = simulate_budget(
        historical_df=unified,
        historical_period_table=period_table,
        encoder=encoder,
        revenue_models=result.revenue_models,
        roas_models=result.roas_models,
        horizon_days=30,
        as_of=AS_OF,
        budget={"google": 10_000.0, "meta": 10_000.0, "microsoft": 10_000.0},
    )
    high = simulate_budget(
        historical_df=unified,
        historical_period_table=period_table,
        encoder=encoder,
        revenue_models=result.revenue_models,
        roas_models=result.roas_models,
        horizon_days=30,
        as_of=AS_OF,
        budget={"google": 200_000.0, "meta": 200_000.0, "microsoft": 200_000.0},
    )

    assert high["total_budget"] > low["total_budget"]
    assert low["total_budget"] == pytest.approx(30_000.0, rel=1e-6)
    assert high["total_budget"] == pytest.approx(600_000.0, rel=1e-6)
    # same models used for both — no fit/train call happens inside simulate_budget
    assert high["revenue"]["p50"] != low["revenue"]["p50"]


def test_channel_mix_changes_timeline_shape(trained):
    """Google-heavy vs Meta-heavy scenarios must not share an identical wave shape."""
    unified, period_table, encoder, result = trained
    common = dict(
        historical_df=unified,
        historical_period_table=period_table,
        encoder=encoder,
        revenue_models=result.revenue_models,
        roas_models=result.roas_models,
        horizon_days=30,
        as_of=AS_OF,
    )
    google_heavy = simulate_budget(
        **common,
        budget={"google": 250_000.0, "meta": 10_000.0, "microsoft": 10_000.0},
    )
    meta_heavy = simulate_budget(
        **common,
        budget={"google": 10_000.0, "meta": 250_000.0, "microsoft": 10_000.0},
    )

    g = [p["p50"] for p in google_heavy["timeline"]]
    m = [p["p50"] for p in meta_heavy["timeline"]]
    g_norm = [x / sum(g) for x in g]
    m_norm = [x / sum(m) for x in m]
    # Same weekday pattern would make these nearly identical after normalization.
    assert g_norm != pytest.approx(m_norm, abs=1e-4)
    assert g.index(max(g)) != m.index(max(m)) or g_norm != pytest.approx(m_norm, abs=1e-3)
