import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.issue import Issue
from app.models.user import User
from app.schemas.issue import IssueCreate, IssueListResponse, IssueResponse, IssueUpdate

router = APIRouter(prefix="/api/v1/issues", tags=["Issues"])


@router.post("", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    data: IssueCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    issue = Issue(
        user_id=current_user.id,
        date=data.date,
        title=data.title,
        description=data.description,
        severity=data.severity,
        status=data.status,
        resolution_notes=data.resolution_notes,
    )
    db.add(issue)
    await db.flush()
    await db.refresh(issue)
    return issue


@router.get("", response_model=IssueListResponse)
async def list_issues(
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    issue_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Issue).where(Issue.user_id == current_user.id)
    count_query = select(func.count()).select_from(Issue).where(Issue.user_id == current_user.id)

    if date_from is not None:
        query = query.where(Issue.date >= date_from)
        count_query = count_query.where(Issue.date >= date_from)
    if date_to is not None:
        query = query.where(Issue.date <= date_to)
        count_query = count_query.where(Issue.date <= date_to)
    if severity is not None:
        query = query.where(Issue.severity == severity)
        count_query = count_query.where(Issue.severity == severity)
    if issue_status is not None:
        query = query.where(Issue.status == issue_status)
        count_query = count_query.where(Issue.status == issue_status)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset((page - 1) * per_page).limit(per_page).order_by(Issue.date.desc(), Issue.created_at.desc())
    result = await db.execute(query)
    issues = result.scalars().all()

    return IssueListResponse(
        items=[IssueResponse.model_validate(i) for i in issues],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    if current_user.role == "recruit" and issue.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == "manager" and issue.user_id != current_user.id:
        target_user_result = await db.execute(select(User).where(User.id == issue.user_id))
        target_user = target_user_result.scalar_one_or_none()
        if target_user is None or target_user.manager_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return issue


@router.put("/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: uuid.UUID,
    data: IssueUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    if issue.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    update_data = data.model_dump(exclude_unset=True)

    # Validate resolution_notes requirement for resolved/closed status
    new_status = update_data.get("status", issue.status)
    new_resolution_notes = update_data.get("resolution_notes", issue.resolution_notes)
    if new_status in ("resolved", "closed") and not new_resolution_notes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolution notes are required when status is resolved or closed",
        )

    for field, value in update_data.items():
        setattr(issue, field, value)

    await db.flush()
    await db.refresh(issue)
    return issue


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue(
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    if issue.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    await db.delete(issue)
    await db.flush()


@router.get(
    "/user/{user_id}",
    response_model=IssueListResponse,
    dependencies=[Depends(require_role("manager", "admin"))],
)
async def list_user_issues(
    user_id: uuid.UUID,
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    issue_status: str | None = Query(default=None, alias="status"),
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

    query = select(Issue).where(Issue.user_id == user_id)
    count_query = select(func.count()).select_from(Issue).where(Issue.user_id == user_id)

    if date_from is not None:
        query = query.where(Issue.date >= date_from)
        count_query = count_query.where(Issue.date >= date_from)
    if date_to is not None:
        query = query.where(Issue.date <= date_to)
        count_query = count_query.where(Issue.date <= date_to)
    if severity is not None:
        query = query.where(Issue.severity == severity)
        count_query = count_query.where(Issue.severity == severity)
    if issue_status is not None:
        query = query.where(Issue.status == issue_status)
        count_query = count_query.where(Issue.status == issue_status)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset((page - 1) * per_page).limit(per_page).order_by(Issue.date.desc(), Issue.created_at.desc())
    result = await db.execute(query)
    issues = result.scalars().all()

    return IssueListResponse(
        items=[IssueResponse.model_validate(i) for i in issues],
        total=total,
        page=page,
        per_page=per_page,
    )
