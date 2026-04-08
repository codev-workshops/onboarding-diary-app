import api from "./api";
import type { Issue, CreateIssueInput, UpdateIssueInput, PaginatedResponse } from "../types";

export async function listIssues(params?: Record<string, string>): Promise<PaginatedResponse<Issue>> {
  const { data } = await api.get<PaginatedResponse<Issue>>("/issues", { params });
  return data;
}

export async function getIssue(id: string): Promise<Issue> {
  const { data } = await api.get<Issue>(`/issues/${id}`);
  return data;
}

export async function createIssue(input: CreateIssueInput): Promise<Issue> {
  const { data } = await api.post<Issue>("/issues", input);
  return data;
}

export async function updateIssue(id: string, input: UpdateIssueInput): Promise<Issue> {
  const { data } = await api.patch<Issue>(`/issues/${id}`, input);
  return data;
}

export async function deleteIssue(id: string): Promise<void> {
  await api.delete(`/issues/${id}`);
}
