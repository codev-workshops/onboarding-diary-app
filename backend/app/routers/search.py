"""Global search across tasks, issues, feedback, and notes."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select, func, case, literal, union_all, String, Text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.expression import cast

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.feedback import Feedback
from app.models.issue import Issue
from app.models.note import Note
from app.models.task import Task
from app.models.user import User

router = APIRouter(prefix="/api/v1/search", tags=["Search"])


def _build_subqueries(user_id: uuid.UUID, pattern: str, type_filter: str) -> list:
    """Build per-entity SELECT statements for the UNION ALL query."""
    subqueries = []

    if type_filter in ("all", "tasks"):
        subqueries.append(
            select(
                cast(Task.id, String).label("id"),
                literal("task").label("type"),
                Task.title.label("title"),
                Task.description.label("snippet_source"),
                cast(Task.date, String).label("date"),
                Task.category.label("meta1"),
                Task.status.label("meta2"),
                literal(None).label("meta3"),
                Task.created_at.label("created_at"),
            ).where(
                Task.user_id == user_id,
                or_(
                    Task.title.ilike(pattern),
                    Task.description.ilike(pattern),
                    Task.category.ilike(pattern),
                ),
            )
        )

    if type_filter in ("all", "issues"):
        subqueries.append(
            select(
                cast(Issue.id, String).label("id"),
                literal("issue").label("type"),
                Issue.title.label("title"),
                Issue.description.label("snippet_source"),
                cast(Issue.date, String).label("date"),
                Issue.severity.label("meta1"),
                Issue.status.label("meta2"),
                literal(None).label("meta3"),
                Issue.created_at.label("created_at"),
            ).where(
                Issue.user_id == user_id,
                or_(
                    Issue.title.ilike(pattern),
                    Issue.description.ilike(pattern),
                    Issue.resolution_notes.ilike(pattern),
                ),
            )
        )

    if type_filter in ("all", "feedback"):
        subqueries.append(
            select(
                cast(Feedback.id, String).label("id"),
                literal("feedback").label("type"),
                Feedback.subject.label("title"),
                Feedback.details.label("snippet_source"),
                cast(Feedback.date, String).label("date"),
                Feedback.type.label("meta1"),
                literal(None).label("meta2"),
                literal(None).label("meta3"),
                Feedback.created_at.label("created_at"),
            ).where(
                Feedback.user_id == user_id,
                or_(
                    Feedback.subject.ilike(pattern),
                    Feedback.details.ilike(pattern),
                ),
            )
        )

    if type_filter in ("all", "notes"):
        subqueries.append(
            select(
                cast(Note.id, String).label("id"),
                literal("note").label("type"),
                Note.title.label("title"),
                Note.content.label("snippet_source"),
                cast(Note.date, String).label("date"),
                func.array_to_string(Note.tags, ",").label("meta1"),
                literal(None).label("meta2"),
                literal(None).label("meta3"),
                Note.created_at.label("created_at"),
            ).where(
                Note.user_id == user_id,
                or_(
                    Note.title.ilike(pattern),
                    Note.content.ilike(pattern),
                ),
            )
        )

    return subqueries


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
    pattern = "%{}%".format(q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_"))
    offset = (page - 1) * per_page

    subqueries = _build_subqueries(user_id, pattern, type)

    if not subqueries:
        return {
            "items": [],
            "total": 0,
            "page": page,
            "per_page": per_page,
            "query": q,
            "type_filter": type,
        }

    combined = union_all(*subqueries).subquery()

    # Count total matching rows at the DB level
    count_result = await db.execute(
        select(func.count()).select_from(combined)
    )
    total = count_result.scalar_one()

    # Fetch only the requested page
    rows_result = await db.execute(
        select(combined)
        .order_by(combined.c.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    rows = rows_result.all()

    results: list[dict] = []
    for row in rows:
        metadata: dict = {}
        if row.type == "task":
            metadata = {"category": row.meta1, "status": row.meta2}
        elif row.type == "issue":
            metadata = {"severity": row.meta1, "status": row.meta2}
        elif row.type == "feedback":
            metadata = {"feedback_type": row.meta1}
        elif row.type == "note":
            metadata = {"tags": row.meta1.split(",") if row.meta1 else []}

        results.append({
            "id": row.id,
            "type": row.type,
            "title": row.title,
            "snippet": _snippet(row.snippet_source, q),
            "date": row.date,
            "metadata": metadata,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        })

    return {
        "items": results,
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
