import uuid
import datetime as _dt
from enum import Enum
from typing import Optional

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
    resolution_notes: Optional[str] = Field(default=None, max_length=5000)

    @model_validator(mode="after")
    def validate_resolution_notes(self) -> "IssueCreate":
        if self.status in (IssueStatus.resolved, IssueStatus.closed):
            if not self.resolution_notes:
                raise ValueError(
                    "Resolution notes are required when status is resolved or closed"
                )
        return self


class IssueUpdate(BaseModel):
    date: Optional[_dt.date] = None
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, min_length=10, max_length=5000)
    severity: Optional[IssueSeverity] = None
    status: Optional[IssueStatus] = None
    resolution_notes: Optional[str] = Field(default=None, max_length=5000)


class IssueResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: _dt.date
    title: str
    description: str
    severity: str
    status: str
    resolution_notes: Optional[str]
    created_at: _dt.datetime
    updated_at: _dt.datetime

    model_config = {"from_attributes": True}


class PaginatedIssueResponse(BaseModel):
    items: list[IssueResponse]
    total: int
    page: int
    per_page: int
