import uuid
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class FeedbackType(str, Enum):
    positive = "positive"
    suggestion = "suggestion"
    concern = "concern"


class FeedbackCreate(BaseModel):
    date: date
    subject: str = Field(min_length=3, max_length=200)
    feedback_type: FeedbackType = Field(alias="type")
    details: str = Field(min_length=10, max_length=5000)

    model_config = {"populate_by_name": True}


class FeedbackUpdate(BaseModel):
    date: date | None = None
    subject: str | None = Field(default=None, min_length=3, max_length=200)
    feedback_type: FeedbackType | None = Field(default=None, alias="type")
    details: str | None = Field(default=None, min_length=10, max_length=5000)

    model_config = {"populate_by_name": True}


class FeedbackResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: date
    subject: str
    type: str = Field(validation_alias="feedback_type")
    details: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class PaginatedFeedbackResponse(BaseModel):
    items: list[FeedbackResponse]
    total: int
    page: int
    per_page: int
