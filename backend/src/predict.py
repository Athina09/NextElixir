#!/usr/bin/env python
"""run.sh step 2: load the normalized data + pickle/model.pkl and write predictions.

Forecasts start the day after the latest date present in the provided data —
not wall-clock "now" — so a run against held-out test data with a different
date range is fully reproducible and never depends on when the grading
pipeline happens to execute this script. Produces all three required
horizons (30/60/90 days) in one file, at aggregate/channel/campaign-type/
campaign levels — see forecastiq/submission/output_schema.py for the exact
column contract and the documented caveat about its assumed format.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))

from forecastiq.core.config import get_settings
from forecastiq.core.logging import configure_logging, get_logger
from forecastiq.models.pipeline import ForecastPipeline
from forecastiq.submission.output_schema import build_predictions_dataframe

HORIZONS = (30, 60, 90)


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict revenue/ROAS forecasts from the trained model.")
    parser.add_argument("--features", required=True, help="Path to the normalized dataset (parquet).")
    parser.add_argument("--model", required=True, help="Path to the pickled model artifact.")
    parser.add_argument("--output", required=True, help="Where to write predictions.csv.")
    args = parser.parse_args()

    settings = get_settings()
    configure_logging(settings)
    logger = get_logger("prediction")

    unified = pd.read_parquet(args.features)
    unified["date"] = pd.to_datetime(unified["date"])

    pipeline = ForecastPipeline()
    pipeline.load_artifacts(Path(args.model))
    logger.info("Loaded model trained at %s (schema v%d)", pipeline.artifacts.trained_at, pipeline.artifacts.schema_version)

    as_of = unified["date"].max() + pd.Timedelta(days=1)
    logger.info("Forecasting from as_of=%s across horizons %s", as_of.date(), HORIZONS)

    results = [pipeline.forecast(unified, horizon_days=h, as_of=as_of) for h in HORIZONS]
    predictions = build_predictions_dataframe(results)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    predictions.to_csv(output_path, index=False)
    logger.info("Wrote %d prediction rows to %s", len(predictions), output_path)


if __name__ == "__main__":
    main()
