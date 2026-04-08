import uuid
import datetime as _dt
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class NoteCreate(BaseModel):
    date: _dt.date
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=1, max_length=10000)
    tags: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        import re

        for tag in v:
            if len(tag) > 30:
                raise ValueError(f"Each tag must be at most 30 characters: '{tag}'")
            if not re.match(r"^[a-zA-Z0-9-]+$", tag):
                raise ValueError(
                    f"Tags must contain only alphanumeric characters and hyphens: '{tag}'"
                )
        return v


class NoteUpdate(BaseModel):
    date: Optional[_dt.date] = None
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    content: Optional[str] = Field(default=None, min_length=1, max_length=10000)
    tags: Optional[list[str]] = Field(default=None, max_length=10)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v
        import re

        for tag in v:
            if len(tag) > 30:
                raise ValueError(f"Each tag must be at most 30 characters: '{tag}'")
            if not re.match(r"^[a-zA-Z0-9-]+$", tag):
                raise ValueError(
                    f"Tags must contain only alphanumeric characters and hyphens: '{tag}'"
                )
        return v


class NoteResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: _dt.date
    title: str
    content: str
    tags: list[str]
    created_at: _dt.datetime
    updated_at: _dt.datetime

    model_config = {"from_attributes": True}


class PaginatedNoteResponse(BaseModel):
    items: list[NoteResponse]
    total: int
    page: int
    per_page: int
