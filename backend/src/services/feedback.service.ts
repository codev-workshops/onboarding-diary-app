import { prisma } from "../config";
import { NotFoundError, ForbiddenError, parsePagination, buildPaginatedResponse } from "../utils";
import type { FeedbackType, Prisma } from "@prisma/client";

interface CreateFeedbackInput {
  date: string;
  subject: string;
  type: FeedbackType;
  details: string;
}

interface UpdateFeedbackInput {
  date?: string;
  subject?: string;
  type?: FeedbackType;
  details?: string;
}

interface ListFeedbackQuery {
  page?: string;
  perPage?: string;
  sortBy?: string;
  sortOrder?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  search?: string;
}

const feedbackSelectFields = {
  id: true,
  userId: true,
  date: true,
  subject: true,
  type: true,
  details: true,
  createdAt: true,
  updatedAt: true,
};

export async function createFeedback(userId: string, input: CreateFeedbackInput) {
  const feedback = await prisma.feedback.create({
    data: {
      userId,
      date: new Date(input.date),
      subject: input.subject.trim(),
      type: input.type,
      details: input.details.trim(),
    },
    select: feedbackSelectFields,
  });

  return feedback;
}

export async function getFeedbackById(feedbackId: string, userId: string) {
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: feedbackSelectFields,
  });

  if (!feedback) {
    throw new NotFoundError("Feedback");
  }

  if (feedback.userId !== userId) {
    throw new ForbiddenError("You can only view your own feedback");
  }

  return feedback;
}

export async function updateFeedback(feedbackId: string, userId: string, input: UpdateFeedbackInput) {
  const existing = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Feedback");
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError("You can only edit your own feedback");
  }

  const feedback = await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      ...(input.date !== undefined && { date: new Date(input.date) }),
      ...(input.subject !== undefined && { subject: input.subject.trim() }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.details !== undefined && { details: input.details.trim() }),
    },
    select: feedbackSelectFields,
  });

  return feedback;
}

export async function deleteFeedback(feedbackId: string, userId: string) {
  const existing = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Feedback");
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError("You can only delete your own feedback");
  }

  await prisma.feedback.delete({
    where: { id: feedbackId },
  });
}

export async function listFeedback(userId: string, query: ListFeedbackQuery) {
  const { page, perPage, skip } = parsePagination(query);

  const allowedSortFields = ["date", "subject", "type", "createdAt"];
  const sortBy = allowedSortFields.includes(query.sortBy || "") ? query.sortBy! : "date";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const where: Prisma.FeedbackWhereInput = { userId };

  if (query.dateFrom) {
    where.date = { ...(where.date as Prisma.DateTimeFilter || {}), gte: new Date(query.dateFrom) };
  }
  if (query.dateTo) {
    where.date = { ...(where.date as Prisma.DateTimeFilter || {}), lte: new Date(query.dateTo) };
  }

  if (query.type) {
    where.type = query.type as FeedbackType;
  }

  if (query.search) {
    where.OR = [
      { subject: { contains: query.search, mode: "insensitive" } },
      { details: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      select: feedbackSelectFields,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: perPage,
    }),
    prisma.feedback.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, perPage);
}
