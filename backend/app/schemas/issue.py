import datetime as _dt
import uuid
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class IssueSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class IssueStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class IssueCreate(BaseModel):
    date: _dt.date
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    severity: IssueSeverity
    status: IssueStatus = IssueStatus.open
    resolution_notes: str | None = Field(default=None, max_length=5000)

    @model_validator(mode="after")
    def validate_resolution_notes(self) -> "IssueCreate":
        if self.status in (IssueStatus.resolved, IssueStatus.closed):
            if not self.resolution_notes:
                raise ValueError("Resolution notes are required when status is resolved or closed")
        return self


class IssueUpdate(BaseModel):
    date: _dt.date | None = None
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10, max_length=5000)
    severity: IssueSeverity | None = None
    status: IssueStatus | None = None
    resolution_notes: str | None = Field(default=None, max_length=5000)


class IssueResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: _dt.date
    title: str
    description: str
    severity: str
    status: str
    resolution_notes: str | None
    created_at: _dt.datetime
    updated_at: _dt.datetime

    model_config = {"from_attributes": True}


class PaginatedIssueResponse(BaseModel):
    items: list[IssueResponse]
    total: int
    page: int
    per_page: int
