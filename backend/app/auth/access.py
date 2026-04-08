"""Role-based access helpers for CRUD entities.

All entities are scoped to the logged-in user via JWT.
- Recruits see only their own data.
- Managers can also see data for recruits assigned to them (via manager_id).
- Admins can see all data.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_accessible_user_ids(current_user: User, db: AsyncSession) -> list[uuid.UUID] | None:
    """Return a list of user IDs that the current user can access, or None for all."""
    if current_user.role == "admin":
        return None  # admin can see everything

    ids = [current_user.id]

    if current_user.role == "manager":
        result = await db.execute(select(User.id).where(User.manager_id == current_user.id))
        recruit_ids = result.scalars().all()
        ids.extend(recruit_ids)

    return ids


def check_owner_or_raise(
    resource_user_id: uuid.UUID,
    current_user: User,
) -> None:
    """Raise 403 unless the current user owns the resource."""
    if current_user.role == "admin":
        return
    if resource_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own entries",
        )
