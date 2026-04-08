import { prisma } from "../config";
import { NotFoundError, ForbiddenError, parsePagination, buildPaginatedResponse } from "../utils";
import { IssueStatus, IssueSeverity, Prisma } from "@prisma/client";

interface CreateIssueInput {
  date: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status?: IssueStatus;
  resolutionNotes?: string;
}

interface UpdateIssueInput {
  date?: string;
  title?: string;
  description?: string;
  severity?: IssueSeverity;
  status?: IssueStatus;
  resolutionNotes?: string;
}

interface ListIssuesQuery {
  page?: string;
  perPage?: string;
  sortBy?: string;
  sortOrder?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  severity?: string;
  search?: string;
}

const issueSelectFields = {
  id: true,
  userId: true,
  date: true,
  title: true,
  description: true,
  severity: true,
  status: true,
  resolutionNotes: true,
  createdAt: true,
  updatedAt: true,
};

export async function createIssue(userId: string, input: CreateIssueInput) {
  const issue = await prisma.issue.create({
    data: {
      userId,
      date: new Date(input.date),
      title: input.title.trim(),
      description: input.description.trim(),
      severity: input.severity,
      status: input.status || "open",
      resolutionNotes: input.resolutionNotes?.trim() || null,
    },
    select: issueSelectFields,
  });

  return issue;
}

export async function getIssueById(issueId: string, userId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: issueSelectFields,
  });

  if (!issue) {
    throw new NotFoundError("Issue");
  }

  if (issue.userId !== userId) {
    throw new ForbiddenError("You can only view your own issues");
  }

  return issue;
}

export async function updateIssue(issueId: string, userId: string, input: UpdateIssueInput) {
  const existing = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Issue");
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError("You can only edit your own issues");
  }

  const issue = await prisma.issue.update({
    where: { id: issueId },
    data: {
      ...(input.date !== undefined && { date: new Date(input.date) }),
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.severity !== undefined && { severity: input.severity }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.resolutionNotes !== undefined && {
        resolutionNotes: input.resolutionNotes?.trim() || null,
      }),
    },
    select: issueSelectFields,
  });

  return issue;
}

export async function deleteIssue(issueId: string, userId: string) {
  const existing = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Issue");
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError("You can only delete your own issues");
  }

  await prisma.issue.delete({
    where: { id: issueId },
  });
}

export async function listIssues(userId: string, query: ListIssuesQuery) {
  const { page, perPage, skip } = parsePagination(query);

  const allowedSortFields = ["date", "title", "status", "severity", "createdAt"];
  const sortBy = allowedSortFields.includes(query.sortBy || "") ? query.sortBy! : "date";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const where: Prisma.IssueWhereInput = { userId };

  if (query.dateFrom) {
    where.date = { ...(where.date as Prisma.DateTimeFilter || {}), gte: new Date(query.dateFrom) };
  }
  if (query.dateTo) {
    where.date = { ...(where.date as Prisma.DateTimeFilter || {}), lte: new Date(query.dateTo) };
  }

  if (query.status) {
    where.status = query.status as IssueStatus;
  }

  if (query.severity) {
    where.severity = query.severity as IssueSeverity;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      select: issueSelectFields,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: perPage,
    }),
    prisma.issue.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, perPage);
}
