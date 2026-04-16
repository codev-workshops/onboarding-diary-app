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

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id

    # Summary counts
    total_tasks_result = await db.execute(
        select(func.count()).select_from(Task).where(Task.user_id == user_id)
    )
    total_tasks = total_tasks_result.scalar_one()

    completed_tasks_result = await db.execute(
        select(func.count())
        .select_from(Task)
        .where(Task.user_id == user_id, Task.status == "completed")
    )
    completed_tasks = completed_tasks_result.scalar_one()

    open_issues_result = await db.execute(
        select(func.count())
        .select_from(Issue)
        .where(Issue.user_id == user_id, Issue.status.in_(["open", "in_progress"]))
    )
    open_issues = open_issues_result.scalar_one()

    total_feedback_result = await db.execute(
        select(func.count()).select_from(Feedback).where(Feedback.user_id == user_id)
    )
    total_feedback = total_feedback_result.scalar_one()

    total_notes_result = await db.execute(
        select(func.count()).select_from(Note).where(Note.user_id == user_id)
    )
    total_notes = total_notes_result.scalar_one()

    # Task completion rate
    task_completion_rate = (
        round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0.0
    )

    # Recent entries (last 5 per category)
    recent_tasks_result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id)
        .order_by(Task.date.desc(), Task.created_at.desc())
        .limit(5)
    )
    recent_tasks = recent_tasks_result.scalars().all()

    recent_issues_result = await db.execute(
        select(Issue)
        .where(Issue.user_id == user_id)
        .order_by(Issue.date.desc(), Issue.created_at.desc())
        .limit(5)
    )
    recent_issues = recent_issues_result.scalars().all()

    recent_feedback_result = await db.execute(
        select(Feedback)
        .where(Feedback.user_id == user_id)
        .order_by(Feedback.date.desc(), Feedback.created_at.desc())
        .limit(5)
    )
    recent_feedback = recent_feedback_result.scalars().all()

    recent_notes_result = await db.execute(
        select(Note)
        .where(Note.user_id == user_id)
        .order_by(Note.date.desc(), Note.created_at.desc())
        .limit(5)
    )
    recent_notes = recent_notes_result.scalars().all()

    return {
        "summary": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "open_issues": open_issues,
            "total_feedback": total_feedback,
            "total_notes": total_notes,
        },
        "task_completion_rate": task_completion_rate,
        "recent_tasks": [
            {
                "id": str(t.id),
                "date": t.date.isoformat(),
                "title": t.title,
                "category": t.category,
                "status": t.status,
                "priority": t.priority,
            }
            for t in recent_tasks
        ],
        "recent_issues": [
            {
                "id": str(i.id),
                "date": i.date.isoformat(),
                "title": i.title,
                "severity": i.severity,
                "status": i.status,
            }
            for i in recent_issues
        ],
        "recent_feedback": [
            {
                "id": str(f.id),
                "date": f.date.isoformat(),
                "subject": f.subject,
                "type": f.type,
            }
            for f in recent_feedback
        ],
        "recent_notes": [
            {
                "id": str(n.id),
                "date": n.date.isoformat(),
                "title": n.title,
                "tags": n.tags,
            }
            for n in recent_notes
        ],
    }


@router.get("/manager")
async def get_manager_dashboard(
    recruit_id: uuid.UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in ("manager", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Manager or admin role required.",
        )

    # Get recruits for this manager (or all if admin)
    if current_user.role == "admin":
        recruits_query = select(User).where(User.role == "recruit", User.is_active.is_(True))
    else:
        recruits_query = select(User).where(
            User.manager_id == current_user.id,
            User.role == "recruit",
            User.is_active.is_(True),
        )

    recruits_result = await db.execute(recruits_query)
    recruits = recruits_result.scalars().all()
    recruit_ids = [r.id for r in recruits]

    # If a specific recruit is requested, validate access
    if recruit_id is not None:
        if recruit_id not in recruit_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this recruit's data.",
            )
        recruit_ids = [recruit_id]

    # Aggregate summary across all relevant recruits
    total_tasks_result = await db.execute(
        select(func.count()).select_from(Task).where(Task.user_id.in_(recruit_ids))
    )
    total_tasks = total_tasks_result.scalar_one()

    completed_tasks_result = await db.execute(
        select(func.count())
        .select_from(Task)
        .where(Task.user_id.in_(recruit_ids), Task.status == "completed")
    )
    completed_tasks = completed_tasks_result.scalar_one()

    open_issues_result = await db.execute(
        select(func.count())
        .select_from(Issue)
        .where(Issue.user_id.in_(recruit_ids), Issue.status.in_(["open", "in_progress"]))
    )
    open_issues = open_issues_result.scalar_one()

    total_feedback_result = await db.execute(
        select(func.count()).select_from(Feedback).where(Feedback.user_id.in_(recruit_ids))
    )
    total_feedback = total_feedback_result.scalar_one()

    total_notes_result = await db.execute(
        select(func.count()).select_from(Note).where(Note.user_id.in_(recruit_ids))
    )
    total_notes = total_notes_result.scalar_one()

    task_completion_rate = (
        round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0.0
    )

    return {
        "recruits": [
            {
                "id": str(r.id),
                "full_name": r.full_name,
                "email": r.email,
                "department": r.department,
                "start_date": r.start_date.isoformat() if r.start_date else None,
            }
            for r in recruits
        ],
        "aggregate_summary": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "open_issues": open_issues,
            "total_feedback": total_feedback,
            "total_notes": total_notes,
            "task_completion_rate": task_completion_rate,
        },
    }
