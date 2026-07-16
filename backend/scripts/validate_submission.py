#!/usr/bin/env python
"""Automates the Hackathon Submission Guide's Section 9 checklist.

Run from the backend/ directory: `python scripts/validate_submission.py`.
Exits non-zero if anything required is missing so it can be wired into CI.
"""

from __future__ import annotations

import pickle
import re
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Check:
    def __init__(self, name: str) -> None:
        self.name = name
        self.ok = False
        self.detail = ""

    def passed(self, detail: str = "") -> "Check":
        self.ok = True
        self.detail = detail
        return self

    def failed(self, detail: str) -> "Check":
        self.ok = False
        self.detail = detail
        return self


def check_run_sh_present_and_executable() -> Check:
    check = Check("run.sh present at root, executable")
    path = BACKEND_DIR / "run.sh"
    if not path.exists():
        return check.failed("run.sh does not exist")
    import os

    if not os.access(path, os.X_OK):
        return check.failed("run.sh exists but is not executable (run: chmod +x run.sh)")
    return check.passed(
        f"{path} — note: on a Windows dev machine, verify the executable bit survives "
        "`git add`/commit (e.g. `git update-index --chmod=+x run.sh`) since the grading "
        "machine is Linux and reads the bit stored in git, not this local filesystem."
    )


def check_requirements_pinned() -> Check:
    check = Check("requirements.txt has every dependency pinned (==)")
    path = BACKEND_DIR / "requirements.txt"
    if not path.exists():
        return check.failed("requirements.txt is missing")
    unpinned = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "==" not in line:
            unpinned.append(line)
    if unpinned:
        return check.failed(f"unpinned dependencies: {unpinned}")
    return check.passed(f"{len(path.read_text().splitlines())} lines, all pinned")


def check_data_dir_exists() -> Check:
    check = Check("data/ folder exists with at least one CSV")
    data_dir = BACKEND_DIR / "data"
    if not data_dir.exists():
        return check.failed("data/ does not exist")
    csvs = list(data_dir.glob("*.csv"))
    if not csvs:
        return check.failed("data/ has no CSV files")
    return check.passed(f"{len(csvs)} CSV file(s)")


def check_no_hardcoded_filenames() -> Check:
    check = Check("code reads data/ dynamically (no hardcoded sample filenames)")
    known_filenames = ("google_ads_campaign_stats.csv", "meta_ads_campaign_stats.csv", "bing_campaign_stats.csv")
    offenders = []
    for py_file in (BACKEND_DIR / "src").rglob("*.py"):
        text = py_file.read_text(encoding="utf-8", errors="ignore")
        for name in known_filenames:
            if name in text:
                offenders.append(f"{py_file.relative_to(BACKEND_DIR)} references {name!r}")
    if offenders:
        return check.failed("; ".join(offenders))
    return check.passed("no sample filenames referenced in src/")


def check_model_pickle_loads() -> Check:
    check = Check("pickle/model.pkl exists and loads cleanly")
    model_path = BACKEND_DIR / "pickle" / "model.pkl"
    if not model_path.exists():
        return check.failed("pickle/model.pkl does not exist")
    try:
        sys.path.insert(0, str(BACKEND_DIR / "src"))
        with open(model_path, "rb") as f:
            artifacts = pickle.load(f)
    except Exception as exc:  # noqa: BLE001 - report any unpickling failure verbatim
        return check.failed(f"failed to unpickle: {exc!r}")
    return check.passed(f"schema_version={getattr(artifacts, 'schema_version', '?')}")


def check_no_absolute_paths_in_run_sh() -> Check:
    check = Check("run.sh contains no hardcoded developer-machine absolute paths")
    text = (BACKEND_DIR / "run.sh").read_text()
    # Only flag genuine red flags (a real user/home path or a Windows drive letter) —
    # not every "/" in the file, since $SCRIPT_DIR/data etc. are legitimate relative
    # constructs built from a runtime-computed base path.
    suspicious = re.findall(r"/(?:Users|home)/\S*|[A-Za-z]:\\\\?\S*", text)
    if suspicious:
        return check.failed(f"possible hardcoded absolute paths: {suspicious}")
    return check.passed("only $SCRIPT_DIR-relative paths found")


def check_run_sh_end_to_end(tmp_output: Path) -> Check:
    """Assumes dependencies are already installed in the interpreter running this
    validator (`pip install -r requirements.txt` first) — mirrors the guide's own
    sequence (install, then run), it doesn't redo the install for you."""
    import os

    check = Check("run.sh runs end-to-end and produces output")
    env = dict(os.environ)
    interpreter_dir = str(Path(sys.executable).resolve().parent)
    env["PATH"] = interpreter_dir + os.pathsep + env.get("PATH", "")
    try:
        subprocess.run(
            ["bash", str(BACKEND_DIR / "run.sh"), str(BACKEND_DIR / "data"), str(BACKEND_DIR / "pickle" / "model.pkl"), str(tmp_output)],
            cwd=BACKEND_DIR,
            check=True,
            capture_output=True,
            text=True,
            timeout=300,
            env=env,
        )
    except subprocess.CalledProcessError as exc:
        return check.failed(f"run.sh exited {exc.returncode}: {exc.stderr[-2000:]}")
    except subprocess.TimeoutExpired:
        return check.failed("run.sh did not finish within 300s")
    if not tmp_output.exists():
        return check.failed(f"{tmp_output} was not created")
    return check.passed(f"{tmp_output} created ({tmp_output.stat().st_size} bytes)")


def main() -> int:
    import tempfile

    with tempfile.TemporaryDirectory() as tmp_dir:
        checks = [
            check_run_sh_present_and_executable(),
            check_requirements_pinned(),
            check_data_dir_exists(),
            check_no_hardcoded_filenames(),
            check_model_pickle_loads(),
            check_no_absolute_paths_in_run_sh(),
            check_run_sh_end_to_end(Path(tmp_dir) / "predictions.csv"),
        ]

    all_ok = True
    for c in checks:
        status = "PASS" if c.ok else "FAIL"
        print(f"[{status}] {c.name}: {c.detail}")
        all_ok = all_ok and c.ok

    print()
    print("ALL CHECKS PASSED" if all_ok else "SUBMISSION NOT READY — see FAIL lines above")
    return 0 if all_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
