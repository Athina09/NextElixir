from fastapi import APIRouter, Depends

from forecastiq.api.deps import get_pipeline
from forecastiq.models.pipeline import ForecastPipeline

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check(pipeline: ForecastPipeline = Depends(get_pipeline)) -> dict:
    model_loaded = pipeline.artifacts is not None
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "model_trained_at": pipeline.artifacts.trained_at if model_loaded else None,
        "schema_version": pipeline.artifacts.schema_version if model_loaded else None,
    }
