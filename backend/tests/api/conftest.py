import pytest
from fastapi.testclient import TestClient

from forecastiq.api.main import create_app
from forecastiq.core.config import Settings


@pytest.fixture(scope="module")
def app_settings(real_data_dir):
    backend_dir = real_data_dir.parent
    return Settings(
        database_url="sqlite:///:memory:",
        data_dir=real_data_dir,
        model_path=backend_dir / "pickle" / "model.pkl",
        # Explicitly unconfigured regardless of a real key in the developer's local
        # .env — most API tests (and the "Groq not configured" tests specifically)
        # must be deterministic, not dependent on ambient environment state.
        groq_api_key=None,
    )


@pytest.fixture(scope="module")
def client(app_settings):
    app = create_app(app_settings)
    with TestClient(app) as c:
        yield c
