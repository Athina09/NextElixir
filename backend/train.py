#!/usr/bin/env python
"""Offline training entrypoint. Not part of run.sh — the submission guide is
explicit that the graded run never retrains, it only generates features and
predicts. This script is how pickle/model.pkl gets produced and committed in
the first place, and how it gets regenerated later if the training data
changes.

Usage:
    python train.py [--data-dir DATA_DIR] [--model-path MODEL_PATH]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from forecastiq.core.config import get_settings
from forecastiq.core.logging import configure_logging, get_logger
from forecastiq.models.pipeline import ForecastPipeline


def main() -> None:
    settings = get_settings()
    parser = argparse.ArgumentParser(description="Train the revenue + ROAS models and write pickle/model.pkl.")
    parser.add_argument("--data-dir", default=str(settings.data_dir))
    parser.add_argument("--model-path", default=str(settings.model_path))
    parser.add_argument("--period-days", type=int, default=30)
    args = parser.parse_args()

    configure_logging(settings)
    logger = get_logger("app")

    pipeline = ForecastPipeline(period_days=args.period_days)
    logger.info("Loading training data from %s", args.data_dir)
    df = pipeline.load_data(Path(args.data_dir))

    report = pipeline.validate(df)
    logger.info(
        "Validation before training: %d rows, %d error(s), %d warning(s)",
        report.total_rows,
        len(report.errors),
        len(report.warnings),
    )
    for issue in report.issues:
        logger.info("[%s] %s: %s", issue.severity.value, issue.code, issue.message)

    logger.info("Training revenue + ROAS quantile models...")
    artifacts = pipeline.train(df)

    logger.info("Revenue metrics: %s", artifacts.revenue_metrics.to_dict())
    logger.info("ROAS metrics: %s", artifacts.roas_metrics.to_dict())
    logger.info("Train rows: %d, test rows: %d", artifacts.train_rows, artifacts.test_rows)

    pipeline.save_artifacts(Path(args.model_path))
    logger.info("Saved trained model artifact to %s", args.model_path)


if __name__ == "__main__":
    main()
