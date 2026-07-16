from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def real_data_dir() -> Path:
    """The committed sample CSVs (Google/Meta/Bing) — real data, not fixtures."""
    return BACKEND_DIR / "data"
