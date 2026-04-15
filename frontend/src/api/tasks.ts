import apiClient from "./client";
import type {
  Task,
  TaskCreateData,
  TaskUpdateData,
  PaginatedResponse,
} from "../types";

export interface TaskFilters {
  date_from?: string;
  date_to?: string;
  category?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export const tasksApi = {
  list: (filters: TaskFilters = {}) =>
    apiClient.get<PaginatedResponse<Task>>("/tasks", { params: filters }),

  get: (id: string) => apiClient.get<Task>(`/tasks/${id}`),

  create: (data: TaskCreateData) =>
    apiClient.post<Task>("/tasks", data),

  update: (id: string, data: TaskUpdateData) =>
    apiClient.put<Task>(`/tasks/${id}`, data),

  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
};
