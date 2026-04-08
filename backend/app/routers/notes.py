import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.access import check_owner_or_raise, get_accessible_user_ids
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.note import Note
from app.models.user import User
from app.schemas.note import (
    NoteCreate,
    NoteResponse,
    NoteUpdate,
    PaginatedNoteResponse,
)

router = APIRouter(prefix="/api/v1/notes", tags=["Notes"])


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    payload: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = Note(
        user_id=current_user.id,
        date=payload.date,
        title=payload.title,
        content=payload.content,
        tags=payload.tags,
    )
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return note


@router.get("/", response_model=PaginatedNoteResponse)
async def list_notes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    tags: str | None = Query(default=None, description="Comma-separated tags"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    accessible_ids = await get_accessible_user_ids(current_user, db)

    query = select(Note)
    count_query = select(func.count(Note.id))

    if accessible_ids is not None:
        query = query.where(Note.user_id.in_(accessible_ids))
        count_query = count_query.where(Note.user_id.in_(accessible_ids))

    if date_from:
        query = query.where(Note.date >= date_from)
        count_query = count_query.where(Note.date >= date_from)
    if date_to:
        query = query.where(Note.date <= date_to)
        count_query = count_query.where(Note.date <= date_to)
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        for tag in tag_list:
            query = query.where(Note.tags.any(tag))
            count_query = count_query.where(Note.tags.any(tag))

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Note.date.desc(), Note.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedNoteResponse(
        items=[NoteResponse.model_validate(n) for n in items],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")

    accessible_ids = await get_accessible_user_ids(current_user, db)
    if accessible_ids is not None and note.user_id not in accessible_ids:
        raise HTTPException(status_code=403, detail="Access denied")

    return note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: uuid.UUID,
    payload: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")

    check_owner_or_raise(note.user_id, current_user)

    update_data = payload.model_dump(exclude_unset=True)
    if "date" in update_data:
        note.date = update_data["date"]
    if "title" in update_data:
        note.title = update_data["title"]
    if "content" in update_data:
        note.content = update_data["content"]
    if "tags" in update_data:
        note.tags = update_data["tags"]

    await db.flush()
    await db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")

    check_owner_or_raise(note.user_id, current_user)

    await db.delete(note)
    await db.flush()
