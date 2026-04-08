import apiClient from './client';
import type { Feedback, FeedbackCreate, FeedbackUpdate, PaginatedFeedbackResponse } from '../types/feedback';

interface FeedbackListParams {
  date_from?: string;
  date_to?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export const feedbackApi = {
  create: async (data: FeedbackCreate): Promise<Feedback> => {
    const response = await apiClient.post<Feedback>('/api/v1/feedback/', data);
    return response.data;
  },

  list: async (params?: FeedbackListParams): Promise<PaginatedFeedbackResponse> => {
    const response = await apiClient.get<PaginatedFeedbackResponse>('/api/v1/feedback/', { params });
    return response.data;
  },

  get: async (id: string): Promise<Feedback> => {
    const response = await apiClient.get<Feedback>(`/api/v1/feedback/${id}`);
    return response.data;
  },

  update: async (id: string, data: FeedbackUpdate): Promise<Feedback> => {
    const response = await apiClient.put<Feedback>(`/api/v1/feedback/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/feedback/${id}`);
  },
};
