import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


FEEDBACK_TYPES = ("positive", "suggestion", "concern")


class FeedbackCreate(BaseModel):
    date: date
    subject: str = Field(min_length=3, max_length=200)
    type: str
    details: str = Field(min_length=10, max_length=5000)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in FEEDBACK_TYPES:
            raise ValueError(f"Type must be one of: {', '.join(FEEDBACK_TYPES)}")
        return v

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: date) -> date:
        from datetime import timedelta

        max_future = date.today() + timedelta(days=7)
        if v > max_future:
            raise ValueError("Date cannot be more than 7 days in the future")
        return v


class FeedbackUpdate(BaseModel):
    date: date | None = None
    subject: str | None = Field(default=None, min_length=3, max_length=200)
    type: str | None = None
    details: str | None = Field(default=None, min_length=10, max_length=5000)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str | None) -> str | None:
        if v is not None and v not in FEEDBACK_TYPES:
            raise ValueError(f"Type must be one of: {', '.join(FEEDBACK_TYPES)}")
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


class FeedbackResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: date
    subject: str
    type: str
    details: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FeedbackListResponse(BaseModel):
    items: list[FeedbackResponse]
    total: int
    page: int
    per_page: int
