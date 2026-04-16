"""Global search across tasks, issues, feedback, and notes."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select, func, case, literal
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.feedback import Feedback
from app.models.issue import Issue
from app.models.note import Note
from app.models.task import Task
from app.models.user import User

router = APIRouter(prefix="/api/v1/search", tags=["Search"])


@router.get("")
async def search(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    type: str = Query(default="all", description="Filter by type: all, tasks, issues, feedback, notes"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search across all entry types using ILIKE pattern matching."""
    user_id = current_user.id
    pattern = f"%{q}%"
    results: list[dict] = []

    offset = (page - 1) * per_page

    # Search tasks
    if type in ("all", "tasks"):
        task_query = (
            select(
                Task.id,
                Task.title,
                Task.description,
                Task.date,
                Task.category,
                Task.status,
                literal("task").label("entry_type"),
                Task.created_at,
            )
            .where(
                Task.user_id == user_id,
                or_(
                    Task.title.ilike(pattern),
                    Task.description.ilike(pattern),
                    Task.category.ilike(pattern),
                ),
            )
        )
        task_result = await db.execute(task_query)
        for row in task_result.all():
            results.append({
                "id": str(row.id),
                "type": "task",
                "title": row.title,
                "snippet": _snippet(row.description, q),
                "date": row.date.isoformat(),
                "metadata": {"category": row.category, "status": row.status},
                "created_at": row.created_at.isoformat() if row.created_at else None,
            })

    # Search issues
    if type in ("all", "issues"):
        issue_query = (
            select(
                Issue.id,
                Issue.title,
                Issue.description,
                Issue.date,
                Issue.severity,
                Issue.status,
                Issue.created_at,
            )
            .where(
                Issue.user_id == user_id,
                or_(
                    Issue.title.ilike(pattern),
                    Issue.description.ilike(pattern),
                    Issue.resolution_notes.ilike(pattern),
                ),
            )
        )
        issue_result = await db.execute(issue_query)
        for row in issue_result.all():
            results.append({
                "id": str(row.id),
                "type": "issue",
                "title": row.title,
                "snippet": _snippet(row.description, q),
                "date": row.date.isoformat(),
                "metadata": {"severity": row.severity, "status": row.status},
                "created_at": row.created_at.isoformat() if row.created_at else None,
            })

    # Search feedback
    if type in ("all", "feedback"):
        feedback_query = (
            select(
                Feedback.id,
                Feedback.subject,
                Feedback.details,
                Feedback.date,
                Feedback.type,
                Feedback.created_at,
            )
            .where(
                Feedback.user_id == user_id,
                or_(
                    Feedback.subject.ilike(pattern),
                    Feedback.details.ilike(pattern),
                ),
            )
        )
        feedback_result = await db.execute(feedback_query)
        for row in feedback_result.all():
            results.append({
                "id": str(row.id),
                "type": "feedback",
                "title": row.subject,
                "snippet": _snippet(row.details, q),
                "date": row.date.isoformat(),
                "metadata": {"feedback_type": row.type},
                "created_at": row.created_at.isoformat() if row.created_at else None,
            })

    # Search notes
    if type in ("all", "notes"):
        note_query = (
            select(
                Note.id,
                Note.title,
                Note.content,
                Note.date,
                Note.tags,
                Note.created_at,
            )
            .where(
                Note.user_id == user_id,
                or_(
                    Note.title.ilike(pattern),
                    Note.content.ilike(pattern),
                ),
            )
        )
        note_result = await db.execute(note_query)
        for row in note_result.all():
            results.append({
                "id": str(row.id),
                "type": "note",
                "title": row.title,
                "snippet": _snippet(row.content, q),
                "date": row.date.isoformat(),
                "metadata": {"tags": row.tags or []},
                "created_at": row.created_at.isoformat() if row.created_at else None,
            })

    # Sort by created_at descending
    results.sort(key=lambda r: r.get("created_at") or "", reverse=True)

    total = len(results)
    paginated = results[offset : offset + per_page]

    return {
        "items": paginated,
        "total": total,
        "page": page,
        "per_page": per_page,
        "query": q,
        "type_filter": type,
    }


def _snippet(text: str | None, query: str, max_len: int = 150) -> str:
    """Extract a snippet around the first match of query in text."""
    if not text:
        return ""
    lower = text.lower()
    q_lower = query.lower()
    idx = lower.find(q_lower)
    if idx == -1:
        return text[:max_len] + ("..." if len(text) > max_len else "")
    start = max(0, idx - 50)
    end = min(len(text), idx + len(query) + 100)
    snippet = text[start:end]
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."
    return snippet
