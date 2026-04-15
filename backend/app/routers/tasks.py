import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskListResponse, TaskResponse, TaskUpdate

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = Task(
        user_id=current_user.id,
        date=data.date,
        title=data.title,
        description=data.description,
        category=data.category,
        status=data.status,
        priority=data.priority,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    category: str | None = Query(default=None),
    task_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Task).where(Task.user_id == current_user.id)
    count_query = select(func.count()).select_from(Task).where(Task.user_id == current_user.id)

    if date_from is not None:
        query = query.where(Task.date >= date_from)
        count_query = count_query.where(Task.date >= date_from)
    if date_to is not None:
        query = query.where(Task.date <= date_to)
        count_query = count_query.where(Task.date <= date_to)
    if category is not None:
        query = query.where(Task.category == category)
        count_query = count_query.where(Task.category == category)
    if task_status is not None:
        query = query.where(Task.status == task_status)
        count_query = count_query.where(Task.status == task_status)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset((page - 1) * per_page).limit(per_page).order_by(Task.date.desc(), Task.created_at.desc())
    result = await db.execute(query)
    tasks = result.scalars().all()

    return TaskListResponse(
        items=[TaskResponse.model_validate(t) for t in tasks],
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Ownership check: recruits can only see their own tasks
    if current_user.role == "recruit" and task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == "manager" and task.user_id != current_user.id:
        # Managers can view tasks of their assigned recruits
        target_user_result = await db.execute(select(User).where(User.id == task.user_id))
        target_user = target_user_result.scalar_one_or_none()
        if target_user is None or target_user.manager_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    await db.delete(task)
    await db.flush()


# Manager/Admin endpoint to view a specific user's tasks
@router.get(
    "/user/{user_id}",
    response_model=TaskListResponse,
    dependencies=[Depends(require_role("manager", "admin"))],
)
async def list_user_tasks(
    user_id: uuid.UUID,
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    category: str | None = Query(default=None),
    task_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify the target user exists
    target_result = await db.execute(select(User).where(User.id == user_id))
    target_user = target_result.scalar_one_or_none()
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Manager can only view their assigned recruits
    if current_user.role == "manager" and target_user.manager_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    query = select(Task).where(Task.user_id == user_id)
    count_query = select(func.count()).select_from(Task).where(Task.user_id == user_id)

    if date_from is not None:
        query = query.where(Task.date >= date_from)
        count_query = count_query.where(Task.date >= date_from)
    if date_to is not None:
        query = query.where(Task.date <= date_to)
        count_query = count_query.where(Task.date <= date_to)
    if category is not None:
        query = query.where(Task.category == category)
        count_query = count_query.where(Task.category == category)
    if task_status is not None:
        query = query.where(Task.status == task_status)
        count_query = count_query.where(Task.status == task_status)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset((page - 1) * per_page).limit(per_page).order_by(Task.date.desc(), Task.created_at.desc())
    result = await db.execute(query)
    tasks = result.scalars().all()

    return TaskListResponse(
        items=[TaskResponse.model_validate(t) for t in tasks],
        total=total,
        page=page,
        per_page=per_page,
    )
