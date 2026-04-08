import api from "./api";
import type { ChecklistTemplate, RecruitChecklist, ChecklistProgress, PaginatedResponse, RecruitChecklistItem } from "../types";

// ── Manager/Admin: Template CRUD ────────────────────────────────────

export async function listTemplates(params?: Record<string, string>): Promise<PaginatedResponse<ChecklistTemplate>> {
  const { data } = await api.get<PaginatedResponse<ChecklistTemplate>>("/checklists/templates", { params });
  return data;
}

export async function getTemplate(id: string): Promise<ChecklistTemplate> {
  const { data } = await api.get<ChecklistTemplate>(`/checklists/templates/${id}`);
  return data;
}

export async function createTemplate(input: { title: string; description?: string; items: string[] }): Promise<ChecklistTemplate> {
  const { data } = await api.post<ChecklistTemplate>("/checklists/templates", input);
  return data;
}

export async function updateTemplate(id: string, input: { title?: string; description?: string; items?: string[] }): Promise<ChecklistTemplate> {
  const { data } = await api.patch<ChecklistTemplate>(`/checklists/templates/${id}`, input);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/checklists/templates/${id}`);
}

export async function assignTemplate(templateId: string, recruitId: string): Promise<void> {
  await api.post(`/checklists/templates/${templateId}/assign`, { recruitId });
}

// ── Recruit: Checklist Operations ───────────────────────────────────

export async function getMyChecklists(): Promise<RecruitChecklist[]> {
  const { data } = await api.get<RecruitChecklist[]>("/checklists/my");
  return data;
}

export async function toggleItem(itemId: string): Promise<RecruitChecklistItem> {
  const { data } = await api.patch<RecruitChecklistItem>(`/checklists/items/${itemId}/toggle`);
  return data;
}

export async function getChecklistProgress(): Promise<ChecklistProgress> {
  const { data } = await api.get<ChecklistProgress>("/checklists/progress");
  return data;
}
