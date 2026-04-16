"""Onboarding checklist endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user, require_manager
from app.database import get_db
from app.models.checklist import (
    Checklist,
    ChecklistAssignment,
    ChecklistCompletion,
    ChecklistItem,
)
from app.models.user import User
from app.schemas.checklist import (
    ChecklistAssignmentResponse,
    ChecklistAssignRequest,
    ChecklistCreate,
    ChecklistItemCreate,
    ChecklistItemResponse,
    ChecklistListResponse,
    ChecklistProgressResponse,
    ChecklistResponse,
    ChecklistUpdate,
)

router = APIRouter(prefix="/api/v1/checklists", tags=["Checklists"])


def _build_checklist_response(
    checklist: Checklist, user_id: uuid.UUID | None = None
) -> dict:
    """Build a checklist response dict with computed progress."""
    items_data = []
    completed_count = 0
    for item in checklist.items:
        is_completed = False
        completed_at = None
        if user_id:
            for c in item.completions:
                if c.user_id == user_id:
                    is_completed = True
                    completed_at = c.completed_at
                    break
        if is_completed:
            completed_count += 1
        items_data.append({
            "id": item.id,
            "checklist_id": item.checklist_id,
            "title": item.title,
            "description": item.description,
            "order": item.order,
            "created_at": item.created_at,
            "is_completed": is_completed,
            "completed_at": completed_at,
        })

    total_items = len(checklist.items)
    progress = round(completed_count / total_items * 100, 1) if total_items > 0 else 0.0

    assignments_data = []
    for a in checklist.assignments:
        assignments_data.append({
            "id": a.id,
            "checklist_id": a.checklist_id,
            "user_id": a.user_id,
            "assigned_at": a.assigned_at,
            "user_name": None,
        })

    return {
        "id": checklist.id,
        "title": checklist.title,
        "description": checklist.description,
        "created_by": checklist.created_by,
        "created_at": checklist.created_at,
        "updated_at": checklist.updated_at,
        "items": items_data,
        "assignments": assignments_data,
        "progress": progress,
    }


# --- Manager/Admin: CRUD checklists ---

@router.post("", response_model=ChecklistResponse, status_code=status.HTTP_201_CREATED)
async def create_checklist(
    data: ChecklistCreate,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """Create a new checklist with items (manager/admin only)."""
    checklist = Checklist(
        title=data.title,
        description=data.description,
        created_by=current_user.id,
    )
    db.add(checklist)
    await db.flush()

    for i, item_data in enumerate(data.items):
        item = ChecklistItem(
            checklist_id=checklist.id,
            title=item_data.title,
            description=item_data.description,
            order=item_data.order if item_data.order != 0 else i,
        )
        db.add(item)

    await db.flush()

    # Re-fetch with relationships
    result = await db.execute(
        select(Checklist)
        .options(
            selectinload(Checklist.items).selectinload(ChecklistItem.completions),
            selectinload(Checklist.assignments),
        )
        .where(Checklist.id == checklist.id)
    )
    checklist = result.scalar_one()
    return _build_checklist_response(checklist)


@router.get("", response_model=ChecklistListResponse)
async def list_checklists(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List checklists. Recruits see their assigned checklists, managers/admins see their created ones."""
    if current_user.role == "recruit":
        # Find checklists assigned to this user
        assigned_ids_query = select(ChecklistAssignment.checklist_id).where(
            ChecklistAssignment.user_id == current_user.id
        )
        base_query = select(Checklist).where(Checklist.id.in_(assigned_ids_query))
        count_query = (
            select(func.count())
            .select_from(Checklist)
            .where(Checklist.id.in_(assigned_ids_query))
        )
    else:
        base_query = select(Checklist).where(Checklist.created_by == current_user.id)
        count_query = (
            select(func.count())
            .select_from(Checklist)
            .where(Checklist.created_by == current_user.id)
        )

    # Count
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Fetch with relationships
    result = await db.execute(
        base_query
        .options(
            selectinload(Checklist.items).selectinload(ChecklistItem.completions),
            selectinload(Checklist.assignments),
        )
        .order_by(Checklist.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    checklists = result.scalars().all()

    user_id = current_user.id if current_user.role == "recruit" else None
    return {
        "items": [_build_checklist_response(c, user_id) for c in checklists],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/{checklist_id}", response_model=ChecklistResponse)
async def get_checklist(
    checklist_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single checklist with items and progress."""
    result = await db.execute(
        select(Checklist)
        .options(
            selectinload(Checklist.items).selectinload(ChecklistItem.completions),
            selectinload(Checklist.assignments),
        )
        .where(Checklist.id == checklist_id)
    )
    checklist = result.scalar_one_or_none()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    # Access check
    if current_user.role == "recruit":
        assigned = any(a.user_id == current_user.id for a in checklist.assignments)
        if not assigned:
            raise HTTPException(status_code=403, detail="Not assigned to this checklist")

    user_id = current_user.id if current_user.role == "recruit" else None
    return _build_checklist_response(checklist, user_id)


@router.put("/{checklist_id}", response_model=ChecklistResponse)
async def update_checklist(
    checklist_id: uuid.UUID,
    data: ChecklistUpdate,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """Update a checklist (manager/admin only)."""
    result = await db.execute(
        select(Checklist)
        .options(
            selectinload(Checklist.items).selectinload(ChecklistItem.completions),
            selectinload(Checklist.assignments),
        )
        .where(Checklist.id == checklist_id)
    )
    checklist = result.scalar_one_or_none()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    if data.title is not None:
        checklist.title = data.title
    if data.description is not None:
        checklist.description = data.description

    await db.flush()
    return _build_checklist_response(checklist)


@router.delete("/{checklist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checklist(
    checklist_id: uuid.UUID,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """Delete a checklist (manager/admin only)."""
    result = await db.execute(select(Checklist).where(Checklist.id == checklist_id))
    checklist = result.scalar_one_or_none()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    await db.delete(checklist)


# --- Checklist Items ---

@router.post("/{checklist_id}/items", response_model=ChecklistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_checklist_item(
    checklist_id: uuid.UUID,
    data: ChecklistItemCreate,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """Add an item to a checklist."""
    result = await db.execute(select(Checklist).where(Checklist.id == checklist_id))
    checklist = result.scalar_one_or_none()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    item = ChecklistItem(
        checklist_id=checklist_id,
        title=data.title,
        description=data.description,
        order=data.order,
    )
    db.add(item)
    await db.flush()

    return {
        "id": item.id,
        "checklist_id": item.checklist_id,
        "title": item.title,
        "description": item.description,
        "order": item.order,
        "created_at": item.created_at,
        "is_completed": False,
        "completed_at": None,
    }


@router.delete("/{checklist_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checklist_item(
    checklist_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """Remove an item from a checklist."""
    result = await db.execute(
        select(ChecklistItem).where(
            ChecklistItem.id == item_id,
            ChecklistItem.checklist_id == checklist_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)


# --- Assignments ---

@router.post("/{checklist_id}/assign", response_model=ChecklistAssignmentResponse)
async def assign_checklist(
    checklist_id: uuid.UUID,
    data: ChecklistAssignRequest,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """Assign a checklist to a recruit."""
    # Verify checklist exists
    result = await db.execute(select(Checklist).where(Checklist.id == checklist_id))
    checklist = result.scalar_one_or_none()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    # Verify user exists and is a recruit
    user_result = await db.execute(select(User).where(User.id == data.user_id))
    target_user = user_result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already assigned
    existing = await db.execute(
        select(ChecklistAssignment).where(
            ChecklistAssignment.checklist_id == checklist_id,
            ChecklistAssignment.user_id == data.user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Checklist already assigned to this user")

    assignment = ChecklistAssignment(
        checklist_id=checklist_id,
        user_id=data.user_id,
    )
    db.add(assignment)
    await db.flush()

    return {
        "id": assignment.id,
        "checklist_id": assignment.checklist_id,
        "user_id": assignment.user_id,
        "assigned_at": assignment.assigned_at,
        "user_name": target_user.full_name,
    }


@router.delete("/{checklist_id}/assign/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_checklist(
    checklist_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """Unassign a checklist from a recruit."""
    result = await db.execute(
        select(ChecklistAssignment).where(
            ChecklistAssignment.checklist_id == checklist_id,
            ChecklistAssignment.user_id == user_id,
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.delete(assignment)


# --- Item Completion (recruits) ---

@router.put("/items/{item_id}/complete")
async def complete_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a checklist item as completed."""
    # Verify item exists
    item_result = await db.execute(
        select(ChecklistItem)
        .options(selectinload(ChecklistItem.completions))
        .where(ChecklistItem.id == item_id)
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Verify user is assigned to this checklist
    assignment_result = await db.execute(
        select(ChecklistAssignment).where(
            ChecklistAssignment.checklist_id == item.checklist_id,
            ChecklistAssignment.user_id == current_user.id,
        )
    )
    if not assignment_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not assigned to this checklist")

    # Check if already completed
    existing = await db.execute(
        select(ChecklistCompletion).where(
            ChecklistCompletion.item_id == item_id,
            ChecklistCompletion.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Item already completed", "item_id": str(item_id)}

    completion = ChecklistCompletion(
        item_id=item_id,
        user_id=current_user.id,
    )
    db.add(completion)
    await db.flush()

    return {"message": "Item completed", "item_id": str(item_id), "completed_at": completion.completed_at.isoformat()}


@router.delete("/items/{item_id}/complete", status_code=status.HTTP_204_NO_CONTENT)
async def uncomplete_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unmark a checklist item as completed."""
    result = await db.execute(
        select(ChecklistCompletion).where(
            ChecklistCompletion.item_id == item_id,
            ChecklistCompletion.user_id == current_user.id,
        )
    )
    completion = result.scalar_one_or_none()
    if not completion:
        raise HTTPException(status_code=404, detail="Completion not found")
    await db.delete(completion)


# --- Progress ---

@router.get("/{checklist_id}/progress", response_model=ChecklistProgressResponse)
async def get_checklist_progress(
    checklist_id: uuid.UUID,
    user_id: uuid.UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get progress for a checklist. Recruits see their own, managers can specify user_id."""
    result = await db.execute(
        select(Checklist)
        .options(
            selectinload(Checklist.items).selectinload(ChecklistItem.completions),
            selectinload(Checklist.assignments),
        )
        .where(Checklist.id == checklist_id)
    )
    checklist = result.scalar_one_or_none()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    target_user_id = user_id if user_id and current_user.role != "recruit" else current_user.id

    items_data = []
    completed_count = 0
    for item in checklist.items:
        is_completed = False
        completed_at = None
        for c in item.completions:
            if c.user_id == target_user_id:
                is_completed = True
                completed_at = c.completed_at
                break
        if is_completed:
            completed_count += 1
        items_data.append({
            "id": item.id,
            "checklist_id": item.checklist_id,
            "title": item.title,
            "description": item.description,
            "order": item.order,
            "created_at": item.created_at,
            "is_completed": is_completed,
            "completed_at": completed_at,
        })

    total_items = len(checklist.items)
    return {
        "checklist_id": checklist.id,
        "checklist_title": checklist.title,
        "total_items": total_items,
        "completed_items": completed_count,
        "completion_rate": round(completed_count / total_items * 100, 1) if total_items > 0 else 0.0,
        "items": items_data,
    }
