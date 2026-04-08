import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.access import get_accessible_user_ids
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.feedback import Feedback
from app.models.issue import Issue
from app.models.note import Note
from app.models.task import Task
from app.models.user import User
from app.schemas.search import SearchResponse, SearchResultItem

router = APIRouter(prefix="/api/v1/search", tags=["Search"])


@router.get("/", response_model=SearchResponse)
async def global_search(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    entry_type: str = Query(
        default="all",
        description="Filter by entry type",
        pattern="^(all|tasks|issues|feedback|notes)$",
    ),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SearchResponse:
    """Search across all entry types (tasks, issues, feedback, notes).

    Results are ordered by date (newest first) and grouped by entry type.
    Supports ILIKE-based text matching on titles, descriptions, and content.
    Respects role-based access control.
    """
    accessible_ids = await get_accessible_user_ids(current_user, db)
    escaped_q = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    pattern = f"%{escaped_q}%"

    items: list[SearchResultItem] = []
    total = 0

    search_types = ["tasks", "issues", "feedback", "notes"] if entry_type == "all" else [entry_type]

    if entry_type == "all":
        # For combined search, fetch enough items from each entity to fill
        # the requested page, then paginate the merged+sorted results.
        fetch_limit = page * per_page
        for stype in search_types:
            results = await _search_entity(stype, pattern, accessible_ids, 1, fetch_limit, db)
            items.extend(results)

        items.sort(key=lambda x: (x.date, x.created_at), reverse=True)
        start = (page - 1) * per_page
        paginated_items = items[start : start + per_page]
    else:
        # Single-type search: SQL-level pagination is correct.
        results = await _search_entity(entry_type, pattern, accessible_ids, page, per_page, db)
        items.extend(results)
        paginated_items = items

    total = await _count_all(search_types, pattern, accessible_ids, db)

    return SearchResponse(
        query=q,
        total=total,
        items=paginated_items,
        page=page,
        per_page=per_page,
    )


async def _search_entity(
    entity_type: str,
    pattern: str,
    accessible_ids: list[uuid.UUID] | None,
    page: int,
    per_page: int,
    db: AsyncSession,
) -> list[SearchResultItem]:
    """Search a single entity type and return SearchResultItems."""
    if entity_type == "tasks":
        return await _search_tasks(pattern, accessible_ids, page, per_page, db)
    elif entity_type == "issues":
        return await _search_issues(pattern, accessible_ids, page, per_page, db)
    elif entity_type == "feedback":
        return await _search_feedback(pattern, accessible_ids, page, per_page, db)
    elif entity_type == "notes":
        return await _search_notes(pattern, accessible_ids, page, per_page, db)
    return []


async def _search_tasks(
    pattern: str,
    accessible_ids: list[uuid.UUID] | None,
    page: int,
    per_page: int,
    db: AsyncSession,
) -> list[SearchResultItem]:
    query = select(Task).where(
        or_(
            Task.title.ilike(pattern),
            Task.description.ilike(pattern),
        )
    )
    if accessible_ids is not None:
        query = query.where(Task.user_id.in_(accessible_ids))

    query = query.order_by(Task.date.desc(), Task.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    tasks = result.scalars().all()

    return [
        SearchResultItem(
            id=t.id,
            entry_type="task",
            title=t.title,
            snippet=_truncate(t.description or "", 150),
            date=t.date,
            status=t.status,
            category=t.category,
            created_at=t.created_at,
        )
        for t in tasks
    ]


async def _search_issues(
    pattern: str,
    accessible_ids: list[uuid.UUID] | None,
    page: int,
    per_page: int,
    db: AsyncSession,
) -> list[SearchResultItem]:
    query = select(Issue).where(
        or_(
            Issue.title.ilike(pattern),
            Issue.description.ilike(pattern),
            Issue.resolution_notes.ilike(pattern),
        )
    )
    if accessible_ids is not None:
        query = query.where(Issue.user_id.in_(accessible_ids))

    query = query.order_by(Issue.date.desc(), Issue.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    issues = result.scalars().all()

    return [
        SearchResultItem(
            id=i.id,
            entry_type="issue",
            title=i.title,
            snippet=_truncate(i.description, 150),
            date=i.date,
            status=i.status,
            severity=i.severity,
            created_at=i.created_at,
        )
        for i in issues
    ]


async def _search_feedback(
    pattern: str,
    accessible_ids: list[uuid.UUID] | None,
    page: int,
    per_page: int,
    db: AsyncSession,
) -> list[SearchResultItem]:
    query = select(Feedback).where(
        or_(
            Feedback.subject.ilike(pattern),
            Feedback.details.ilike(pattern),
        )
    )
    if accessible_ids is not None:
        query = query.where(Feedback.user_id.in_(accessible_ids))

    query = query.order_by(Feedback.date.desc(), Feedback.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    feedbacks = result.scalars().all()

    return [
        SearchResultItem(
            id=f.id,
            entry_type="feedback",
            title=f.subject,
            snippet=_truncate(f.details, 150),
            date=f.date,
            feedback_type=f.feedback_type,
            created_at=f.created_at,
        )
        for f in feedbacks
    ]


async def _search_notes(
    pattern: str,
    accessible_ids: list[uuid.UUID] | None,
    page: int,
    per_page: int,
    db: AsyncSession,
) -> list[SearchResultItem]:
    query = select(Note).where(
        or_(
            Note.title.ilike(pattern),
            Note.content.ilike(pattern),
        )
    )
    if accessible_ids is not None:
        query = query.where(Note.user_id.in_(accessible_ids))

    query = query.order_by(Note.date.desc(), Note.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    notes = result.scalars().all()

    return [
        SearchResultItem(
            id=n.id,
            entry_type="note",
            title=n.title,
            snippet=_truncate(n.content, 150),
            date=n.date,
            tags=n.tags,
            created_at=n.created_at,
        )
        for n in notes
    ]


async def _count_all(
    search_types: list[str],
    pattern: str,
    accessible_ids: list[uuid.UUID] | None,
    db: AsyncSession,
) -> int:
    """Count total matching results across all requested entity types."""
    from sqlalchemy import func

    total = 0
    for stype in search_types:
        if stype == "tasks":
            query = select(func.count(Task.id)).where(
                or_(Task.title.ilike(pattern), Task.description.ilike(pattern))
            )
            if accessible_ids is not None:
                query = query.where(Task.user_id.in_(accessible_ids))
        elif stype == "issues":
            query = select(func.count(Issue.id)).where(
                or_(
                    Issue.title.ilike(pattern),
                    Issue.description.ilike(pattern),
                    Issue.resolution_notes.ilike(pattern),
                )
            )
            if accessible_ids is not None:
                query = query.where(Issue.user_id.in_(accessible_ids))
        elif stype == "feedback":
            query = select(func.count(Feedback.id)).where(
                or_(Feedback.subject.ilike(pattern), Feedback.details.ilike(pattern))
            )
            if accessible_ids is not None:
                query = query.where(Feedback.user_id.in_(accessible_ids))
        elif stype == "notes":
            query = select(func.count(Note.id)).where(
                or_(Note.title.ilike(pattern), Note.content.ilike(pattern))
            )
            if accessible_ids is not None:
                query = query.where(Note.user_id.in_(accessible_ids))
        else:
            continue

        result = await db.execute(query)
        total += result.scalar() or 0

    return total


def _truncate(text: str, max_len: int) -> str:
    """Truncate text to max_len characters, adding ellipsis if needed."""
    if len(text) <= max_len:
        return text
    return text[:max_len].rsplit(" ", 1)[0] + "..."
