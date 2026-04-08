import uuid
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class TaskCategory(str, Enum):
    training = "training"
    documentation = "documentation"
    meeting = "meeting"
    setup = "setup"
    development = "development"
    other = "other"


class TaskStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"
    on_hold = "on_hold"


class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class TaskCreate(BaseModel):
    date: date
    title: str = Field(min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    category: TaskCategory
    status: TaskStatus = TaskStatus.not_started
    priority: TaskPriority = TaskPriority.medium


class TaskUpdate(BaseModel):
    date: date | None = None
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    category: TaskCategory | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: date
    title: str
    description: str | None
    category: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedTaskResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    per_page: int
