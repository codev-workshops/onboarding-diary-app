import apiClient from "./client";
import type {
  Feedback,
  FeedbackCreateData,
  FeedbackUpdateData,
  PaginatedResponse,
} from "../types";

export interface FeedbackFilters {
  date_from?: string;
  date_to?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export const feedbackApi = {
  list: (filters: FeedbackFilters = {}) =>
    apiClient.get<PaginatedResponse<Feedback>>("/feedback", { params: filters }),

  get: (id: string) => apiClient.get<Feedback>(`/feedback/${id}`),

  create: (data: FeedbackCreateData) =>
    apiClient.post<Feedback>("/feedback", data),

  update: (id: string, data: FeedbackUpdateData) =>
    apiClient.put<Feedback>(`/feedback/${id}`, data),

  delete: (id: string) => apiClient.delete(`/feedback/${id}`),
};
