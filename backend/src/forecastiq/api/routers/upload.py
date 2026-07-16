from __future__ import annotations

from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from forecastiq.api.data_store import DataStore
from forecastiq.api.deps import get_app_settings, get_data_store, get_db, get_pipeline
from forecastiq.core.config import Settings
from forecastiq.core.logging import get_logger
from forecastiq.data.ingestion import UnrecognizedPlatformError, detect_channel
from forecastiq.db.repositories.dataset_repository import DatasetRepository
from forecastiq.models.pipeline import ForecastPipeline
from forecastiq.schemas.dataset import DatasetSchema
from forecastiq.schemas.validation import ValidationReportSchema

router = APIRouter(prefix="/datasets", tags=["datasets"])


class DatasetUploadResponseSchema(BaseModel):
    dataset: DatasetSchema
    validation: ValidationReportSchema


@router.get("", response_model=list[DatasetSchema])
def list_datasets(db: Session = Depends(get_db)) -> list[DatasetSchema]:
    datasets = DatasetRepository(db).list_recent()
    return [DatasetSchema.from_orm_dataset(d) for d in datasets]


@router.post("/upload", response_model=DatasetUploadResponseSchema)
async def upload_dataset(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_app_settings),
    pipeline: ForecastPipeline = Depends(get_pipeline),
    data_store: DataStore = Depends(get_data_store),
    db: Session = Depends(get_db),
) -> DatasetUploadResponseSchema:
    logger = get_logger("api")

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    # Strip any path components the client might send — never trust a path from
    # the request when writing into settings.data_dir.
    safe_name = Path(file.filename).name
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    destination = settings.data_dir / safe_name

    contents = await file.read()
    destination.write_bytes(contents)

    try:
        preview = pd.read_csv(destination, index_col=0)
        channel = detect_channel(preview)
    except UnrecognizedPlatformError as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - surface any parse failure as a 422, not a 500
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"Could not parse {safe_name}: {exc}") from exc

    df = data_store.refresh()
    report = pipeline.validate(df)

    dataset = DatasetRepository(db).create(
        filename=safe_name,
        channel=channel.value,
        row_count=len(preview),
        validation_report=report.to_dict(),
    )
    logger.info("Uploaded dataset %s (%s, %d rows)", safe_name, channel.value, len(preview))

    return DatasetUploadResponseSchema(
        dataset=DatasetSchema.from_orm_dataset(dataset),
        validation=ValidationReportSchema(**report.to_dict()),
    )
