"""Caches the ingested+normalized DataFrame in memory for the life of the
FastAPI process — re-parsing ~25k CSV rows on every debounced budget-slider
request would add needless latency. `refresh()` is called after a new
dataset is uploaded so new data is reflected immediately, still without
retraining the model.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from forecastiq.models.pipeline import ForecastPipeline


class DataStore:
    def __init__(self, pipeline: ForecastPipeline, data_dir: Path) -> None:
        self._pipeline = pipeline
        self._data_dir = Path(data_dir)
        self._df: pd.DataFrame | None = None

    def get(self) -> pd.DataFrame:
        if self._df is None:
            self._df = self._pipeline.load_data(self._data_dir)
        return self._df

    def refresh(self) -> pd.DataFrame:
        self._df = self._pipeline.load_data(self._data_dir)
        return self._df
