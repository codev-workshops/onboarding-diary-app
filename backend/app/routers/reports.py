import csv
import io
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.feedback import Feedback
from app.models.issue import Issue
from app.models.note import Note
from app.models.report import Report
from app.models.task import Task
from app.models.user import User
from app.schemas.report import ReportGenerate, ReportListResponse, ReportResponse

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "generated_reports")


async def _generate_csv_content(
    db: AsyncSession,
    target_user_id: uuid.UUID,
    date_from,
    date_to,
    report_type: str,
) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type in ("tasks", "combined"):
        writer.writerow(["--- TASKS ---"])
        writer.writerow(["Date", "Title", "Description", "Category", "Status", "Priority"])
        result = await db.execute(
            select(Task)
            .where(
                Task.user_id == target_user_id,
                Task.date >= date_from,
                Task.date <= date_to,
            )
            .order_by(Task.date.desc())
        )
        for t in result.scalars().all():
            writer.writerow([
                t.date.isoformat(),
                t.title,
                t.description or "",
                t.category,
                t.status,
                t.priority,
            ])
        writer.writerow([])

    if report_type in ("issues", "combined"):
        writer.writerow(["--- ISSUES ---"])
        writer.writerow(["Date", "Title", "Description", "Severity", "Status", "Resolution Notes"])
        result = await db.execute(
            select(Issue)
            .where(
                Issue.user_id == target_user_id,
                Issue.date >= date_from,
                Issue.date <= date_to,
            )
            .order_by(Issue.date.desc())
        )
        for i in result.scalars().all():
            writer.writerow([
                i.date.isoformat(),
                i.title,
                i.description,
                i.severity,
                i.status,
                i.resolution_notes or "",
            ])
        writer.writerow([])

    if report_type in ("feedback", "combined"):
        writer.writerow(["--- FEEDBACK ---"])
        writer.writerow(["Date", "Subject", "Type", "Details"])
        result = await db.execute(
            select(Feedback)
            .where(
                Feedback.user_id == target_user_id,
                Feedback.date >= date_from,
                Feedback.date <= date_to,
            )
            .order_by(Feedback.date.desc())
        )
        for f in result.scalars().all():
            writer.writerow([
                f.date.isoformat(),
                f.subject,
                f.type,
                f.details,
            ])
        writer.writerow([])

    if report_type == "combined":
        writer.writerow(["--- NOTES ---"])
        writer.writerow(["Date", "Title", "Content", "Tags"])
        result = await db.execute(
            select(Note)
            .where(
                Note.user_id == target_user_id,
                Note.date >= date_from,
                Note.date <= date_to,
            )
            .order_by(Note.date.desc())
        )
        for n in result.scalars().all():
            writer.writerow([
                n.date.isoformat(),
                n.title,
                n.content,
                ", ".join(n.tags) if n.tags else "",
            ])

    return output.getvalue()


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    data: ReportGenerate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Determine target user
    target_user_id = data.user_id
    if target_user_id is not None:
        # Only managers/admins can generate reports for other users
        if current_user.role == "recruit":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Recruits can only generate reports for themselves.",
            )
        # Managers can only generate for their assigned recruits
        if current_user.role == "manager":
            target_result = await db.execute(
                select(User).where(User.id == target_user_id)
            )
            target_user = target_result.scalar_one_or_none()
            if target_user is None or target_user.manager_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this user's data.",
                )
    else:
        target_user_id = current_user.id

    # Only CSV is supported (PDF would require additional dependencies)
    if data.format == "pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF format is not yet supported. Please use CSV.",
        )

    # Generate CSV content
    csv_content = await _generate_csv_content(
        db, target_user_id, data.date_from, data.date_to, data.type
    )

    # Save to file
    os.makedirs(REPORTS_DIR, exist_ok=True)
    report_id = uuid.uuid4()
    filename = f"report_{report_id}.csv"
    file_path = os.path.join(REPORTS_DIR, filename)

    with open(file_path, "w", newline="") as f:
        f.write(csv_content)

    # Save report record
    report = Report(
        id=report_id,
        generated_by=current_user.id,
        target_user_id=target_user_id,
        date_from=data.date_from,
        date_to=data.date_to,
        report_type=data.type,
        format=data.format,
        file_path=file_path,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


@router.get("/{report_id}/download")
async def download_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    # Access check: only the generator, target user, or admin can download
    if (
        current_user.role != "admin"
        and report.generated_by != current_user.id
        and report.target_user_id != current_user.id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if not os.path.exists(report.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file not found on server",
        )

    filename = f"report_{report.date_from}_{report.date_to}_{report.report_type}.{report.format}"

    def iter_file():
        with open(report.file_path, "rb") as f:
            yield from f

    media_type = "text/csv" if report.format == "csv" else "application/pdf"
    return StreamingResponse(
        iter_file(),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("", response_model=ReportListResponse)
async def list_reports(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Users see reports they generated or that target them
    if current_user.role == "admin":
        query = select(Report)
        count_query = select(func.count()).select_from(Report)
    else:
        query = select(Report).where(
            (Report.generated_by == current_user.id)
            | (Report.target_user_id == current_user.id)
        )
        count_query = (
            select(func.count())
            .select_from(Report)
            .where(
                (Report.generated_by == current_user.id)
                | (Report.target_user_id == current_user.id)
            )
        )

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset((page - 1) * per_page).limit(per_page).order_by(Report.created_at.desc())
    result = await db.execute(query)
    reports = result.scalars().all()

    return ReportListResponse(
        items=[ReportResponse.model_validate(r) for r in reports],
        total=total,
        page=page,
        per_page=per_page,
    )
