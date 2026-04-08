import uuid
import datetime as _dt
from typing import Optional

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    open_issues: int
    total_feedback: int
    total_notes: int
    task_completion_rate: float


class RecentEntry(BaseModel):
    id: uuid.UUID
    entry_type: str
    title: str
    date: _dt.date
    status: Optional[str] = None
    created_at: _dt.datetime


class DashboardResponse(BaseModel):
    summary: DashboardSummary
    recent_entries: list[RecentEntry]


class RecruitSummary(BaseModel):
    user_id: uuid.UUID
    full_name: str
    email: str
    department: Optional[str]
    summary: DashboardSummary


class ManagerDashboardResponse(BaseModel):
    recruits: list[RecruitSummary]
    aggregate_summary: DashboardSummary
