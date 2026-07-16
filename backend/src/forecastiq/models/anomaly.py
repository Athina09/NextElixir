"""IsolationForest-based anomaly detection over the aggregate-period table:
low ROAS, outlier spend/revenue, unexpected campaign behaviour, budget waste."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

ANOMALY_FEATURES: tuple[str, ...] = ("spend", "revenue", "roas", "ctr", "conversion_rate")

LOW_ROAS_RATIO = 0.5  # flag if a row's ROAS is below this fraction of the portfolio median
OVERSPEND_UTILIZATION = 1.5  # flag if spend exceeds 150% of the stated daily budget * period length
OUTLIER_QUANTILE = 0.95


@dataclass(frozen=True)
class Anomaly:
    campaign_id: str
    campaign_name: str
    channel: str
    campaign_type: str
    period_start: pd.Timestamp
    period_end: pd.Timestamp
    anomaly_score: float
    reasons: tuple[str, ...]

    def to_dict(self) -> dict:
        return {
            "campaign_id": self.campaign_id,
            "campaign_name": self.campaign_name,
            "channel": self.channel,
            "campaign_type": self.campaign_type,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "anomaly_score": self.anomaly_score,
            "reasons": list(self.reasons),
        }


class AnomalyDetector:
    def __init__(self) -> None:
        self.model = IsolationForest(n_estimators=200, contamination="auto", random_state=42)
        self._median_roas: float = 0.0
        self._spend_p95: float = 0.0
        self._revenue_p95: float = 0.0

    def fit(self, period_table: pd.DataFrame) -> "AnomalyDetector":
        X = period_table[list(ANOMALY_FEATURES)].fillna(0.0)
        self.model.fit(X)
        self._median_roas = float(period_table["roas"].median())
        self._spend_p95 = float(period_table["spend"].quantile(OUTLIER_QUANTILE))
        self._revenue_p95 = float(period_table["revenue"].quantile(OUTLIER_QUANTILE))
        return self

    def detect(self, period_table: pd.DataFrame) -> list[Anomaly]:
        X = period_table[list(ANOMALY_FEATURES)].fillna(0.0)
        scores = self.model.decision_function(X)  # higher = more normal
        flags = self.model.predict(X)  # -1 = anomaly, 1 = normal

        anomalies: list[Anomaly] = []
        for (idx, row), flag, score in zip(period_table.iterrows(), flags, scores):
            if flag != -1:
                continue

            reasons = []
            if self._median_roas > 0 and row["roas"] < self._median_roas * LOW_ROAS_RATIO:
                reasons.append("low_roas")
            utilization = row.get("budget_utilization")
            if pd.notna(utilization) and utilization > OVERSPEND_UTILIZATION:
                reasons.append("budget_waste_overspend")
            if row["spend"] > self._spend_p95:
                reasons.append("outlier_spend")
            if row["revenue"] > self._revenue_p95:
                reasons.append("outlier_revenue")
            if not reasons:
                reasons.append("unexpected_campaign_behaviour")

            anomalies.append(
                Anomaly(
                    campaign_id=str(row["campaign_id"]),
                    campaign_name=str(row["campaign_name"]),
                    channel=str(row["channel"]),
                    campaign_type=str(row["campaign_type"]),
                    period_start=row["period_start"],
                    period_end=row["period_end"],
                    anomaly_score=float(score),
                    reasons=tuple(reasons),
                )
            )

        return sorted(anomalies, key=lambda a: a.anomaly_score)
