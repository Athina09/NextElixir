import pytest

from validate_submission import (
    check_data_dir_exists,
    check_model_pickle_loads,
    check_no_absolute_paths_in_run_sh,
    check_no_hardcoded_filenames,
    check_requirements_pinned,
    check_run_sh_present_and_executable,
    main,
)


@pytest.mark.slow
def test_full_validator_passes_on_this_repo():
    assert main() == 0


def test_individual_checks_pass():
    for check_fn in (
        check_run_sh_present_and_executable,
        check_requirements_pinned,
        check_data_dir_exists,
        check_no_hardcoded_filenames,
        check_model_pickle_loads,
        check_no_absolute_paths_in_run_sh,
    ):
        check = check_fn()
        assert check.ok, f"{check.name}: {check.detail}"
