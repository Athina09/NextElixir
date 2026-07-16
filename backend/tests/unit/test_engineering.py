import numpy as np
import pandas as pd
import pytest

from forecastiq.features.engineering import (
    CategoryEncoder,
    FeatureEngineer,
    add_daily_rolling_lag_features,
    add_efficiency_metrics,
    add_time_features,
    build_multi_period_table,
    build_period_table,
)


def _daily_campaign(n_days: int = 10, campaign_id: str = "C1") -> pd.DataFrame:
    dates = pd.date_range("2026-01-01", periods=n_days, freq="D")
    spend = pd.Series([(i + 1) * 10.0 for i in range(n_days)])
    return pd.DataFrame(
        {
            "date": dates,
            "campaign_id": campaign_id,
            "campaign_name": "Test_Campaign",
            "channel": "Google Ads",
            "campaign_type": "Search",
            "spend": spend,
            "revenue": spend * 4,
            "clicks": spend / 2,
            "impressions": spend * 20,
            "conversions": spend / 20,
            "daily_budget": 15.0,
            "is_revenue_estimated": False,
        }
    )


def test_add_efficiency_metrics_avoids_division_by_zero():
    df = pd.DataFrame(
        {
            "spend": [0.0, 100.0],
            "revenue": [0.0, 400.0],
            "clicks": [0.0, 50.0],
            "impressions": [0.0, 1000.0],
            "conversions": [0.0, 5.0],
            "daily_budget": [np.nan, 150.0],
        }
    )
    out = add_efficiency_metrics(df)
    assert out.loc[0, ["ctr", "cpc", "cpm", "cpa", "roas", "conversion_rate"]].tolist() == [0.0] * 6
    assert out.loc[1, "roas"] == pytest.approx(4.0)
    assert out.loc[1, "ctr"] == pytest.approx(0.05)


def test_add_time_features_known_dates():
    df = pd.DataFrame({"date": pd.to_datetime(["2026-07-15", "2026-07-18"])})  # Wed, Sat
    out = add_time_features(df)
    assert out["month"].tolist() == [7, 7]
    assert out["quarter"].tolist() == [3, 3]
    assert out["is_weekend"].tolist() == [0, 1]


def test_rolling_and_lag_features_never_include_the_current_day():
    df = _daily_campaign()
    out = add_daily_rolling_lag_features(df).reset_index(drop=True)

    # first row has no history at all -> filled to 0
    assert out.loc[0, "roll7_spend"] == 0.0
    assert out.loc[0, "lag1_spend"] == 0.0

    # 7th row (day7, spend=70): shifted spend series for days1..6 = 10..60 -> mean 35
    assert out.loc[6, "roll7_spend"] == pytest.approx(35.0)
    # lag1 on day8 (index7, spend=80) is day7's spend = 70
    assert out.loc[7, "lag1_spend"] == pytest.approx(70.0)
    # lag7 on day8 (index7) is day1's spend = 10
    assert out.loc[7, "lag7_spend"] == pytest.approx(10.0)


def test_build_period_table_aggregates_sums_and_ratios_correctly():
    dates = pd.date_range("2026-01-01", periods=4, freq="D")
    df = pd.DataFrame(
        {
            "date": dates,
            "campaign_id": "C1",
            "campaign_name": "Test_Campaign",
            "channel": "Google Ads",
            "campaign_type": "Search",
            "spend": [10.0, 20.0, 30.0, 40.0],
            "revenue": [40.0, 80.0, 60.0, 160.0],
            "clicks": [1.0, 1.0, 1.0, 1.0],
            "impressions": [10.0, 10.0, 10.0, 10.0],
            "conversions": [1.0, 1.0, 1.0, 1.0],
            "daily_budget": 15.0,
            "is_revenue_estimated": False,
        }
    )
    periods = build_period_table(df, period_days=2)

    assert len(periods) == 2
    first, second = periods.iloc[0], periods.iloc[1]

    assert first["spend"] == pytest.approx(30.0)
    assert first["revenue"] == pytest.approx(120.0)
    assert first["roas"] == pytest.approx(4.0)
    assert first["period_length_days"] == 2
    assert first["period_start"] == dates[0]
    assert first["period_end"] == dates[1]
    assert first["budget_utilization"] == pytest.approx(30.0 / (15.0 * 2))

    assert second["spend"] == pytest.approx(70.0)
    assert second["revenue"] == pytest.approx(220.0)
    assert second["roas"] == pytest.approx(220.0 / 70.0)


def test_category_encoder_is_deterministic_and_handles_unseen():
    df = pd.DataFrame({"channel": ["Meta Ads", "Google Ads", "Google Ads"]})
    encoder = CategoryEncoder().fit(df, columns=("channel",))

    assert encoder.mappings["channel"] == {"Google Ads": 0, "Meta Ads": 1}

    unseen = pd.DataFrame({"channel": ["Microsoft Ads"]})
    transformed = encoder.transform(unseen)
    assert transformed.loc[0, "channel_code"] == -1


def test_feature_engineer_fit_then_transform_only_never_refits(real_data_dir):
    from forecastiq.data.ingestion import DataIngestor

    unified = DataIngestor().load(real_data_dir)
    engineer = FeatureEngineer(period_days=30)

    trained = engineer.build(unified, fit=True)
    mappings_after_fit = {k: dict(v) for k, v in engineer.encoder.mappings.items()}

    inferred = engineer.build(unified, fit=False)
    assert engineer.encoder.mappings == {k: dict(v) for k, v in mappings_after_fit.items()}
    assert list(trained.columns) == list(inferred.columns)
    assert trained["revenue"].sum() == pytest.approx(inferred["revenue"].sum())


def test_period_table_on_real_data_has_no_nan_targets(real_data_dir):
    from forecastiq.data.ingestion import DataIngestor

    unified = DataIngestor().load(real_data_dir)
    periods = build_period_table(unified, period_days=30)

    assert periods["spend"].notna().all()
    assert periods["revenue"].notna().all()
    assert (periods["spend"] >= 0).all()


def test_build_multi_period_table_covers_all_three_horizons(real_data_dir):
    from forecastiq.data.ingestion import DataIngestor

    unified = DataIngestor().load(real_data_dir)
    combined = build_multi_period_table(unified, period_days_list=(30, 60, 90))

    # Every campaign's 30-day bucketing yields more periods than its 60-day
    # bucketing, which yields more than its 90-day bucketing — so the combined
    # table must contain a genuine mix of period_length_days, not just ~30.
    lengths = combined["period_length_days"]
    assert lengths.min() <= 30
    assert lengths.max() >= 60
    assert combined["spend"].notna().all()
    assert combined["revenue"].notna().all()


def test_feature_engineer_build_training_table_fits_encoder_once(real_data_dir):
    from forecastiq.data.ingestion import DataIngestor

    unified = DataIngestor().load(real_data_dir)
    engineer = FeatureEngineer(period_days=30)

    combined = engineer.build_training_table(unified)
    assert set(combined["period_length_days"].unique()) & {30, 60, 90}
    assert "campaign_id_code" in combined.columns
    assert engineer.encoder.mappings  # encoder was fit
