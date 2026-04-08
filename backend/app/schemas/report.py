import uuid
import datetime as _dt
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ReportType(str, Enum):
    tasks = "tasks"
    issues = "issues"
    feedback = "feedback"
    combined = "combined"


class ReportFormat(str, Enum):
    pdf = "pdf"
    csv = "csv"


class ReportGenerateRequest(BaseModel):
    date_from: _dt.date
    date_to: _dt.date
    report_type: ReportType = Field(alias="type")
    report_format: ReportFormat = Field(alias="format")
    user_id: Optional[uuid.UUID] = None

    model_config = {"populate_by_name": True}


class ReportResponse(BaseModel):
    id: uuid.UUID
    generated_by: uuid.UUID
    target_user_id: Optional[uuid.UUID]
    date_from: _dt.date
    date_to: _dt.date
    report_type: str
    format: str
    created_at: _dt.datetime

    model_config = {"from_attributes": True}


class ReportGenerateResponse(BaseModel):
    report_id: uuid.UUID
    download_url: str


class PaginatedReportResponse(BaseModel):
    items: list[ReportResponse]
    total: int
    page: int
    per_page: int
