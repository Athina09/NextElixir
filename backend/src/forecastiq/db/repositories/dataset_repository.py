from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from forecastiq.db.models import Dataset


class DatasetRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, *, filename: str, channel: str | None, row_count: int, validation_report: dict) -> Dataset:
        dataset = Dataset(filename=filename, channel=channel, row_count=row_count, validation_report=validation_report)
        self.session.add(dataset)
        self.session.commit()
        self.session.refresh(dataset)
        return dataset

    def list_recent(self, limit: int = 50) -> list[Dataset]:
        stmt = select(Dataset).order_by(Dataset.uploaded_at.desc()).limit(limit)
        return list(self.session.scalars(stmt))
