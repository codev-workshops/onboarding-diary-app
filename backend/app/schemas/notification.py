"""Pydantic schemas for notifications."""

import datetime as dt
import uuid

from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    user_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    type: str = "info"
    reference_type: str | None = None
    reference_id: uuid.UUID | None = None


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    type: str
    reference_type: str | None
    reference_id: uuid.UUID | None
    is_read: bool
    created_at: dt.datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    unread_count: int
    page: int
    per_page: int
