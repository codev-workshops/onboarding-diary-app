import apiClient from "./client";
import type { Issue, IssueCreate, IssueUpdate, PaginatedIssueResponse } from "../types/issue";

interface IssueListParams {
  date_from?: string;
  date_to?: string;
  status?: string;
  severity?: string;
  page?: number;
  per_page?: number;
}

export const issueApi = {
  create: async (data: IssueCreate): Promise<Issue> => {
    const response = await apiClient.post<Issue>("/issues/", data);
    return response.data;
  },

  list: async (params?: IssueListParams): Promise<PaginatedIssueResponse> => {
    const response = await apiClient.get<PaginatedIssueResponse>("/issues/", { params });
    return response.data;
  },

  get: async (id: string): Promise<Issue> => {
    const response = await apiClient.get<Issue>(`/issues/${id}`);
    return response.data;
  },

  update: async (id: string, data: IssueUpdate): Promise<Issue> => {
    const response = await apiClient.put<Issue>(`/issues/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/issues/${id}`);
  },
};
