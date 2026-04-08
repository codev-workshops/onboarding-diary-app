import uuid
import datetime as _dt
from enum import Enum
from typing import Optional

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
    date: _dt.date
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, max_length=5000)
    category: TaskCategory
    status: TaskStatus = TaskStatus.not_started
    priority: TaskPriority = TaskPriority.medium


class TaskUpdate(BaseModel):
    date: Optional[_dt.date] = None
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, max_length=5000)
    category: Optional[TaskCategory] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: _dt.date
    title: str
    description: Optional[str]
    category: str
    status: str
    priority: str
    created_at: _dt.datetime
    updated_at: _dt.datetime

    model_config = {"from_attributes": True}


class PaginatedTaskResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    per_page: int
