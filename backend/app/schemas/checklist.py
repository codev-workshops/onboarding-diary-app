"""Pydantic schemas for onboarding checklists."""

import datetime as dt
import uuid

from pydantic import BaseModel, Field


# --- Checklist Item ---

class ChecklistItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    order: int | None = None


class ChecklistItemResponse(BaseModel):
    id: uuid.UUID
    checklist_id: uuid.UUID
    title: str
    description: str | None
    order: int
    created_at: dt.datetime
    is_completed: bool = False
    completed_at: dt.datetime | None = None

    model_config = {"from_attributes": True}


# --- Checklist Assignment ---

class ChecklistAssignRequest(BaseModel):
    user_id: uuid.UUID


class ChecklistAssignmentResponse(BaseModel):
    id: uuid.UUID
    checklist_id: uuid.UUID
    user_id: uuid.UUID
    assigned_at: dt.datetime
    user_name: str | None = None

    model_config = {"from_attributes": True}


# --- Checklist ---

class ChecklistCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    items: list[ChecklistItemCreate] = []


class ChecklistUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None


class ChecklistResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    created_by: uuid.UUID
    created_at: dt.datetime
    updated_at: dt.datetime
    items: list[ChecklistItemResponse] = []
    assignments: list[ChecklistAssignmentResponse] = []
    progress: float = 0.0

    model_config = {"from_attributes": True}


class ChecklistListResponse(BaseModel):
    items: list[ChecklistResponse]
    total: int
    page: int
    per_page: int


# --- Progress ---

class ChecklistProgressResponse(BaseModel):
    checklist_id: uuid.UUID
    checklist_title: str
    total_items: int
    completed_items: int
    completion_rate: float
    items: list[ChecklistItemResponse]
