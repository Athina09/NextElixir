from forecastiq.core.config import Settings, get_settings


def test_get_settings_is_cached_singleton():
    assert get_settings() is get_settings()


def test_default_paths_are_relative_to_backend_dir():
    settings = Settings()
    assert settings.data_dir.name == "data"
    assert settings.pickle_dir.name == "pickle"
    assert settings.model_path.name == "model.pkl"
    assert settings.output_dir.name == "output"
    assert settings.data_dir.parent == settings.pickle_dir.parent == settings.output_dir.parent


def test_forecast_horizons_match_brief():
    settings = Settings()
    assert settings.forecast_horizons == (30, 60, 90)
