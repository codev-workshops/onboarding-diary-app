import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.note import Note
from app.models.user import User
from app.schemas.note import NoteCreate, NoteListResponse, NoteResponse, NoteUpdate

router = APIRouter(prefix="/api/v1/notes", tags=["Notes"])


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = Note(
        user_id=current_user.id,
        date=data.date,
        title=data.title,
        content=data.content,
        tags=data.tags,
    )
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return note


@router.get("", response_model=NoteListResponse)
async def list_notes(
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    tags: str | None = Query(default=None, description="Comma-separated tags to filter by"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Note).where(Note.user_id == current_user.id)
    count_query = select(func.count()).select_from(Note).where(Note.user_id == current_user.id)

    if date_from is not None:
        query = query.where(Note.date >= date_from)
        count_query = count_query.where(Note.date >= date_from)
    if date_to is not None:
        query = query.where(Note.date <= date_to)
        count_query = count_query.where(Note.date <= date_to)
    if tags is not None:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        for tag in tag_list:
            query = query.where(Note.tags.any(tag))
            count_query = count_query.where(Note.tags.any(tag))

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset((page - 1) * per_page).limit(per_page).order_by(Note.date.desc(), Note.created_at.desc())
    result = await db.execute(query)
    notes = result.scalars().all()

    return NoteListResponse(
        items=[NoteResponse.model_validate(n) for n in notes],
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    if note.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: uuid.UUID,
    data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    await db.delete(note)
    await db.flush()
