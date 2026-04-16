import client from "./client";
import type { ChecklistData, ChecklistCreateData, PaginatedResponse, User } from "../types";

export const checklistsApi = {
  list: (page: number = 1, perPage: number = 20) =>
    client.get<PaginatedResponse<ChecklistData>>("/checklists", { params: { page, per_page: perPage } }),

  listRecruits: () =>
    client.get<PaginatedResponse<User>>("/checklists/recruits"),

  get: (id: string) =>
    client.get<ChecklistData>(`/checklists/${id}`),

  create: (data: ChecklistCreateData) =>
    client.post<ChecklistData>("/checklists", data),

  update: (id: string, data: { title?: string; description?: string }) =>
    client.put<ChecklistData>(`/checklists/${id}`, data),

  delete: (id: string) =>
    client.delete(`/checklists/${id}`),

  addItem: (checklistId: string, data: { title: string; description?: string; order: number }) =>
    client.post(`/checklists/${checklistId}/items`, data),

  deleteItem: (checklistId: string, itemId: string) =>
    client.delete(`/checklists/${checklistId}/items/${itemId}`),

  assign: (checklistId: string, userId: string) =>
    client.post(`/checklists/${checklistId}/assign`, { user_id: userId }),

  unassign: (checklistId: string, userId: string) =>
    client.delete(`/checklists/${checklistId}/assign/${userId}`),

  completeItem: (itemId: string) =>
    client.put(`/checklists/items/${itemId}/complete`),

  uncompleteItem: (itemId: string) =>
    client.delete(`/checklists/items/${itemId}/complete`),

  getProgress: (checklistId: string, userId?: string) =>
    client.get(`/checklists/${checklistId}/progress`, { params: userId ? { user_id: userId } : {} }),
};
