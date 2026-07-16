import shutil

import pytest
from fastapi.testclient import TestClient

from forecastiq.api.main import create_app
from forecastiq.core.config import Settings


@pytest.fixture
def upload_client(real_data_dir, tmp_path):
    """A throwaway copy of the sample data dir so upload tests never write into
    the real committed backend/data/ folder."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    for csv_file in real_data_dir.glob("*.csv"):
        shutil.copy(csv_file, data_dir / csv_file.name)

    settings = Settings(
        database_url="sqlite:///:memory:",
        data_dir=data_dir,
        model_path=real_data_dir.parent / "pickle" / "model.pkl",
    )
    app = create_app(settings)
    with TestClient(app) as c:
        yield c, data_dir


def test_upload_new_csv_is_ingested_and_validated(upload_client):
    client, data_dir = upload_client
    csv_content = (
        ",campaign_id,segments_date,metrics_clicks,metrics_conversions,metrics_cost_micros,"
        "metrics_impressions,metrics_video_views,metrics_conversions_value,"
        "campaign_advertising_channel_type,campaign_budget_amount,campaign_name\n"
        "0,999999,2026-06-10,10,1.0,5000000,100,0,50.0,SEARCH,20.0,Search_Extra_Campaign\n"
    )

    response = client.post("/datasets/upload", files={"file": ("extra_google.csv", csv_content, "text/csv")})

    assert response.status_code == 200
    body = response.json()
    assert body["validation"]["total_rows"] > 0
    assert body["dataset"]["filename"] == "extra_google.csv"
    assert body["dataset"]["channel"] == "Google Ads"
    assert (data_dir / "extra_google.csv").exists()


def test_list_datasets_returns_uploaded_files(upload_client):
    client, _ = upload_client
    csv_content = (
        ",campaign_id,segments_date,metrics_clicks,metrics_conversions,metrics_cost_micros,"
        "metrics_impressions,metrics_video_views,metrics_conversions_value,"
        "campaign_advertising_channel_type,campaign_budget_amount,campaign_name\n"
        "0,999997,2026-06-10,5,1.0,3000000,50,0,25.0,SEARCH,15.0,Search_Extra_Campaign_3\n"
    )
    client.post("/datasets/upload", files={"file": ("extra_google_3.csv", csv_content, "text/csv")})

    response = client.get("/datasets")
    assert response.status_code == 200
    filenames = [d["filename"] for d in response.json()]
    assert "extra_google_3.csv" in filenames


def test_upload_rejects_non_csv(upload_client):
    client, _ = upload_client
    response = client.post("/datasets/upload", files={"file": ("notes.txt", b"hello", "text/plain")})
    assert response.status_code == 400


def test_upload_rejects_unrecognized_schema_and_does_not_leave_the_file_behind(upload_client):
    client, data_dir = upload_client
    response = client.post("/datasets/upload", files={"file": ("mystery.csv", "foo,bar\n1,2\n", "text/csv")})

    assert response.status_code == 422
    assert not (data_dir / "mystery.csv").exists()


@pytest.mark.parametrize("report_format,expected_prefix", [("pdf", b"%PDF"), ("csv", b"Data Quality Report")])
def test_download_data_quality_report(upload_client, report_format, expected_prefix):
    client, _ = upload_client
    csv_content = (
        ",campaign_id,segments_date,metrics_clicks,metrics_conversions,metrics_cost_micros,"
        "metrics_impressions,metrics_video_views,metrics_conversions_value,"
        "campaign_advertising_channel_type,campaign_budget_amount,campaign_name\n"
        "0,999996,2026-06-10,5,1.0,3000000,50,0,25.0,SEARCH,15.0,Search_Extra_Campaign_4\n"
    )
    client.post("/datasets/upload", files={"file": ("extra_google_4.csv", csv_content, "text/csv")})

    response = client.get(f"/datasets/report?format={report_format}")

    assert response.status_code == 200
    assert response.content.startswith(expected_prefix)
    assert "attachment" in response.headers["content-disposition"]


def test_download_data_quality_report_excel(upload_client):
    client, _ = upload_client
    response = client.get("/datasets/report?format=excel")
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers["content-type"]
    assert len(response.content) > 0


def test_upload_reflects_immediately_in_forecast_without_retraining(upload_client):
    client, data_dir = upload_client
    csv_content = (
        ",campaign_id,segments_date,metrics_clicks,metrics_conversions,metrics_cost_micros,"
        "metrics_impressions,metrics_video_views,metrics_conversions_value,"
        "campaign_advertising_channel_type,campaign_budget_amount,campaign_name\n"
        "0,999998,2026-06-10,20,2.0,8000000,200,0,90.0,SEARCH,30.0,Search_Extra_Campaign_2\n"
    )
    upload_response = client.post("/datasets/upload", files={"file": ("extra_google_2.csv", csv_content, "text/csv")})
    assert upload_response.status_code == 200

    forecast_response = client.post(
        "/forecast",
        json={"horizon": 30, "budget": {"google": 500_000, "meta": 300_000, "microsoft": 100_000}},
    )
    assert forecast_response.status_code == 200
