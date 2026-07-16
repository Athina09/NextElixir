def test_rerun_creates_a_new_history_entry(client):
    create = client.post(
        "/forecast",
        json={"horizon": 60, "budget": {"google": 400_000, "meta": 200_000, "microsoft": 100_000}},
    )
    assert create.status_code == 200

    before = client.get("/forecast-runs").json()
    run_id = before[0]["id"].removeprefix("F-")

    rerun = client.post(f"/forecast-runs/{run_id}/rerun")
    assert rerun.status_code == 200
    assert rerun.json()["horizon"] == 60

    after = client.get("/forecast-runs").json()
    assert len(after) == len(before) + 1


def test_rerun_unknown_run_is_404(client):
    response = client.post("/forecast-runs/999999/rerun")
    assert response.status_code == 404


def test_delete_forecast_run(client):
    create = client.post(
        "/forecast",
        json={"horizon": 30, "budget": {"google": 100_000, "meta": 50_000, "microsoft": 25_000}},
    )
    assert create.status_code == 200
    run_id = client.get("/forecast-runs").json()[0]["id"].removeprefix("F-")

    delete = client.delete(f"/forecast-runs/{run_id}")
    assert delete.status_code == 200
    assert delete.json()["deleted"] is True

    delete_again = client.delete(f"/forecast-runs/{run_id}")
    assert delete_again.status_code == 404
