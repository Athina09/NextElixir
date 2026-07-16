"""SHAP-based feature importance over the trained P50 revenue/ROAS models."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
import shap
from lightgbm import LGBMRegressor


@dataclass(frozen=True)
class DriverImportance:
    feature: str
    mean_abs_shap: float

    def to_dict(self) -> dict:
        return {"feature": self.feature, "mean_abs_shap": self.mean_abs_shap}


class Explainer:
    """Wraps a `shap.TreeExplainer` over one trained model + the feature matrix
    it was trained on. One instance per target (revenue, ROAS)."""

    def __init__(self, model: LGBMRegressor, feature_columns: tuple[str, ...]) -> None:
        self.feature_columns = feature_columns
        self._explainer = shap.TreeExplainer(model)

    def top_drivers(self, X: pd.DataFrame, top_n: int = 10) -> list[DriverImportance]:
        shap_values = self._explainer.shap_values(X[list(self.feature_columns)])
        mean_abs = np.abs(shap_values).mean(axis=0)
        order = np.argsort(mean_abs)[::-1][:top_n]
        return [
            DriverImportance(feature=self.feature_columns[i], mean_abs_shap=float(mean_abs[i])) for i in order
        ]
