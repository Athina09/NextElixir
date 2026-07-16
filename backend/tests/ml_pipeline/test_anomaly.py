from forecastiq.data.ingestion import DataIngestor
from forecastiq.features.engineering import FeatureEngineer
from forecastiq.models.anomaly import AnomalyDetector


def test_anomaly_detector_fits_and_flags_reasons(real_data_dir):
    unified = DataIngestor().load(real_data_dir)
    period_table = FeatureEngineer(period_days=30).build(unified, fit=True)

    detector = AnomalyDetector().fit(period_table)
    anomalies = detector.detect(period_table)

    assert isinstance(anomalies, list)
    for anomaly in anomalies:
        assert anomaly.reasons
        assert anomaly.campaign_id
        d = anomaly.to_dict()
        assert d["period_start"] < d["period_end"] or d["period_start"] == d["period_end"]


def test_anomaly_scores_are_sorted_most_anomalous_first(real_data_dir):
    unified = DataIngestor().load(real_data_dir)
    period_table = FeatureEngineer(period_days=30).build(unified, fit=True)

    detector = AnomalyDetector().fit(period_table)
    anomalies = detector.detect(period_table)

    scores = [a.anomaly_score for a in anomalies]
    assert scores == sorted(scores)
