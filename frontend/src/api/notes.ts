import apiClient from "./client";
import type {
  Note,
  NoteCreateData,
  NoteUpdateData,
  PaginatedResponse,
} from "../types";

export interface NoteFilters {
  date_from?: string;
  date_to?: string;
  tags?: string;
  page?: number;
  per_page?: number;
}

export const notesApi = {
  list: (filters: NoteFilters = {}) =>
    apiClient.get<PaginatedResponse<Note>>("/notes", { params: filters }),

  get: (id: string) => apiClient.get<Note>(`/notes/${id}`),

  create: (data: NoteCreateData) =>
    apiClient.post<Note>("/notes", data),

  update: (id: string, data: NoteUpdateData) =>
    apiClient.put<Note>(`/notes/${id}`, data),

  delete: (id: string) => apiClient.delete(`/notes/${id}`),
};
