import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackListResponse,
    FeedbackResponse,
    FeedbackUpdate,
)

router = APIRouter(prefix="/api/v1/feedback", tags=["Feedback"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    feedback = Feedback(
        user_id=current_user.id,
        date=data.date,
        subject=data.subject,
        type=data.type,
        details=data.details,
    )
    db.add(feedback)
    await db.flush()
    await db.refresh(feedback)
    return feedback


@router.get("", response_model=FeedbackListResponse)
async def list_feedback(
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    feedback_type: str | None = Query(default=None, alias="type"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Feedback).where(Feedback.user_id == current_user.id)
    count_query = select(func.count()).select_from(Feedback).where(Feedback.user_id == current_user.id)

    if date_from is not None:
        query = query.where(Feedback.date >= date_from)
        count_query = count_query.where(Feedback.date >= date_from)
    if date_to is not None:
        query = query.where(Feedback.date <= date_to)
        count_query = count_query.where(Feedback.date <= date_to)
    if feedback_type is not None:
        query = query.where(Feedback.type == feedback_type)
        count_query = count_query.where(Feedback.type == feedback_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset((page - 1) * per_page).limit(per_page).order_by(
        Feedback.date.desc(), Feedback.created_at.desc()
    )
    result = await db.execute(query)
    feedback_items = result.scalars().all()

    return FeedbackListResponse(
        items=[FeedbackResponse.model_validate(f) for f in feedback_items],
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
    feedback = result.scalar_one_or_none()
    if feedback is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    if current_user.role == "recruit" and feedback.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == "manager" and feedback.user_id != current_user.id:
        target_user_result = await db.execute(select(User).where(User.id == feedback.user_id))
        target_user = target_user_result.scalar_one_or_none()
        if target_user is None or target_user.manager_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return feedback


@router.put("/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    feedback_id: uuid.UUID,
    data: FeedbackUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    if feedback is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    if feedback.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(feedback, field, value)

    await db.flush()
    await db.refresh(feedback)
    return feedback


@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feedback(
    feedback_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    if feedback is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    if feedback.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    await db.delete(feedback)
    await db.flush()


@router.get(
    "/user/{user_id}",
    response_model=FeedbackListResponse,
    dependencies=[Depends(require_role("manager", "admin"))],
)
async def list_user_feedback(
    user_id: uuid.UUID,
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    feedback_type: str | None = Query(default=None, alias="type"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_result = await db.execute(select(User).where(User.id == user_id))
    target_user = target_result.scalar_one_or_none()
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if current_user.role == "manager" and target_user.manager_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    query = select(Feedback).where(Feedback.user_id == user_id)
    count_query = select(func.count()).select_from(Feedback).where(Feedback.user_id == user_id)

    if date_from is not None:
        query = query.where(Feedback.date >= date_from)
        count_query = count_query.where(Feedback.date >= date_from)
    if date_to is not None:
        query = query.where(Feedback.date <= date_to)
        count_query = count_query.where(Feedback.date <= date_to)
    if feedback_type is not None:
        query = query.where(Feedback.type == feedback_type)
        count_query = count_query.where(Feedback.type == feedback_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset((page - 1) * per_page).limit(per_page).order_by(
        Feedback.date.desc(), Feedback.created_at.desc()
    )
    result = await db.execute(query)
    feedback_items = result.scalars().all()

    return FeedbackListResponse(
        items=[FeedbackResponse.model_validate(f) for f in feedback_items],
        total=total,
        page=page,
        per_page=per_page,
    )
