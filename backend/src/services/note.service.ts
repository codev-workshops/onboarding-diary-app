import { prisma } from "../config";
import { NotFoundError, ForbiddenError, parsePagination, buildPaginatedResponse } from "../utils";
import type { Prisma } from "@prisma/client";

interface CreateNoteInput {
  date: string;
  title: string;
  content: string;
  tags?: string[];
}

interface UpdateNoteInput {
  date?: string;
  title?: string;
  content?: string;
  tags?: string[];
}

interface ListNotesQuery {
  page?: string;
  perPage?: string;
  sortBy?: string;
  sortOrder?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string;
  search?: string;
}

const noteSelectFields = {
  id: true,
  userId: true,
  date: true,
  title: true,
  content: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
};

export async function createNote(userId: string, input: CreateNoteInput) {
  const note = await prisma.note.create({
    data: {
      userId,
      date: new Date(input.date),
      title: input.title.trim(),
      content: input.content.trim(),
      tags: input.tags || [],
    },
    select: noteSelectFields,
  });

  return note;
}

export async function getNoteById(noteId: string, userId: string) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: noteSelectFields,
  });

  if (!note) {
    throw new NotFoundError("Note");
  }

  if (note.userId !== userId) {
    throw new ForbiddenError("You can only view your own notes");
  }

  return note;
}

export async function updateNote(noteId: string, userId: string, input: UpdateNoteInput) {
  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Note");
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError("You can only edit your own notes");
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data: {
      ...(input.date !== undefined && { date: new Date(input.date) }),
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.content !== undefined && { content: input.content.trim() }),
      ...(input.tags !== undefined && { tags: input.tags }),
    },
    select: noteSelectFields,
  });

  return note;
}

export async function deleteNote(noteId: string, userId: string) {
  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Note");
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError("You can only delete your own notes");
  }

  await prisma.note.delete({
    where: { id: noteId },
  });
}

export async function listNotes(userId: string, query: ListNotesQuery) {
  const { page, perPage, skip } = parsePagination(query);

  const allowedSortFields = ["date", "title", "createdAt"];
  const sortBy = allowedSortFields.includes(query.sortBy || "") ? query.sortBy! : "date";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const where: Prisma.NoteWhereInput = { userId };

  if (query.dateFrom) {
    where.date = { ...(where.date as Prisma.DateTimeFilter || {}), gte: new Date(query.dateFrom) };
  }
  if (query.dateTo) {
    where.date = { ...(where.date as Prisma.DateTimeFilter || {}), lte: new Date(query.dateTo) };
  }

  if (query.tags) {
    const tagList = query.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      where.tags = { hasSome: tagList };
    }
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { content: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.note.findMany({
      where,
      select: noteSelectFields,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: perPage,
    }),
    prisma.note.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, perPage);
}
