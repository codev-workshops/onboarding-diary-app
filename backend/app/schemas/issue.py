import datetime as dt
import uuid

from pydantic import BaseModel, Field, field_validator, model_validator


ISSUE_SEVERITIES = ("low", "medium", "high", "critical")
ISSUE_STATUSES = ("open", "in_progress", "resolved", "closed")


class IssueCreate(BaseModel):
    date: dt.date
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    severity: str
    status: str = "open"
    resolution_notes: str | None = Field(default=None, max_length=5000)

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: str) -> str:
        if v not in ISSUE_SEVERITIES:
            raise ValueError(f"Severity must be one of: {', '.join(ISSUE_SEVERITIES)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ISSUE_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(ISSUE_STATUSES)}")
        return v

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: dt.date) -> dt.date:
        max_future = dt.date.today() + dt.timedelta(days=7)
        if v > max_future:
            raise ValueError("Date cannot be more than 7 days in the future")
        return v

    @model_validator(mode="after")
    def validate_resolution_notes(self) -> "IssueCreate":
        if self.status in ("resolved", "closed") and not self.resolution_notes:
            raise ValueError("Resolution notes are required when status is resolved or closed")
        return self


class IssueUpdate(BaseModel):
    date: dt.date | None = None
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10, max_length=5000)
    severity: str | None = None
    status: str | None = None
    resolution_notes: str | None = Field(default=None, max_length=5000)

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: str | None) -> str | None:
        if v is not None and v not in ISSUE_SEVERITIES:
            raise ValueError(f"Severity must be one of: {', '.join(ISSUE_SEVERITIES)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in ISSUE_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(ISSUE_STATUSES)}")
        return v

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: dt.date | None) -> dt.date | None:
        if v is None:
            return v
        max_future = dt.date.today() + dt.timedelta(days=7)
        if v > max_future:
            raise ValueError("Date cannot be more than 7 days in the future")
        return v


class IssueResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: dt.date
    title: str
    description: str
    severity: str
    status: str
    resolution_notes: str | None = None
    created_at: dt.datetime
    updated_at: dt.datetime

    model_config = {"from_attributes": True}


class IssueListResponse(BaseModel):
    items: list[IssueResponse]
    total: int
    page: int
    per_page: int
