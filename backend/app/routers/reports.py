"""Reports endpoints — generate, list, and download reports."""

import csv
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.feedback import Feedback
from app.models.issue import Issue
from app.models.note import Note
from app.models.report import Report
from app.models.task import Task
from app.models.user import User
from app.schemas.report import (
    PaginatedReportResponse,
    ReportGenerateRequest,
    ReportGenerateResponse,
    ReportResponse,
)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])

REPORTS_DIR = "/tmp/reports"
os.makedirs(REPORTS_DIR, exist_ok=True)


async def _resolve_target_user(
    current_user: User,
    requested_user_id: uuid.UUID | None,
    db: AsyncSession,
) -> uuid.UUID:
    """Resolve whose data the report covers and enforce access rules."""
    if requested_user_id is None:
        return current_user.id

    if requested_user_id == current_user.id:
        return current_user.id

    if current_user.role == "admin":
        return requested_user_id

    if current_user.role == "manager":
        result = await db.execute(
            select(User).where(
                User.id == requested_user_id,
                User.manager_id == current_user.id,
            )
        )
        recruit = result.scalar_one_or_none()
        if recruit is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only generate reports for recruits you manage",
            )
        return requested_user_id

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You can only generate reports for yourself",
    )


async def _fetch_report_data(
    db: AsyncSession,
    target_user_id: uuid.UUID,
    req: ReportGenerateRequest,
) -> dict:
    """Fetch the relevant data rows for the report."""
    data: dict = {}

    if req.report_type in ("tasks", "combined"):
        result = await db.execute(
            select(Task)
            .where(
                Task.user_id == target_user_id,
                Task.date >= req.date_from,
                Task.date <= req.date_to,
            )
            .order_by(Task.date.desc())
        )
        data["tasks"] = result.scalars().all()

    if req.report_type in ("issues", "combined"):
        result = await db.execute(
            select(Issue)
            .where(
                Issue.user_id == target_user_id,
                Issue.date >= req.date_from,
                Issue.date <= req.date_to,
            )
            .order_by(Issue.date.desc())
        )
        data["issues"] = result.scalars().all()

    if req.report_type in ("feedback", "combined"):
        result = await db.execute(
            select(Feedback)
            .where(
                Feedback.user_id == target_user_id,
                Feedback.date >= req.date_from,
                Feedback.date <= req.date_to,
            )
            .order_by(Feedback.date.desc())
        )
        data["feedback"] = result.scalars().all()

    return data


def _generate_csv(data: dict, file_path: str) -> None:
    """Write report data to a CSV file."""
    with open(file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        if "tasks" in data:
            writer.writerow(
                ["[Tasks]", "Date", "Title", "Category", "Status", "Priority", "Description"]
            )
            for t in data["tasks"]:
                writer.writerow(
                    [
                        "",
                        str(t.date),
                        t.title,
                        t.category,
                        t.status,
                        t.priority,
                        t.description or "",
                    ]
                )
            writer.writerow([])

        if "issues" in data:
            writer.writerow(
                ["[Issues]", "Date", "Title", "Severity", "Status", "Description", "Resolution"]
            )
            for i in data["issues"]:
                writer.writerow(
                    [
                        "",
                        str(i.date),
                        i.title,
                        i.severity,
                        i.status,
                        i.description,
                        i.resolution_notes or "",
                    ]
                )
            writer.writerow([])

        if "feedback" in data:
            writer.writerow(["[Feedback]", "Date", "Subject", "Type", "Details"])
            for fb in data["feedback"]:
                writer.writerow(
                    ["", str(fb.date), fb.subject, fb.feedback_type, fb.details]
                )
            writer.writerow([])


def _generate_pdf(data: dict, file_path: str, date_from: str, date_to: str) -> None:
    """Write report data to a PDF file."""
    doc = SimpleDocTemplate(file_path, pagesize=A4)
    styles = getSampleStyleSheet()
    elements: list = []

    elements.append(Paragraph("Onboarding Diary Report", styles["Title"]))
    elements.append(
        Paragraph(f"Period: {date_from} to {date_to}", styles["Normal"])
    )
    elements.append(Spacer(1, 10 * mm))

    table_style = TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1677ff")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]
    )

    if "tasks" in data:
        elements.append(Paragraph("Tasks", styles["Heading2"]))
        rows = [["Date", "Title", "Category", "Status", "Priority"]]
        for t in data["tasks"]:
            rows.append([str(t.date), t.title, t.category, t.status, t.priority])
        if len(rows) > 1:
            tbl = Table(rows, repeatRows=1)
            tbl.setStyle(table_style)
            elements.append(tbl)
        else:
            elements.append(Paragraph("No tasks found.", styles["Normal"]))
        elements.append(Spacer(1, 6 * mm))

    if "issues" in data:
        elements.append(Paragraph("Issues", styles["Heading2"]))
        rows = [["Date", "Title", "Severity", "Status"]]
        for i in data["issues"]:
            rows.append([str(i.date), i.title, i.severity, i.status])
        if len(rows) > 1:
            tbl = Table(rows, repeatRows=1)
            tbl.setStyle(table_style)
            elements.append(tbl)
        else:
            elements.append(Paragraph("No issues found.", styles["Normal"]))
        elements.append(Spacer(1, 6 * mm))

    if "feedback" in data:
        elements.append(Paragraph("Feedback", styles["Heading2"]))
        rows = [["Date", "Subject", "Type"]]
        for fb in data["feedback"]:
            rows.append([str(fb.date), fb.subject, fb.feedback_type])
        if len(rows) > 1:
            tbl = Table(rows, repeatRows=1)
            tbl.setStyle(table_style)
            elements.append(tbl)
        else:
            elements.append(Paragraph("No feedback found.", styles["Normal"]))

    doc.build(elements)


@router.post("/generate", response_model=ReportGenerateResponse)
async def generate_report(
    body: ReportGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a report and return a download link."""
    if body.date_from > body.date_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="date_from must be before date_to",
        )

    target_user_id = await _resolve_target_user(current_user, body.user_id, db)

    # Fetch data
    data = await _fetch_report_data(db, target_user_id, body)

    # Generate file
    report_id = uuid.uuid4()
    ext = body.report_format.value
    file_name = f"{report_id}.{ext}"
    file_path = os.path.join(REPORTS_DIR, file_name)

    if body.report_format.value == "csv":
        _generate_csv(data, file_path)
    else:
        _generate_pdf(data, file_path, str(body.date_from), str(body.date_to))

    # Persist report record
    report = Report(
        id=report_id,
        generated_by=current_user.id,
        target_user_id=target_user_id if target_user_id != current_user.id else None,
        date_from=body.date_from,
        date_to=body.date_to,
        report_type=body.report_type.value,
        format=body.report_format.value,
        file_path=file_path,
    )
    db.add(report)
    await db.flush()

    return ReportGenerateResponse(
        report_id=report_id,
        download_url=f"/api/v1/reports/{report_id}/download",
    )


@router.get("/", response_model=PaginatedReportResponse)
async def list_reports(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List reports generated by or for the current user."""
    q = select(Report).where(
        (Report.generated_by == current_user.id)
        | (Report.target_user_id == current_user.id)
    )

    from sqlalchemy import func as sa_func

    count_q = select(sa_func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    result = await db.execute(
        q.order_by(Report.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    reports = result.scalars().all()

    return PaginatedReportResponse(
        items=[ReportResponse.model_validate(r) for r in reports],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{report_id}/download")
async def download_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download a previously generated report file."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    # Access check: only generator, target user, or admin can download
    if (
        report.generated_by != current_user.id
        and report.target_user_id != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this report",
        )

    if not os.path.exists(report.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file not found on disk",
        )

    media_type = "text/csv" if report.format == "csv" else "application/pdf"
    filename = f"report_{report.date_from}_{report.date_to}.{report.format}"

    return FileResponse(
        path=report.file_path,
        media_type=media_type,
        filename=filename,
    )


@router.get("/recruits", response_model=list[dict])
async def list_recruits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List recruits that the current manager/admin can generate reports for."""
    if current_user.role not in ("manager", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can access this endpoint",
        )

    if current_user.role == "admin":
        q = select(User).where(User.role == "recruit", User.is_active.is_(True))
    else:
        q = select(User).where(
            User.manager_id == current_user.id, User.is_active.is_(True)
        )

    result = await db.execute(q)
    recruits = result.scalars().all()

    return [
        {
            "id": str(r.id),
            "full_name": r.full_name,
            "email": r.email,
            "department": r.department,
        }
        for r in recruits
    ]
