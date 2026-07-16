from fastapi import APIRouter, Depends

from forecastiq.api.deps import get_pipeline
from forecastiq.models.pipeline import ForecastPipeline

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check(pipeline: ForecastPipeline = Depends(get_pipeline)) -> dict:
    model_loaded = pipeline.artifacts is not None
    artifacts = pipeline.artifacts if model_loaded else None
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "model_trained_at": artifacts.trained_at if artifacts else None,
        "schema_version": artifacts.schema_version if artifacts else None,
        "train_rows": artifacts.train_rows if artifacts else None,
        "test_rows": artifacts.test_rows if artifacts else None,
        "revenue_metrics": artifacts.revenue_metrics.to_dict() if artifacts else None,
        "roas_metrics": artifacts.roas_metrics.to_dict() if artifacts else None,
    }
