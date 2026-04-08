import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.access import check_owner_or_raise, get_accessible_user_ids
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackUpdate,
    PaginatedFeedbackResponse,
)

router = APIRouter(prefix="/api/v1/feedback", tags=["Feedback"])


@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    payload: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fb = Feedback(
        user_id=current_user.id,
        date=payload.date,
        subject=payload.subject,
        feedback_type=payload.feedback_type.value,
        details=payload.details,
    )
    db.add(fb)
    await db.flush()
    await db.refresh(fb)
    return fb


@router.get("/", response_model=PaginatedFeedbackResponse)
async def list_feedback(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    feedback_type: str | None = Query(default=None, alias="type"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    accessible_ids = await get_accessible_user_ids(current_user, db)

    query = select(Feedback)
    count_query = select(func.count(Feedback.id))

    if accessible_ids is not None:
        query = query.where(Feedback.user_id.in_(accessible_ids))
        count_query = count_query.where(Feedback.user_id.in_(accessible_ids))

    if date_from:
        query = query.where(Feedback.date >= date_from)
        count_query = count_query.where(Feedback.date >= date_from)
    if date_to:
        query = query.where(Feedback.date <= date_to)
        count_query = count_query.where(Feedback.date <= date_to)
    if feedback_type:
        query = query.where(Feedback.feedback_type == feedback_type)
        count_query = count_query.where(Feedback.feedback_type == feedback_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Feedback.date.desc(), Feedback.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedFeedbackResponse(
        items=[FeedbackResponse.model_validate(fb) for fb in items],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    fb = result.scalar_one_or_none()
    if fb is None:
        raise HTTPException(status_code=404, detail="Feedback not found")

    accessible_ids = await get_accessible_user_ids(current_user, db)
    if accessible_ids is not None and fb.user_id not in accessible_ids:
        raise HTTPException(status_code=403, detail="Access denied")

    return fb


@router.put("/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    feedback_id: uuid.UUID,
    payload: FeedbackUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    fb = result.scalar_one_or_none()
    if fb is None:
        raise HTTPException(status_code=404, detail="Feedback not found")

    check_owner_or_raise(fb.user_id, current_user)

    update_data = payload.model_dump(exclude_unset=True)
    if "date" in update_data:
        fb.date = update_data["date"]
    if "subject" in update_data:
        fb.subject = update_data["subject"]
    if "feedback_type" in update_data:
        fb.feedback_type = update_data["feedback_type"].value if update_data["feedback_type"] else None
    if "details" in update_data:
        fb.details = update_data["details"]

    await db.flush()
    await db.refresh(fb)
    return fb


@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feedback(
    feedback_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    fb = result.scalar_one_or_none()
    if fb is None:
        raise HTTPException(status_code=404, detail="Feedback not found")

    check_owner_or_raise(fb.user_id, current_user)

    await db.delete(fb)
    await db.flush()
