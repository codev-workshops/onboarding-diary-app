import { prisma } from "../config";
import { NotFoundError, ConflictError, ValidationError, parsePagination, buildPaginatedResponse, hashPassword } from "../utils";
import type { Role, Prisma } from "@prisma/client";

interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  department?: string;
  startDate?: string;
}

interface UpdateUserInput {
  fullName?: string;
  role?: Role;
  department?: string;
  startDate?: string;
}

interface ListUsersQuery {
  page?: string;
  perPage?: string;
  role?: string;
  department?: string;
  search?: string;
  isActive?: string;
}

const userSelectFields = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  department: true,
  startDate: true,
  managerId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  manager: {
    select: { id: true, fullName: true, email: true },
  },
};

export async function listUsers(query: ListUsersQuery) {
  const { page, perPage, skip } = parsePagination(query);

  const where: Prisma.UserWhereInput = {};

  if (query.role) {
    where.role = query.role as Role;
  }

  if (query.department) {
    where.department = { contains: query.department, mode: "insensitive" };
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive === "true";
  }

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelectFields,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.user.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, perPage);
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelectFields,
  });

  if (!user) {
    throw new NotFoundError("User");
  }

  return user;
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError("A user with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase().trim(),
      passwordHash,
      fullName: input.fullName.trim(),
      role: input.role,
      department: input.department?.trim() || null,
      startDate: input.startDate ? new Date(input.startDate) : null,
    },
    select: userSelectFields,
  });

  return user;
}

export async function updateUser(userId: string, input: UpdateUserInput) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("User");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.fullName !== undefined && { fullName: input.fullName.trim() }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.department !== undefined && { department: input.department?.trim() || null }),
      ...(input.startDate !== undefined && { startDate: input.startDate ? new Date(input.startDate) : null }),
    },
    select: userSelectFields,
  });

  return user;
}

export async function toggleUserStatus(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
  });

  if (!existing) {
    throw new NotFoundError("User");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !existing.isActive },
    select: userSelectFields,
  });

  return user;
}

export async function assignManager(recruitId: string, managerId: string | null) {
  const recruit = await prisma.user.findUnique({
    where: { id: recruitId },
    select: { id: true, role: true },
  });

  if (!recruit) {
    throw new NotFoundError("Recruit");
  }

  if (recruit.role !== "recruit") {
    throw new ValidationError([{ field: "recruitId", message: "Only recruits can be assigned to managers" }]);
  }

  if (managerId) {
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, role: true },
    });

    if (!manager) {
      throw new NotFoundError("Manager");
    }

    if (manager.role !== "manager") {
      throw new ValidationError([{ field: "managerId", message: "Target user must have the manager role" }]);
    }
  }

  const user = await prisma.user.update({
    where: { id: recruitId },
    data: { managerId },
    select: userSelectFields,
  });

  return user;
}

export async function getAdminDashboard() {
  const [
    totalUsers,
    recruitCount,
    managerCount,
    adminCount,
    activeUsers,
    inactiveUsers,
    totalTasks,
    completedTasks,
    totalIssues,
    openIssues,
    totalFeedback,
    totalNotes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "recruit" } }),
    prisma.user.count({ where: { role: "manager" } }),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "completed" } }),
    prisma.issue.count(),
    prisma.issue.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.feedback.count(),
    prisma.note.count(),
  ]);

  return {
    users: {
      total: totalUsers,
      byRole: { recruit: recruitCount, manager: managerCount, admin: adminCount },
      active: activeUsers,
      inactive: inactiveUsers,
    },
    entries: {
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalIssues,
      openIssues,
      totalFeedback,
      totalNotes,
    },
  };
}

export async function getManagers() {
  return prisma.user.findMany({
    where: { role: "manager", isActive: true },
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: "asc" },
  });
}
