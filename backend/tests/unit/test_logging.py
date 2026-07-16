from forecastiq.core.config import Settings
from forecastiq.core.logging import _LOG_CHANNELS, configure_logging, get_logger


def test_configure_logging_creates_one_file_per_channel(tmp_path):
    settings = Settings(log_dir=tmp_path / "logs")
    import forecastiq.core.logging as logging_module

    logging_module._configured = False
    configure_logging(settings)

    for channel in _LOG_CHANNELS:
        logger = get_logger(channel)
        logger.info("smoke test")
        assert (settings.log_dir / f"{channel}.log").exists()


def test_get_logger_rejects_unknown_channel():
    import pytest

    with pytest.raises(ValueError):
        get_logger("not-a-real-channel")
