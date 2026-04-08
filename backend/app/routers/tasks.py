import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.access import check_owner_or_raise, get_accessible_user_ids
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import (
    PaginatedTaskResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = Task(
        user_id=current_user.id,
        date=payload.date,
        title=payload.title,
        description=payload.description,
        category=payload.category.value,
        status=payload.status.value,
        priority=payload.priority.value,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


@router.get("/", response_model=PaginatedTaskResponse)
async def list_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    category: str | None = Query(default=None),
    task_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    accessible_ids = await get_accessible_user_ids(current_user, db)

    query = select(Task)
    count_query = select(func.count(Task.id))

    if accessible_ids is not None:
        query = query.where(Task.user_id.in_(accessible_ids))
        count_query = count_query.where(Task.user_id.in_(accessible_ids))

    if date_from:
        query = query.where(Task.date >= date_from)
        count_query = count_query.where(Task.date >= date_from)
    if date_to:
        query = query.where(Task.date <= date_to)
        count_query = count_query.where(Task.date <= date_to)
    if category:
        query = query.where(Task.category == category)
        count_query = count_query.where(Task.category == category)
    if task_status:
        query = query.where(Task.status == task_status)
        count_query = count_query.where(Task.status == task_status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Task.date.desc(), Task.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedTaskResponse(
        items=[TaskResponse.model_validate(t) for t in items],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    accessible_ids = await get_accessible_user_ids(current_user, db)
    if accessible_ids is not None and task.user_id not in accessible_ids:
        raise HTTPException(status_code=403, detail="Access denied")

    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    check_owner_or_raise(task.user_id, current_user)

    update_data = payload.model_dump(exclude_unset=True)
    if "date" in update_data:
        task.date = update_data["date"]
    if "title" in update_data:
        task.title = update_data["title"]
    if "description" in update_data:
        task.description = update_data["description"]
    if "category" in update_data:
        task.category = update_data["category"].value if update_data["category"] else None
    if "status" in update_data:
        task.status = update_data["status"].value if update_data["status"] else None
    if "priority" in update_data:
        task.priority = update_data["priority"].value if update_data["priority"] else None

    await db.flush()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    check_owner_or_raise(task.user_id, current_user)

    await db.delete(task)
    await db.flush()
