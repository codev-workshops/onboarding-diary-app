import { prisma } from "../config";
import type { ReportType, ReportFormat } from "@prisma/client";
import { NotFoundError, ForbiddenError, ValidationError } from "../utils";
import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import { PassThrough } from "stream";

interface GenerateReportInput {
  dateFrom: string;
  dateTo: string;
  category: ReportType;
  format: ReportFormat;
  userId?: string;
}

const taskFields = { id: true, date: true, title: true, description: true, category: true, status: true, priority: true, createdAt: true };
const issueFields = { id: true, date: true, title: true, description: true, severity: true, status: true, resolutionNotes: true, createdAt: true };
const feedbackFields = { id: true, date: true, subject: true, type: true, details: true, createdAt: true };
const noteFields = { id: true, date: true, title: true, content: true, tags: true, createdAt: true };

async function fetchReportData(targetUserId: string, dateFrom: Date, dateTo: Date, category: ReportType) {
  const dateFilter = { gte: dateFrom, lte: dateTo };

  const data: { tasks?: unknown[]; issues?: unknown[]; feedback?: unknown[]; notes?: unknown[] } = {};

  if (category === "tasks" || category === "combined") {
    data.tasks = await prisma.task.findMany({
      where: { userId: targetUserId, date: dateFilter },
      select: taskFields,
      orderBy: { date: "desc" },
    });
  }

  if (category === "issues" || category === "combined") {
    data.issues = await prisma.issue.findMany({
      where: { userId: targetUserId, date: dateFilter },
      select: issueFields,
      orderBy: { date: "desc" },
    });
  }

  if (category === "feedback" || category === "combined") {
    data.feedback = await prisma.feedback.findMany({
      where: { userId: targetUserId, date: dateFilter },
      select: feedbackFields,
      orderBy: { date: "desc" },
    });
  }

  if (category === "combined") {
    data.notes = await prisma.note.findMany({
      where: { userId: targetUserId, date: dateFilter },
      select: noteFields,
      orderBy: { date: "desc" },
    });
  }

  return data;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatLabel(val: string): string {
  return val.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function generateCSV(data: Record<string, unknown[]>, category: string): string {
  const rows: Record<string, string>[] = [];

  if (data.tasks) {
    for (const t of data.tasks as Array<Record<string, unknown>>) {
      rows.push({
        Type: "Task",
        Date: formatDate(t.date as string),
        Title: t.title as string,
        Description: (t.description as string) || "",
        Category: formatLabel(t.category as string),
        Status: formatLabel(t.status as string),
        Priority: formatLabel(t.priority as string),
      });
    }
  }

  if (data.issues) {
    for (const i of data.issues as Array<Record<string, unknown>>) {
      rows.push({
        Type: "Issue",
        Date: formatDate(i.date as string),
        Title: i.title as string,
        Description: i.description as string,
        Category: formatLabel(i.severity as string),
        Status: formatLabel(i.status as string),
        Priority: (i.resolutionNotes as string) || "",
      });
    }
  }

  if (data.feedback) {
    for (const f of data.feedback as Array<Record<string, unknown>>) {
      rows.push({
        Type: "Feedback",
        Date: formatDate(f.date as string),
        Title: f.subject as string,
        Description: f.details as string,
        Category: formatLabel(f.type as string),
        Status: "",
        Priority: "",
      });
    }
  }

  if (data.notes) {
    for (const n of data.notes as Array<Record<string, unknown>>) {
      rows.push({
        Type: "Note",
        Date: formatDate(n.date as string),
        Title: n.title as string,
        Description: n.content as string,
        Category: (n.tags as string[]).join(", "),
        Status: "",
        Priority: "",
      });
    }
  }

  if (rows.length === 0) {
    return "Type,Date,Title,Description,Category,Status,Priority\n";
  }

  const fields = category === "combined"
    ? ["Type", "Date", "Title", "Description", "Category", "Status", "Priority"]
    : Object.keys(rows[0]);

  const parser = new Parser({ fields });
  return parser.parse(rows);
}

function generatePDFStream(
  data: Record<string, unknown[]>,
  category: string,
  dateFrom: string,
  dateTo: string,
  userName: string
): PassThrough {
  const stream = new PassThrough();
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(stream);

  // Header
  doc.fontSize(20).font("Helvetica-Bold").text("Onboarding Diary Report", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(12).font("Helvetica")
    .text(`User: ${userName}`, { align: "center" })
    .text(`Period: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`, { align: "center" })
    .text(`Category: ${formatLabel(category)}`, { align: "center" });
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  const addSection = (title: string, items: Array<Record<string, unknown>>, fields: Array<{ key: string; label: string }>) => {
    if (items.length === 0) return;
    doc.fontSize(16).font("Helvetica-Bold").text(title);
    doc.moveDown(0.5);

    for (const item of items) {
      for (const field of fields) {
        const value = item[field.key];
        const displayValue = field.key === "date" ? formatDate(value as string)
          : field.key === "tags" ? (value as string[]).join(", ")
          : typeof value === "string" ? (value.includes("_") ? formatLabel(value) : value)
          : String(value || "");
        doc.fontSize(10).font("Helvetica-Bold").text(`${field.label}: `, { continued: true })
          .font("Helvetica").text(displayValue);
      }
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
      doc.moveDown(0.5);

      if (doc.y > 700) {
        doc.addPage();
      }
    }
    doc.moveDown(1);
  };

  if (data.tasks) {
    addSection("Tasks", data.tasks as Array<Record<string, unknown>>, [
      { key: "date", label: "Date" },
      { key: "title", label: "Title" },
      { key: "description", label: "Description" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
    ]);
  }

  if (data.issues) {
    addSection("Issues", data.issues as Array<Record<string, unknown>>, [
      { key: "date", label: "Date" },
      { key: "title", label: "Title" },
      { key: "description", label: "Description" },
      { key: "severity", label: "Severity" },
      { key: "status", label: "Status" },
      { key: "resolutionNotes", label: "Resolution Notes" },
    ]);
  }

  if (data.feedback) {
    addSection("Feedback", data.feedback as Array<Record<string, unknown>>, [
      { key: "date", label: "Date" },
      { key: "subject", label: "Subject" },
      { key: "type", label: "Type" },
      { key: "details", label: "Details" },
    ]);
  }

  if (data.notes) {
    addSection("Notes", data.notes as Array<Record<string, unknown>>, [
      { key: "date", label: "Date" },
      { key: "title", label: "Title" },
      { key: "content", label: "Content" },
      { key: "tags", label: "Tags" },
    ]);
  }

  if (!data.tasks?.length && !data.issues?.length && !data.feedback?.length && !data.notes?.length) {
    doc.fontSize(12).font("Helvetica").text("No entries found for the selected period and category.", { align: "center" });
  }

  doc.end();
  return stream;
}

export async function generateReport(
  requesterId: string,
  requesterRole: string,
  input: GenerateReportInput
) {
  const dateFrom = new Date(input.dateFrom);
  const dateTo = new Date(input.dateTo);

  if (dateTo < dateFrom) {
    throw new ValidationError([{ field: "dateTo", message: "End date must be on or after start date" }]);
  }

  let targetUserId = requesterId;

  if (input.userId && input.userId !== requesterId) {
    if (requesterRole === "recruit") {
      throw new ForbiddenError("Recruits can only generate reports for themselves");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, managerId: true },
    });

    if (!targetUser) {
      throw new NotFoundError("User");
    }

    if (requesterRole === "manager" && targetUser.managerId !== requesterId) {
      throw new ForbiddenError("You can only generate reports for your assigned recruits");
    }

    targetUserId = input.userId;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { fullName: true },
  });

  const data = await fetchReportData(targetUserId, dateFrom, dateTo, input.category);

  if (input.format === "csv") {
    const csv = generateCSV(data, input.category);
    return { type: "csv" as const, content: csv, fileName: `report-${input.category}-${input.dateFrom}-${input.dateTo}.csv` };
  }

  const pdfStream = generatePDFStream(data, input.category, input.dateFrom, input.dateTo, targetUser?.fullName || "Unknown");
  return { type: "pdf" as const, stream: pdfStream, fileName: `report-${input.category}-${input.dateFrom}-${input.dateTo}.pdf` };
}
