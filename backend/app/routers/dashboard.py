"""Dashboard endpoints — summary stats and recent entries."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.feedback import Feedback
from app.models.issue import Issue
from app.models.note import Note
from app.models.task import Task
from app.models.user import User
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardSummary,
    ManagerDashboardResponse,
    RecentEntry,
    RecruitSummary,
)

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])

RECENT_LIMIT = 5


async def _build_summary(
    db: AsyncSession, user_id: uuid.UUID
) -> DashboardSummary:
    """Build summary counts for a single user."""
    total_tasks_q = select(func.count()).select_from(Task).where(Task.user_id == user_id)
    completed_tasks_q = (
        select(func.count())
        .select_from(Task)
        .where(Task.user_id == user_id, Task.status == "completed")
    )
    open_issues_q = (
        select(func.count())
        .select_from(Issue)
        .where(Issue.user_id == user_id, Issue.status.in_(["open", "in_progress"]))
    )
    total_feedback_q = select(func.count()).select_from(Feedback).where(Feedback.user_id == user_id)
    total_notes_q = select(func.count()).select_from(Note).where(Note.user_id == user_id)

    total_tasks = (await db.execute(total_tasks_q)).scalar() or 0
    completed_tasks = (await db.execute(completed_tasks_q)).scalar() or 0
    open_issues = (await db.execute(open_issues_q)).scalar() or 0
    total_feedback = (await db.execute(total_feedback_q)).scalar() or 0
    total_notes = (await db.execute(total_notes_q)).scalar() or 0

    rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0

    return DashboardSummary(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        open_issues=open_issues,
        total_feedback=total_feedback,
        total_notes=total_notes,
        task_completion_rate=round(rate, 1),
    )


async def _recent_entries(
    db: AsyncSession, user_id: uuid.UUID
) -> list[RecentEntry]:
    """Return the most recent entries across all categories."""
    entries: list[RecentEntry] = []

    # Recent tasks
    result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id)
        .order_by(Task.created_at.desc())
        .limit(RECENT_LIMIT)
    )
    for t in result.scalars().all():
        entries.append(
            RecentEntry(
                id=t.id,
                entry_type="task",
                title=t.title,
                date=t.date,
                status=t.status,
                created_at=t.created_at,
            )
        )

    # Recent issues
    result = await db.execute(
        select(Issue)
        .where(Issue.user_id == user_id)
        .order_by(Issue.created_at.desc())
        .limit(RECENT_LIMIT)
    )
    for i in result.scalars().all():
        entries.append(
            RecentEntry(
                id=i.id,
                entry_type="issue",
                title=i.title,
                date=i.date,
                status=i.status,
                created_at=i.created_at,
            )
        )

    # Recent feedback
    result = await db.execute(
        select(Feedback)
        .where(Feedback.user_id == user_id)
        .order_by(Feedback.created_at.desc())
        .limit(RECENT_LIMIT)
    )
    for f in result.scalars().all():
        entries.append(
            RecentEntry(
                id=f.id,
                entry_type="feedback",
                title=f.subject,
                date=f.date,
                status=None,
                created_at=f.created_at,
            )
        )

    # Recent notes
    result = await db.execute(
        select(Note)
        .where(Note.user_id == user_id)
        .order_by(Note.created_at.desc())
        .limit(RECENT_LIMIT)
    )
    for n in result.scalars().all():
        entries.append(
            RecentEntry(
                id=n.id,
                entry_type="note",
                title=n.title,
                date=n.date,
                status=None,
                created_at=n.created_at,
            )
        )

    # Sort all by created_at desc and return top entries
    entries.sort(key=lambda e: e.created_at, reverse=True)
    return entries[:10]


@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard data for the current user."""
    summary = await _build_summary(db, current_user.id)
    recent = await _recent_entries(db, current_user.id)
    return DashboardResponse(summary=summary, recent_entries=recent)


@router.get("/manager", response_model=ManagerDashboardResponse)
async def get_manager_dashboard(
    recruit_id: uuid.UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate dashboard for a manager (or admin)."""
    if current_user.role not in ("manager", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can access this endpoint",
        )

    # Get recruits this manager oversees
    if current_user.role == "admin":
        q = select(User).where(User.role == "recruit", User.is_active.is_(True))
    else:
        q = select(User).where(
            User.manager_id == current_user.id, User.is_active.is_(True)
        )

    if recruit_id:
        q = q.where(User.id == recruit_id)

    result = await db.execute(q)
    recruits = result.scalars().all()

    recruit_summaries: list[RecruitSummary] = []
    agg_total_tasks = 0
    agg_completed_tasks = 0
    agg_open_issues = 0
    agg_total_feedback = 0
    agg_total_notes = 0

    for recruit in recruits:
        s = await _build_summary(db, recruit.id)
        recruit_summaries.append(
            RecruitSummary(
                user_id=recruit.id,
                full_name=recruit.full_name,
                email=recruit.email,
                department=recruit.department,
                summary=s,
            )
        )
        agg_total_tasks += s.total_tasks
        agg_completed_tasks += s.completed_tasks
        agg_open_issues += s.open_issues
        agg_total_feedback += s.total_feedback
        agg_total_notes += s.total_notes

    agg_rate = (
        (agg_completed_tasks / agg_total_tasks * 100) if agg_total_tasks > 0 else 0.0
    )

    return ManagerDashboardResponse(
        recruits=recruit_summaries,
        aggregate_summary=DashboardSummary(
            total_tasks=agg_total_tasks,
            completed_tasks=agg_completed_tasks,
            open_issues=agg_open_issues,
            total_feedback=agg_total_feedback,
            total_notes=agg_total_notes,
            task_completion_rate=round(agg_rate, 1),
        ),
    )
