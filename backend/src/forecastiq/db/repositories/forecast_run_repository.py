from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from forecastiq.db.models import ForecastRun, RunStatus


class ForecastRunRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(
        self,
        *,
        horizon_days: int,
        budget: dict,
        result: dict,
        revenue_p50: float,
        roas_p50: float,
        confidence: float,
        status: RunStatus = RunStatus.COMPLETED,
    ) -> ForecastRun:
        run = ForecastRun(
            horizon_days=horizon_days,
            budget=budget,
            result=result,
            revenue_p50=revenue_p50,
            roas_p50=roas_p50,
            confidence=confidence,
            status=status,
        )
        self.session.add(run)
        self.session.commit()
        self.session.refresh(run)
        return run

    def list_recent(self, limit: int = 50) -> list[ForecastRun]:
        # id.desc() as the primary sort, not created_at: two runs created within the
        # same timestamp-resolution tick would otherwise sort arbitrarily.
        stmt = select(ForecastRun).order_by(ForecastRun.id.desc()).limit(limit)
        return list(self.session.scalars(stmt))

    def get(self, run_id: int) -> ForecastRun | None:
        return self.session.get(ForecastRun, run_id)

    def delete(self, run_id: int) -> bool:
        run = self.get(run_id)
        if run is None:
            return False
        self.session.delete(run)
        self.session.commit()
        return True
