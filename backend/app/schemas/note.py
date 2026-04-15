import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


class NoteCreate(BaseModel):
    date: date
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=1, max_length=10000)
    tags: list[str] = Field(default_factory=list)

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: date) -> date:
        from datetime import timedelta

        max_future = date.today() + timedelta(days=7)
        if v > max_future:
            raise ValueError("Date cannot be more than 7 days in the future")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        if len(v) > 10:
            raise ValueError("Maximum 10 tags allowed")
        for tag in v:
            if len(tag) > 30:
                raise ValueError(f"Tag '{tag}' exceeds maximum length of 30 characters")
            if not all(c.isalnum() or c == "-" for c in tag):
                raise ValueError(f"Tag '{tag}' must contain only alphanumeric characters and hyphens")
        return v


class NoteUpdate(BaseModel):
    date: date | None = None
    title: str | None = Field(default=None, min_length=3, max_length=200)
    content: str | None = Field(default=None, min_length=1, max_length=10000)
    tags: list[str] | None = None

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

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        if len(v) > 10:
            raise ValueError("Maximum 10 tags allowed")
        for tag in v:
            if len(tag) > 30:
                raise ValueError(f"Tag '{tag}' exceeds maximum length of 30 characters")
            if not all(c.isalnum() or c == "-" for c in tag):
                raise ValueError(f"Tag '{tag}' must contain only alphanumeric characters and hyphens")
        return v


class NoteResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: date
    title: str
    content: str
    tags: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteListResponse(BaseModel):
    items: list[NoteResponse]
    total: int
    page: int
    per_page: int
