from __future__ import annotations

from pydantic import BaseModel


class DatasetSchema(BaseModel):
    id: int
    filename: str
    channel: str | None
    row_count: int
    uploaded_at: str

    @classmethod
    def from_orm_dataset(cls, dataset) -> "DatasetSchema":
        return cls(
            id=dataset.id,
            filename=dataset.filename,
            channel=dataset.channel,
            row_count=dataset.row_count,
            uploaded_at=dataset.uploaded_at.isoformat(),
        )
