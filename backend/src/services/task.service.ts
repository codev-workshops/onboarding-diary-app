import { prisma } from "../config";
import { NotFoundError, ForbiddenError, parsePagination, buildPaginatedResponse } from "../utils";
import { TaskStatus, TaskPriority, TaskCategory, Prisma } from "@prisma/client";

interface CreateTaskInput {
  date: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status?: TaskStatus;
  priority?: TaskPriority;
}

interface UpdateTaskInput {
  date?: string;
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  priority?: TaskPriority;
}

interface ListTasksQuery {
  page?: string;
  perPage?: string;
  sortBy?: string;
  sortOrder?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  status?: string;
  priority?: string;
  search?: string;
}

const taskSelectFields = {
  id: true,
  userId: true,
  date: true,
  title: true,
  description: true,
  category: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
};

export async function createTask(userId: string, input: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      userId,
      date: new Date(input.date),
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category,
      status: input.status || "not_started",
      priority: input.priority || "medium",
    },
    select: taskSelectFields,
  });

  return task;
}

export async function getTaskById(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: taskSelectFields,
  });

  if (!task) {
    throw new NotFoundError("Task");
  }

  if (task.userId !== userId) {
    throw new ForbiddenError("You can only view your own tasks");
  }

  return task;
}

export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Task");
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError("You can only edit your own tasks");
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.date !== undefined && { date: new Date(input.date) }),
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() || null }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.priority !== undefined && { priority: input.priority }),
    },
    select: taskSelectFields,
  });

  return task;
}

export async function deleteTask(taskId: string, userId: string) {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Task");
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError("You can only delete your own tasks");
  }

  await prisma.task.delete({
    where: { id: taskId },
  });
}

export async function listTasks(userId: string, query: ListTasksQuery) {
  const { page, perPage, skip } = parsePagination(query);

  const allowedSortFields = ["date", "title", "status", "priority", "category", "createdAt"];
  const sortBy = allowedSortFields.includes(query.sortBy || "") ? query.sortBy! : "date";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const where: Prisma.TaskWhereInput = { userId };

  if (query.date) {
    where.date = new Date(query.date);
  } else {
    if (query.dateFrom) {
      where.date = { ...(where.date as Prisma.DateTimeFilter || {}), gte: new Date(query.dateFrom) };
    }
    if (query.dateTo) {
      where.date = { ...(where.date as Prisma.DateTimeFilter || {}), lte: new Date(query.dateTo) };
    }
  }

  if (query.category) {
    where.category = query.category as TaskCategory;
  }

  if (query.status) {
    where.status = query.status as TaskStatus;
  }

  if (query.priority) {
    where.priority = query.priority as TaskPriority;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: taskSelectFields,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: perPage,
    }),
    prisma.task.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, perPage);
}
