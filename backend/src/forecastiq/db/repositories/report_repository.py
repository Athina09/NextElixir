from __future__ import annotations

from sqlalchemy.orm import Session

from forecastiq.db.models import Report, ReportFormat, ReportType


class ReportRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(
        self,
        *,
        forecast_run_id: int | None,
        report_type: ReportType,
        format: ReportFormat,
        file_path: str,
    ) -> Report:
        report = Report(forecast_run_id=forecast_run_id, report_type=report_type, format=format, file_path=file_path)
        self.session.add(report)
        self.session.commit()
        self.session.refresh(report)
        return report
