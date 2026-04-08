import apiClient from "./client";
import type { Task, TaskCreate, TaskUpdate, PaginatedTaskResponse } from "../types/task";

interface TaskListParams {
  date_from?: string;
  date_to?: string;
  category?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export const taskApi = {
  create: async (data: TaskCreate): Promise<Task> => {
    const response = await apiClient.post<Task>("/tasks/", data);
    return response.data;
  },

  list: async (params?: TaskListParams): Promise<PaginatedTaskResponse> => {
    const response = await apiClient.get<PaginatedTaskResponse>("/tasks/", { params });
    return response.data;
  },

  get: async (id: string): Promise<Task> => {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  update: async (id: string, data: TaskUpdate): Promise<Task> => {
    const response = await apiClient.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};
