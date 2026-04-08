"""Pydantic schemas for analytics endpoints."""

import datetime as _dt

from pydantic import BaseModel, Field


class DateCount(BaseModel):
    date: _dt.date
    count: int


class TaskCompletionOverTime(BaseModel):
    data: list[DateCount] = Field(default_factory=list)


class SeverityCount(BaseModel):
    severity: str
    count: int


class IssuesBySeverity(BaseModel):
    data: list[SeverityCount] = Field(default_factory=list)


class FeedbackTypeCount(BaseModel):
    feedback_type: str
    count: int


class FeedbackDistribution(BaseModel):
    data: list[FeedbackTypeCount] = Field(default_factory=list)


class ActivityDay(BaseModel):
    date: _dt.date
    count: int


class ActivityTimeline(BaseModel):
    data: list[ActivityDay] = Field(default_factory=list)


class AnalyticsResponse(BaseModel):
    task_completion: TaskCompletionOverTime
    issues_by_severity: IssuesBySeverity
    feedback_distribution: FeedbackDistribution
    activity_timeline: ActivityTimeline
