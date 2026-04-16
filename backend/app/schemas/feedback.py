import datetime as dt
import uuid

from pydantic import BaseModel, Field, field_validator


FEEDBACK_TYPES = ("positive", "suggestion", "concern")


class FeedbackCreate(BaseModel):
    date: dt.date
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
    def validate_date(cls, v: dt.date) -> dt.date:
        max_future = dt.date.today() + dt.timedelta(days=7)
        if v > max_future:
            raise ValueError("Date cannot be more than 7 days in the future")
        return v


class FeedbackUpdate(BaseModel):
    date: dt.date | None = None
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
    def validate_date(cls, v: dt.date | None) -> dt.date | None:
        if v is None:
            return v
        max_future = dt.date.today() + dt.timedelta(days=7)
        if v > max_future:
            raise ValueError("Date cannot be more than 7 days in the future")
        return v


class FeedbackResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: dt.date
    subject: str
    type: str
    details: str
    created_at: dt.datetime
    updated_at: dt.datetime

    model_config = {"from_attributes": True}


class FeedbackListResponse(BaseModel):
    items: list[FeedbackResponse]
    total: int
    page: int
    per_page: int
