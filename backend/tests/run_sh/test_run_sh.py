import os
import subprocess
import sys
from pathlib import Path

import pandas as pd
import pytest

BACKEND_DIR = Path(__file__).resolve().parents[2]


@pytest.mark.slow
def test_run_sh_end_to_end_with_defaults(tmp_path):
    output_path = tmp_path / "predictions.csv"
    env = dict(os.environ)
    env["PATH"] = str(Path(sys.executable).resolve().parent) + os.pathsep + env.get("PATH", "")

    result = subprocess.run(
        ["bash", str(BACKEND_DIR / "run.sh"), str(BACKEND_DIR / "data"), str(BACKEND_DIR / "pickle" / "model.pkl"), str(output_path)],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
        env=env,
        timeout=300,
    )

    assert result.returncode == 0, result.stderr
    assert output_path.exists()

    predictions = pd.read_csv(output_path)
    assert set(predictions["horizon_days"].unique()) == {30, 60, 90}
    assert "aggregate" in predictions["level"].unique()
    assert (predictions.loc[predictions["level"] == "aggregate", "revenue_p50"] > 0).all()


@pytest.mark.slow
def test_run_sh_is_independent_of_input_filenames(tmp_path):
    """Renaming the input CSVs must not break anything — the guide overwrites
    data/ with held-out test data using the same schema but not necessarily the
    same filenames."""
    renamed_dir = tmp_path / "renamed_data"
    renamed_dir.mkdir()
    for source_name, new_name in (
        ("google_ads_campaign_stats.csv", "held_out_a.csv"),
        ("meta_ads_campaign_stats.csv", "held_out_b.csv"),
        ("bing_campaign_stats.csv", "held_out_c.csv"),
    ):
        (renamed_dir / new_name).write_bytes((BACKEND_DIR / "data" / source_name).read_bytes())

    output_path = tmp_path / "predictions.csv"
    env = dict(os.environ)
    env["PATH"] = str(Path(sys.executable).resolve().parent) + os.pathsep + env.get("PATH", "")

    result = subprocess.run(
        ["bash", str(BACKEND_DIR / "run.sh"), str(renamed_dir), str(BACKEND_DIR / "pickle" / "model.pkl"), str(output_path)],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
        env=env,
        timeout=300,
    )

    assert result.returncode == 0, result.stderr
    assert output_path.exists()
