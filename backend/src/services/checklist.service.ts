import { prisma } from "../config";
import { NotFoundError, ForbiddenError, ConflictError, ValidationError, parsePagination, buildPaginatedResponse } from "../utils";

// ── Template CRUD (Manager/Admin) ──────────────────────────────────

interface CreateTemplateInput {
  title: string;
  description?: string;
  items: string[];
}

interface UpdateTemplateInput {
  title?: string;
  description?: string;
  items?: string[];
}

const templateSelect = {
  id: true,
  title: true,
  description: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  creator: { select: { id: true, fullName: true } },
  items: {
    select: { id: true, label: true, sortOrder: true },
    orderBy: { sortOrder: "asc" as const },
  },
};

export async function listTemplates(query: Record<string, string>) {
  const { page, perPage, skip } = parsePagination(query);

  const [items, total] = await Promise.all([
    prisma.checklistTemplate.findMany({
      select: templateSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.checklistTemplate.count(),
  ]);

  return buildPaginatedResponse(items, total, page, perPage);
}

export async function getTemplateById(templateId: string) {
  const template = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    select: {
      ...templateSelect,
      assignments: {
        select: {
          id: true,
          recruitId: true,
          recruit: { select: { id: true, fullName: true, email: true } },
          createdAt: true,
        },
      },
    },
  });

  if (!template) {
    throw new NotFoundError("Checklist template");
  }

  return template;
}

export async function createTemplate(createdBy: string, input: CreateTemplateInput) {
  if (!input.items || input.items.length === 0) {
    throw new ValidationError([{ field: "items", message: "At least one checklist item is required" }]);
  }

  const template = await prisma.checklistTemplate.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      createdBy,
      items: {
        create: input.items.map((label, index) => ({
          label: label.trim(),
          sortOrder: index,
        })),
      },
    },
    select: templateSelect,
  });

  return template;
}

export async function updateTemplate(templateId: string, input: UpdateTemplateInput) {
  const existing = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Checklist template");
  }

  if (input.items !== undefined) {
    if (input.items.length === 0) {
      throw new ValidationError([{ field: "items", message: "At least one checklist item is required" }]);
    }

    // Delete old items and recreate
    await prisma.checklistTemplateItem.deleteMany({
      where: { templateId },
    });

    await prisma.checklistTemplateItem.createMany({
      data: input.items.map((label, index) => ({
        templateId,
        label: label.trim(),
        sortOrder: index,
      })),
    });
  }

  const template = await prisma.checklistTemplate.update({
    where: { id: templateId },
    data: {
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() || null }),
    },
    select: templateSelect,
  });

  return template;
}

export async function deleteTemplate(templateId: string) {
  const existing = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Checklist template");
  }

  await prisma.checklistTemplate.delete({ where: { id: templateId } });
}

// ── Assignment (Manager/Admin) ─────────────────────────────────────

export async function assignToRecruit(managerId: string, templateId: string, recruitId: string) {
  const template = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, items: { select: { id: true } } },
  });

  if (!template) {
    throw new NotFoundError("Checklist template");
  }

  const recruit = await prisma.user.findUnique({
    where: { id: recruitId },
    select: { id: true, role: true },
  });

  if (!recruit) {
    throw new NotFoundError("Recruit");
  }

  if (recruit.role !== "recruit") {
    throw new ValidationError([{ field: "recruitId", message: "Checklists can only be assigned to recruits" }]);
  }

  const existingAssignment = await prisma.recruitChecklist.findUnique({
    where: { recruitId_templateId: { recruitId, templateId } },
  });

  if (existingAssignment) {
    throw new ConflictError("This checklist is already assigned to this recruit");
  }

  const assignment = await prisma.recruitChecklist.create({
    data: {
      recruitId,
      templateId,
      assignedBy: managerId,
      items: {
        create: template.items.map((item) => ({
          templateItemId: item.id,
        })),
      },
    },
    select: {
      id: true,
      recruitId: true,
      templateId: true,
      createdAt: true,
      template: {
        select: { id: true, title: true },
      },
      recruit: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  return assignment;
}

// ── Recruit Checklist Operations ────────────────────────────────────

export async function getMyChecklists(recruitId: string) {
  const checklists = await prisma.recruitChecklist.findMany({
    where: { recruitId },
    select: {
      id: true,
      createdAt: true,
      template: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
      items: {
        select: {
          id: true,
          isCompleted: true,
          completedAt: true,
          templateItem: {
            select: { id: true, label: true, sortOrder: true },
          },
        },
        orderBy: { templateItem: { sortOrder: "asc" } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return checklists.map((cl) => {
    const totalItems = cl.items.length;
    const completedItems = cl.items.filter((i) => i.isCompleted).length;
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      ...cl,
      totalItems,
      completedItems,
      progressPercent,
    };
  });
}

export async function toggleChecklistItem(recruitId: string, itemId: string) {
  const item = await prisma.recruitChecklistItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      isCompleted: true,
      recruitChecklist: {
        select: { recruitId: true },
      },
    },
  });

  if (!item) {
    throw new NotFoundError("Checklist item");
  }

  if (item.recruitChecklist.recruitId !== recruitId) {
    throw new ForbiddenError("You can only update your own checklist items");
  }

  const updated = await prisma.recruitChecklistItem.update({
    where: { id: itemId },
    data: {
      isCompleted: !item.isCompleted,
      completedAt: !item.isCompleted ? new Date() : null,
    },
    select: {
      id: true,
      isCompleted: true,
      completedAt: true,
      templateItem: {
        select: { id: true, label: true, sortOrder: true },
      },
    },
  });

  return updated;
}

// ── Dashboard Progress ──────────────────────────────────────────────

export async function getChecklistProgress(recruitId: string) {
  const checklists = await prisma.recruitChecklist.findMany({
    where: { recruitId },
    select: {
      id: true,
      template: { select: { title: true } },
      items: {
        select: { isCompleted: true },
      },
    },
  });

  let totalItems = 0;
  let completedItems = 0;
  const checklistSummary = checklists.map((cl) => {
    const total = cl.items.length;
    const completed = cl.items.filter((i) => i.isCompleted).length;
    totalItems += total;
    completedItems += completed;
    return {
      title: cl.template.title,
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  return {
    totalChecklists: checklists.length,
    totalItems,
    completedItems,
    overallPercent: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    checklists: checklistSummary,
  };
}
