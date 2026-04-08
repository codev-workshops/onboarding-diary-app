import apiClient from "./client";
import type {
  Feedback,
  FeedbackCreate,
  FeedbackUpdate,
  PaginatedFeedbackResponse,
} from "../types/feedback";

interface FeedbackListParams {
  date_from?: string;
  date_to?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export const feedbackApi = {
  create: async (data: FeedbackCreate): Promise<Feedback> => {
    const response = await apiClient.post<Feedback>("/feedback/", data);
    return response.data;
  },

  list: async (params?: FeedbackListParams): Promise<PaginatedFeedbackResponse> => {
    const response = await apiClient.get<PaginatedFeedbackResponse>("/feedback/", { params });
    return response.data;
  },

  get: async (id: string): Promise<Feedback> => {
    const response = await apiClient.get<Feedback>(`/feedback/${id}`);
    return response.data;
  },

  update: async (id: string, data: FeedbackUpdate): Promise<Feedback> => {
    const response = await apiClient.put<Feedback>(`/feedback/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/feedback/${id}`);
  },
};
