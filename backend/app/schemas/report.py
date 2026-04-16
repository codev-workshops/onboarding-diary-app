import uuid
from datetime import date, datetime

from pydantic import BaseModel, field_validator


class ReportGenerate(BaseModel):
    date_from: date
    date_to: date
    type: str
    format: str
    user_id: uuid.UUID | None = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {"tasks", "issues", "feedback", "combined"}
        if v not in allowed:
            raise ValueError(f"type must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("format")
    @classmethod
    def validate_format(cls, v: str) -> str:
        allowed = {"pdf", "csv"}
        if v not in allowed:
            raise ValueError(f"format must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("date_to")
    @classmethod
    def validate_date_range(cls, v: date, info) -> date:
        date_from = info.data.get("date_from")
        if date_from and v < date_from:
            raise ValueError("date_to must be >= date_from")
        if date_from and (v - date_from).days > 365:
            raise ValueError("Date range cannot exceed 365 days")
        return v


class ReportResponse(BaseModel):
    id: uuid.UUID
    generated_by: uuid.UUID
    target_user_id: uuid.UUID | None
    date_from: date
    date_to: date
    report_type: str
    format: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportListResponse(BaseModel):
    items: list[ReportResponse]
    total: int
    page: int
    per_page: int
