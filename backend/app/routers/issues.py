import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.access import check_owner_or_raise, get_accessible_user_ids
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.issue import Issue
from app.models.user import User
from app.schemas.issue import (
    IssueCreate,
    IssueResponse,
    IssueUpdate,
    PaginatedIssueResponse,
)

router = APIRouter(prefix="/api/v1/issues", tags=["Issues"])


@router.post("/", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    payload: IssueCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    issue = Issue(
        user_id=current_user.id,
        date=payload.date,
        title=payload.title,
        description=payload.description,
        severity=payload.severity.value,
        status=payload.status.value,
        resolution_notes=payload.resolution_notes,
    )
    db.add(issue)
    await db.flush()
    await db.refresh(issue)
    return issue


@router.get("/", response_model=PaginatedIssueResponse)
async def list_issues(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    issue_status: str | None = Query(default=None, alias="status"),
    severity: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    accessible_ids = await get_accessible_user_ids(current_user, db)

    query = select(Issue)
    count_query = select(func.count(Issue.id))

    if accessible_ids is not None:
        query = query.where(Issue.user_id.in_(accessible_ids))
        count_query = count_query.where(Issue.user_id.in_(accessible_ids))

    if date_from:
        query = query.where(Issue.date >= date_from)
        count_query = count_query.where(Issue.date >= date_from)
    if date_to:
        query = query.where(Issue.date <= date_to)
        count_query = count_query.where(Issue.date <= date_to)
    if issue_status:
        query = query.where(Issue.status == issue_status)
        count_query = count_query.where(Issue.status == issue_status)
    if severity:
        query = query.where(Issue.severity == severity)
        count_query = count_query.where(Issue.severity == severity)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Issue.date.desc(), Issue.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedIssueResponse(
        items=[IssueResponse.model_validate(i) for i in items],
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
        raise HTTPException(status_code=404, detail="Issue not found")

    accessible_ids = await get_accessible_user_ids(current_user, db)
    if accessible_ids is not None and issue.user_id not in accessible_ids:
        raise HTTPException(status_code=403, detail="Access denied")

    return issue


@router.put("/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: uuid.UUID,
    payload: IssueUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")

    check_owner_or_raise(issue.user_id, current_user)

    update_data = payload.model_dump(exclude_unset=True)
    if "date" in update_data:
        issue.date = update_data["date"]
    if "title" in update_data:
        issue.title = update_data["title"]
    if "description" in update_data:
        issue.description = update_data["description"]
    if "severity" in update_data:
        issue.severity = update_data["severity"].value if update_data["severity"] else None
    if "status" in update_data:
        issue.status = update_data["status"].value if update_data["status"] else None
    if "resolution_notes" in update_data:
        issue.resolution_notes = update_data["resolution_notes"]

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
        raise HTTPException(status_code=404, detail="Issue not found")

    check_owner_or_raise(issue.user_id, current_user)

    await db.delete(issue)
    await db.flush()
