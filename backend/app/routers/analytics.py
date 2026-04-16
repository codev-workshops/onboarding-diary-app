"""Dashboard analytics endpoint for charts and time-series data."""

import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, extract, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.feedback import Feedback
from app.models.issue import Issue
from app.models.note import Note
from app.models.task import Task
from app.models.user import User

router = APIRouter(prefix="/api/v1/dashboard", tags=["Analytics"])


@router.get("/analytics")
async def get_analytics(
    period: str = Query(default="monthly", description="weekly or monthly"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated analytics data for charts."""
    user_id = current_user.id

    # Determine date range based on period
    today = date.today()
    if period == "weekly":
        start_date = today - timedelta(weeks=12)  # Last 12 weeks
    else:
        start_date = today - timedelta(days=365)  # Last 12 months

    # --- Tasks over time (created vs completed) ---
    tasks_over_time = await _get_tasks_over_time(db, user_id, start_date, period)

    # --- Issue severity distribution ---
    severity_result = await db.execute(
        select(Issue.severity, func.count().label("count"))
        .where(Issue.user_id == user_id)
        .group_by(Issue.severity)
    )
    issue_severity = [
        {"severity": row.severity, "count": row.count}
        for row in severity_result.all()
    ]

    # --- Feedback type breakdown ---
    feedback_result = await db.execute(
        select(Feedback.type, func.count().label("count"))
        .where(Feedback.user_id == user_id)
        .group_by(Feedback.type)
    )
    feedback_types = [
        {"type": row.type, "count": row.count}
        for row in feedback_result.all()
    ]

    # --- Task status distribution ---
    status_result = await db.execute(
        select(Task.status, func.count().label("count"))
        .where(Task.user_id == user_id)
        .group_by(Task.status)
    )
    task_status = [
        {"status": row.status, "count": row.count}
        for row in status_result.all()
    ]

    # --- Task priority distribution ---
    priority_result = await db.execute(
        select(Task.priority, func.count().label("count"))
        .where(Task.user_id == user_id)
        .group_by(Task.priority)
    )
    task_priority = [
        {"priority": row.priority, "count": row.count}
        for row in priority_result.all()
    ]

    # --- Onboarding progress (30/60/90 day milestones) ---
    onboarding_progress = await _get_onboarding_progress(db, user_id, current_user)

    return {
        "period": period,
        "tasks_over_time": tasks_over_time,
        "issue_severity": issue_severity,
        "feedback_types": feedback_types,
        "task_status": task_status,
        "task_priority": task_priority,
        "onboarding_progress": onboarding_progress,
    }


async def _get_tasks_over_time(
    db: AsyncSession, user_id: uuid.UUID, start_date: date, period: str
) -> list[dict]:
    """Get tasks created and completed over time buckets."""
    # Get all tasks created in the date range
    tasks_result = await db.execute(
        select(Task.date, Task.status)
        .where(Task.user_id == user_id, Task.date >= start_date)
        .order_by(Task.date)
    )
    tasks = tasks_result.all()

    # Bucket tasks by period
    buckets: dict[str, dict[str, int]] = {}
    for row in tasks:
        if period == "weekly":
            # ISO week
            bucket_key = f"{row.date.isocalendar()[0]}-W{row.date.isocalendar()[1]:02d}"
        else:
            bucket_key = f"{row.date.year}-{row.date.month:02d}"

        if bucket_key not in buckets:
            buckets[bucket_key] = {"created": 0, "completed": 0}
        buckets[bucket_key]["created"] += 1
        if row.status == "completed":
            buckets[bucket_key]["completed"] += 1

    return [
        {"period": k, "created": v["created"], "completed": v["completed"]}
        for k, v in sorted(buckets.items())
    ]


async def _get_onboarding_progress(
    db: AsyncSession, user_id: uuid.UUID, user: User
) -> dict:
    """Calculate onboarding progress milestones."""
    start = user.start_date
    if not start:
        return {"milestones": [], "current_day": 0}

    today = date.today()
    days_since_start = (today - start).days
    current_day = max(0, days_since_start)

    milestones = []
    for target_day in [30, 60, 90]:
        milestone_date = start + timedelta(days=target_day)
        # Count tasks completed by this milestone date
        completed_result = await db.execute(
            select(func.count())
            .select_from(Task)
            .where(
                Task.user_id == user_id,
                Task.status == "completed",
                Task.date <= milestone_date,
            )
        )
        completed = completed_result.scalar_one()

        total_result = await db.execute(
            select(func.count())
            .select_from(Task)
            .where(Task.user_id == user_id, Task.date <= milestone_date)
        )
        total = total_result.scalar_one()

        milestones.append({
            "day": target_day,
            "date": milestone_date.isoformat(),
            "reached": current_day >= target_day,
            "tasks_completed": completed,
            "tasks_total": total,
            "completion_rate": round(completed / total * 100, 1) if total > 0 else 0.0,
        })

    return {
        "start_date": start.isoformat(),
        "current_day": current_day,
        "milestones": milestones,
    }
