#!/usr/bin/env python
"""run.sh step 1: ingest + normalize + validate whatever is in DATA_DIR.

Deliberately thin — ingestion/normalization is the one part of the pipeline
that doesn't need the trained model (the categorical encoder used for the
period-level feature matrix is only available once pickle/model.pkl is
loaded), so the model-dependent feature engineering happens in predict.py via
the same shared ForecastPipeline. See forecastiq/submission/output_schema.py
docstring and backend/README.md "Architecture" for why the split sits here.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from forecastiq.core.config import get_settings
from forecastiq.core.logging import configure_logging, get_logger
from forecastiq.models.pipeline import ForecastPipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest and normalize the raw ad-platform CSVs in DATA_DIR.")
    parser.add_argument("--data-dir", required=True, help="Folder containing the input CSVs.")
    parser.add_argument("--out", required=True, help="Where to write the normalized dataset (parquet).")
    args = parser.parse_args()

    settings = get_settings()
    configure_logging(settings)
    logger = get_logger("app")

    data_dir = Path(args.data_dir)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    pipeline = ForecastPipeline()
    logger.info("Loading and normalizing CSVs from %s", data_dir)
    unified = pipeline.load_data(data_dir)

    report = pipeline.validate(unified)
    logger.info(
        "Validation: %d rows, %d error(s), %d warning(s)",
        report.total_rows,
        len(report.errors),
        len(report.warnings),
    )
    report_path = out_path.with_name(out_path.stem + "_validation.json")
    report_path.write_text(json.dumps(report.to_dict(), indent=2))

    unified.to_parquet(out_path, index=False)
    logger.info("Wrote %d normalized rows to %s", len(unified), out_path)


if __name__ == "__main__":
    main()
