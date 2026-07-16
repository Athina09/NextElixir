"""Budget simulation — the same `forecast()` call with a substituted future
budget vector, no retraining. Translates the frontend's `{google, meta,
microsoft}` budget shape (see src/lib/forecast.ts `BudgetAllocation`) into the
channel-keyed dict `forecast()` expects.
"""

from __future__ import annotations

import pandas as pd

from forecastiq.data.schema import Channel
from forecastiq.features.engineering import CategoryEncoder
from forecastiq.models.forecasting import forecast

FRONTEND_KEY_TO_CHANNEL: dict[str, str] = {
    "google": Channel.GOOGLE_ADS.value,
    "meta": Channel.META_ADS.value,
    "microsoft": Channel.MICROSOFT_ADS.value,
}


def simulate_budget(
    historical_df: pd.DataFrame,
    historical_period_table: pd.DataFrame,
    encoder: CategoryEncoder,
    revenue_models: dict[float, object],
    roas_models: dict[float, object],
    horizon_days: int,
    as_of: pd.Timestamp,
    budget: dict[str, float],
) -> dict:
    """`budget` is `{"google": ..., "meta": ..., "microsoft": ...}`, each value the
    total spend for the whole horizon on that channel."""
    overrides = {FRONTEND_KEY_TO_CHANNEL[k]: v for k, v in budget.items() if k in FRONTEND_KEY_TO_CHANNEL}
    return forecast(
        historical_df=historical_df,
        historical_period_table=historical_period_table,
        encoder=encoder,
        revenue_models=revenue_models,
        roas_models=roas_models,
        horizon_days=horizon_days,
        as_of=as_of,
        budget_overrides=overrides,
    )
