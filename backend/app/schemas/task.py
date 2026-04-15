import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


TASK_CATEGORIES = ("training", "documentation", "meeting", "setup", "development", "other")
TASK_STATUSES = ("not_started", "in_progress", "completed", "on_hold")
TASK_PRIORITIES = ("low", "medium", "high", "critical")


class TaskCreate(BaseModel):
    date: date
    title: str = Field(min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    category: str
    status: str = "not_started"
    priority: str = "medium"

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in TASK_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(TASK_CATEGORIES)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in TASK_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(TASK_STATUSES)}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v not in TASK_PRIORITIES:
            raise ValueError(f"Priority must be one of: {', '.join(TASK_PRIORITIES)}")
        return v

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: date) -> date:
        from datetime import timedelta

        max_future = date.today() + timedelta(days=7)
        if v > max_future:
            raise ValueError("Date cannot be more than 7 days in the future")
        return v


class TaskUpdate(BaseModel):
    date: date | None = None
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    category: str | None = None
    status: str | None = None
    priority: str | None = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str | None) -> str | None:
        if v is not None and v not in TASK_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(TASK_CATEGORIES)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in TASK_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(TASK_STATUSES)}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str | None) -> str | None:
        if v is not None and v not in TASK_PRIORITIES:
            raise ValueError(f"Priority must be one of: {', '.join(TASK_PRIORITIES)}")
        return v

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: date | None) -> date | None:
        if v is None:
            return v
        from datetime import timedelta

        max_future = date.today() + timedelta(days=7)
        if v > max_future:
            raise ValueError("Date cannot be more than 7 days in the future")
        return v


class TaskResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: date
    title: str
    description: str | None = None
    category: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    per_page: int
