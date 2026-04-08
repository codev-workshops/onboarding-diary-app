import datetime as _dt
import uuid

from pydantic import BaseModel, Field


class SearchResultItem(BaseModel):
    id: uuid.UUID
    entry_type: str  # "task", "issue", "feedback", "note"
    title: str
    snippet: str = ""
    date: _dt.date
    status: str | None = None
    category: str | None = None
    severity: str | None = None
    feedback_type: str | None = None
    tags: list[str] | None = None
    created_at: _dt.datetime

    model_config = {"from_attributes": True}


class SearchResponse(BaseModel):
    query: str
    total: int
    items: list[SearchResultItem] = Field(default_factory=list)
    page: int = 1
    per_page: int = 20
