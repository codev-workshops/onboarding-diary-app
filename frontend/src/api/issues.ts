import apiClient from "./client";
import type {
  Issue,
  IssueCreateData,
  IssueUpdateData,
  PaginatedResponse,
} from "../types";

export interface IssueFilters {
  date_from?: string;
  date_to?: string;
  severity?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export const issuesApi = {
  list: (filters: IssueFilters = {}) =>
    apiClient.get<PaginatedResponse<Issue>>("/issues", { params: filters }),

  get: (id: string) => apiClient.get<Issue>(`/issues/${id}`),

  create: (data: IssueCreateData) =>
    apiClient.post<Issue>("/issues", data),

  update: (id: string, data: IssueUpdateData) =>
    apiClient.put<Issue>(`/issues/${id}`, data),

  delete: (id: string) => apiClient.delete(`/issues/${id}`),
};
