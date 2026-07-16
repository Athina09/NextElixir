"""Rotating file logging, configured once at process start.

Five channels, matching the operational surfaces that actually need independent
log streams: general application events, inbound API requests, model
predictions, latency/performance timing, and uncaught exceptions.
"""

import logging
import sys
from logging.handlers import RotatingFileHandler

from forecastiq.core.config import Settings

_LOG_CHANNELS = ("app", "api", "prediction", "performance", "exception")
_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_configured = False


def configure_logging(settings: Settings) -> None:
    """Idempotent — safe to call from the FastAPI app, train.py, or the run.sh scripts alike."""
    global _configured
    if _configured:
        return

    settings.log_dir.mkdir(parents=True, exist_ok=True)
    formatter = logging.Formatter(_FORMAT)
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    root = logging.getLogger("forecastiq")
    root.setLevel(level)
    root.propagate = False

    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    root.addHandler(console)

    for channel in _LOG_CHANNELS:
        logger = logging.getLogger(f"forecastiq.{channel}")
        logger.setLevel(logging.ERROR if channel == "exception" else level)
        logger.propagate = True
        handler = RotatingFileHandler(
            settings.log_dir / f"{channel}.log",
            maxBytes=5 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    _configured = True


def get_logger(channel: str) -> logging.Logger:
    """channel is one of: app, api, prediction, performance, exception."""
    if channel not in _LOG_CHANNELS:
        raise ValueError(f"Unknown log channel {channel!r}; expected one of {_LOG_CHANNELS}")
    return logging.getLogger(f"forecastiq.{channel}")
