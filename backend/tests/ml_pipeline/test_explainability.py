from forecastiq.data.ingestion import DataIngestor
from forecastiq.features.engineering import FeatureEngineer
from forecastiq.models.explainability import Explainer
from forecastiq.models.training import FEATURE_COLUMNS, train_models


def test_explainer_returns_ranked_drivers(real_data_dir):
    unified = DataIngestor().load(real_data_dir)
    period_table = FeatureEngineer(period_days=30).build(unified, fit=True)
    result = train_models(period_table)

    explainer = Explainer(result.revenue_models[0.5], FEATURE_COLUMNS)
    drivers = explainer.top_drivers(period_table, top_n=5)

    assert len(drivers) == 5
    values = [d.mean_abs_shap for d in drivers]
    assert values == sorted(values, reverse=True)
    assert all(d.feature in FEATURE_COLUMNS for d in drivers)
