from fastapi import APIRouter, Depends

from forecastiq.api.data_store import DataStore
from forecastiq.api.deps import get_data_store, get_pipeline
from forecastiq.models.pipeline import ForecastPipeline
from forecastiq.schemas.validation import ValidationReportSchema

router = APIRouter(prefix="/validation", tags=["validation"])


@router.get("", response_model=ValidationReportSchema)
def get_validation_report(
    pipeline: ForecastPipeline = Depends(get_pipeline),
    data_store: DataStore = Depends(get_data_store),
) -> ValidationReportSchema:
    df = data_store.get()
    report = pipeline.validate(df)
    return ValidationReportSchema(**report.to_dict())
