import api from "./api";
import type { Task, CreateTaskInput, UpdateTaskInput, PaginatedResponse } from "../types";

export async function listTasks(params?: Record<string, string>): Promise<PaginatedResponse<Task>> {
  const { data } = await api.get<PaginatedResponse<Task>>("/tasks", { params });
  return data;
}

export async function getTask(id: string): Promise<Task> {
  const { data } = await api.get<Task>(`/tasks/${id}`);
  return data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await api.post<Task>("/tasks", input);
  return data;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, input);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
