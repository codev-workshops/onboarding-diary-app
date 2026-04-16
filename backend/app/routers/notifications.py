"""In-app notification endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationListResponse, NotificationResponse

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    unread_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List notifications for the current user."""
    user_id = current_user.id

    base_filter = [Notification.user_id == user_id]
    if unread_only:
        base_filter.append(Notification.is_read.is_(False))

    # Total count
    total_result = await db.execute(
        select(func.count()).select_from(Notification).where(*base_filter)
    )
    total = total_result.scalar_one()

    # Unread count (always return total unread regardless of filter)
    unread_result = await db.execute(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
    )
    unread_count = unread_result.scalar_one()

    # Fetch notifications
    result = await db.execute(
        select(Notification)
        .where(*base_filter)
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    notifications = result.scalars().all()

    return {
        "items": [
            {
                "id": n.id,
                "user_id": n.user_id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "reference_type": n.reference_type,
                "reference_id": n.reference_id,
                "is_read": n.is_read,
                "created_at": n.created_at,
            }
            for n in notifications
        ],
        "total": total,
        "unread_count": unread_count,
        "page": page,
        "per_page": per_page,
    }


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single notification as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.flush()

    return notification


@router.put("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read for the current user."""
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True)
    )
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a notification."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.delete(notification)
