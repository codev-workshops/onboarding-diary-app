"""Analytics endpoints — charts data for task completion, issues, feedback, activity."""

import datetime as _dt

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Date, case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.access import get_accessible_user_ids
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.feedback import Feedback
from app.models.issue import Issue
from app.models.note import Note
from app.models.task import Task
from app.models.user import User
from app.schemas.analytics import (
    ActivityDay,
    ActivityTimeline,
    AnalyticsResponse,
    DateCount,
    FeedbackDistribution,
    FeedbackTypeCount,
    IssuesBySeverity,
    SeverityCount,
    TaskCompletionOverTime,
)

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


def _default_date_range() -> tuple[_dt.date, _dt.date]:
    """Return sensible defaults: last 30 days."""
    end = _dt.date.today()
    start = end - _dt.timedelta(days=30)
    return start, end


@router.get("/", response_model=AnalyticsResponse)
async def get_analytics(
    start_date: _dt.date | None = Query(default=None, description="Start date (inclusive)"),
    end_date: _dt.date | None = Query(default=None, description="End date (inclusive)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsResponse:
    """Return all analytics data for the authenticated user's accessible scope."""
    accessible_ids = await get_accessible_user_ids(current_user, db)

    default_start, default_end = _default_date_range()
    start = start_date or default_start
    end = end_date or default_end

    task_completion = await _task_completion_over_time(db, accessible_ids, start, end)
    issues_severity = await _issues_by_severity(db, accessible_ids, start, end)
    feedback_dist = await _feedback_distribution(db, accessible_ids, start, end)
    activity = await _activity_timeline(db, accessible_ids, start, end)

    return AnalyticsResponse(
        task_completion=task_completion,
        issues_by_severity=issues_severity,
        feedback_distribution=feedback_dist,
        activity_timeline=activity,
    )


async def _task_completion_over_time(
    db: AsyncSession,
    accessible_ids: list | None,
    start: _dt.date,
    end: _dt.date,
) -> TaskCompletionOverTime:
    """Count tasks completed per day within the date range."""
    query = (
        select(
            Task.date.label("day"),
            func.count().label("total"),
            func.sum(case((Task.status == "completed", 1), else_=0)).label("completed"),
        )
        .where(Task.date >= start, Task.date <= end)
        .group_by(Task.date)
        .order_by(Task.date)
    )
    if accessible_ids is not None:
        query = query.where(Task.user_id.in_(accessible_ids))

    result = await db.execute(query)
    rows = result.all()

    data = [DateCount(date=row.day, count=row.completed) for row in rows]

    # Fill gaps with zero counts
    data = _fill_date_gaps(data, start, end)

    return TaskCompletionOverTime(data=data)


async def _issues_by_severity(
    db: AsyncSession,
    accessible_ids: list | None,
    start: _dt.date,
    end: _dt.date,
) -> IssuesBySeverity:
    """Count issues grouped by severity."""
    query = (
        select(Issue.severity, func.count().label("cnt"))
        .where(Issue.date >= start, Issue.date <= end)
        .group_by(Issue.severity)
        .order_by(Issue.severity)
    )
    if accessible_ids is not None:
        query = query.where(Issue.user_id.in_(accessible_ids))

    result = await db.execute(query)
    rows = result.all()

    data = [SeverityCount(severity=row.severity, count=row.cnt) for row in rows]
    return IssuesBySeverity(data=data)


async def _feedback_distribution(
    db: AsyncSession,
    accessible_ids: list | None,
    start: _dt.date,
    end: _dt.date,
) -> FeedbackDistribution:
    """Count feedback grouped by type."""
    query = (
        select(Feedback.feedback_type, func.count().label("cnt"))
        .where(Feedback.date >= start, Feedback.date <= end)
        .group_by(Feedback.feedback_type)
        .order_by(Feedback.feedback_type)
    )
    if accessible_ids is not None:
        query = query.where(Feedback.user_id.in_(accessible_ids))

    result = await db.execute(query)
    rows = result.all()

    data = [FeedbackTypeCount(feedback_type=row.feedback_type, count=row.cnt) for row in rows]
    return FeedbackDistribution(data=data)


async def _activity_timeline(
    db: AsyncSession,
    accessible_ids: list | None,
    start: _dt.date,
    end: _dt.date,
) -> ActivityTimeline:
    """Count total entries per day across all entity types."""
    # We use UNION ALL of date columns from all four tables, then group by date
    task_dates = select(Task.date.label("entry_date")).where(Task.date >= start, Task.date <= end)
    issue_dates = select(Issue.date.label("entry_date")).where(
        Issue.date >= start, Issue.date <= end
    )
    feedback_dates = select(Feedback.date.label("entry_date")).where(
        Feedback.date >= start, Feedback.date <= end
    )
    note_dates = select(Note.date.label("entry_date")).where(Note.date >= start, Note.date <= end)

    if accessible_ids is not None:
        task_dates = task_dates.where(Task.user_id.in_(accessible_ids))
        issue_dates = issue_dates.where(Issue.user_id.in_(accessible_ids))
        feedback_dates = feedback_dates.where(Feedback.user_id.in_(accessible_ids))
        note_dates = note_dates.where(Note.user_id.in_(accessible_ids))

    union_q = task_dates.union_all(issue_dates, feedback_dates, note_dates).subquery()

    query = (
        select(
            cast(union_q.c.entry_date, Date).label("day"),
            func.count().label("cnt"),
        )
        .group_by("day")
        .order_by("day")
    )

    result = await db.execute(query)
    rows = result.all()

    data = [ActivityDay(date=row.day, count=row.cnt) for row in rows]
    data = _fill_date_gaps_activity(data, start, end)

    return ActivityTimeline(data=data)


def _fill_date_gaps(data: list[DateCount], start: _dt.date, end: _dt.date) -> list[DateCount]:
    """Fill in missing dates with zero counts."""
    date_map = {d.date: d.count for d in data}
    filled: list[DateCount] = []
    current = start
    while current <= end:
        filled.append(DateCount(date=current, count=date_map.get(current, 0)))
        current += _dt.timedelta(days=1)
    return filled


def _fill_date_gaps_activity(
    data: list[ActivityDay], start: _dt.date, end: _dt.date
) -> list[ActivityDay]:
    """Fill in missing dates with zero counts for activity timeline."""
    date_map = {d.date: d.count for d in data}
    filled: list[ActivityDay] = []
    current = start
    while current <= end:
        filled.append(ActivityDay(date=current, count=date_map.get(current, 0)))
        current += _dt.timedelta(days=1)
    return filled
