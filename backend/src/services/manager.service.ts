import { prisma } from "../config";
import { ForbiddenError, NotFoundError, parsePagination, buildPaginatedResponse } from "../utils";
import type { Prisma } from "@prisma/client";

const recruitSelectFields = {
  id: true,
  fullName: true,
  email: true,
  department: true,
  startDate: true,
  isActive: true,
  createdAt: true,
};

export async function getManagerDashboard(managerId: string, callerRole: string) {
  const where = callerRole === "admin"
    ? { role: "recruit" as const }
    : { managerId, role: "recruit" as const };

  const recruits = await prisma.user.findMany({
    where,
    select: recruitSelectFields,
  });

  const recruitStats = await Promise.all(
    recruits.map(async (recruit) => {
      const [totalTasks, completedTasks, totalIssues, openIssues, totalFeedback, totalNotes] = await Promise.all([
        prisma.task.count({ where: { userId: recruit.id } }),
        prisma.task.count({ where: { userId: recruit.id, status: "completed" } }),
        prisma.issue.count({ where: { userId: recruit.id } }),
        prisma.issue.count({ where: { userId: recruit.id, status: { in: ["open", "in_progress"] } } }),
        prisma.feedback.count({ where: { userId: recruit.id } }),
        prisma.note.count({ where: { userId: recruit.id } }),
      ]);

      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...recruit,
        totalTasks,
        completedTasks,
        taskCompletionRate,
        openIssues,
        totalEntries: totalTasks + totalIssues + totalFeedback + totalNotes,
      };
    })
  );

  const totalRecruits = recruits.length;
  const totalOpenIssues = recruitStats.reduce((sum, r) => sum + r.openIssues, 0);
  const avgTaskCompletionRate = totalRecruits > 0
    ? Math.round(recruitStats.reduce((sum, r) => sum + r.taskCompletionRate, 0) / totalRecruits)
    : 0;

  return {
    recruits: recruitStats,
    aggregate: {
      totalRecruits,
      avgTaskCompletionRate,
      totalOpenIssues,
    },
  };
}

export async function getRecruitList(managerId: string, callerRole: string) {
  const where = callerRole === "admin"
    ? { role: "recruit" as const }
    : { managerId, role: "recruit" as const };

  const recruits = await prisma.user.findMany({
    where,
    select: recruitSelectFields,
  });

  return recruits;
}

async function verifyRecruitAccess(managerId: string, callerRole: string, recruitId: string) {
  const recruit = await prisma.user.findUnique({
    where: { id: recruitId },
    select: { id: true, managerId: true, role: true },
  });

  if (!recruit) {
    throw new NotFoundError("Recruit");
  }

  if (recruit.role !== "recruit") {
    throw new ForbiddenError("You can only view entries of recruits");
  }

  if (callerRole !== "admin" && recruit.managerId !== managerId) {
    throw new ForbiddenError("You can only view entries of your assigned recruits");
  }

  return recruit;
}

export async function getRecruitTasks(managerId: string, callerRole: string, recruitId: string, query: Record<string, string>) {
  await verifyRecruitAccess(managerId, callerRole, recruitId);

  const { page, perPage, skip } = parsePagination(query);
  const where: Prisma.TaskWhereInput = { userId: recruitId };

  if (query.status) where.status = query.status as Prisma.EnumTaskStatusFilter;
  if (query.category) where.category = query.category as Prisma.EnumTaskCategoryFilter;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: { id: true, userId: true, date: true, title: true, description: true, category: true, status: true, priority: true, createdAt: true, updatedAt: true },
      orderBy: { date: "desc" },
      skip,
      take: perPage,
    }),
    prisma.task.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, perPage);
}

export async function getRecruitIssues(managerId: string, callerRole: string, recruitId: string, query: Record<string, string>) {
  await verifyRecruitAccess(managerId, callerRole, recruitId);

  const { page, perPage, skip } = parsePagination(query);
  const where: Prisma.IssueWhereInput = { userId: recruitId };

  if (query.status) where.status = query.status as Prisma.EnumIssueStatusFilter;
  if (query.severity) where.severity = query.severity as Prisma.EnumIssueSeverityFilter;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      select: { id: true, userId: true, date: true, title: true, description: true, severity: true, status: true, resolutionNotes: true, createdAt: true, updatedAt: true },
      orderBy: { date: "desc" },
      skip,
      take: perPage,
    }),
    prisma.issue.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, perPage);
}

export async function getRecruitFeedback(managerId: string, callerRole: string, recruitId: string, query: Record<string, string>) {
  await verifyRecruitAccess(managerId, callerRole, recruitId);

  const { page, perPage, skip } = parsePagination(query);
  const where: Prisma.FeedbackWhereInput = { userId: recruitId };

  if (query.type) where.type = query.type as Prisma.EnumFeedbackTypeFilter;

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      select: { id: true, userId: true, date: true, subject: true, type: true, details: true, createdAt: true, updatedAt: true },
      orderBy: { date: "desc" },
      skip,
      take: perPage,
    }),
    prisma.feedback.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, perPage);
}

export async function getRecruitNotes(managerId: string, callerRole: string, recruitId: string, query: Record<string, string>) {
  await verifyRecruitAccess(managerId, callerRole, recruitId);

  const { page, perPage, skip } = parsePagination(query);
  const where: Prisma.NoteWhereInput = { userId: recruitId };

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { content: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.note.findMany({
      where,
      select: { id: true, userId: true, date: true, title: true, content: true, tags: true, createdAt: true, updatedAt: true },
      orderBy: { date: "desc" },
      skip,
      take: perPage,
    }),
    prisma.note.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, perPage);
}
