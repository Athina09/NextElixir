def test_get_validation_report_matches_pipeline_shape(client):
    response = client.get("/validation")
    assert response.status_code == 200
    body = response.json()
    assert body["total_rows"] > 0
    assert isinstance(body["is_blocking"], bool)
    assert isinstance(body["issues"], list)
    for issue in body["issues"]:
        assert issue["severity"] in {"error", "warning", "info"}
