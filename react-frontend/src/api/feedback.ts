import apiClient from './client'
import type { FeedbackDto, CreateFeedbackRequest, UpdateFeedbackRequest } from '../types/feedback'
import type { PagedResult } from '../types/task'

export const feedbackApi = {
  create: async (data: CreateFeedbackRequest): Promise<FeedbackDto> => {
    const response = await apiClient.post<FeedbackDto>('/feedback', data)
    return response.data
  },
  list: async (params?: Record<string, string | number>): Promise<PagedResult<FeedbackDto>> => {
    const response = await apiClient.get<PagedResult<FeedbackDto>>('/feedback', { params })
    return response.data
  },
  getById: async (id: string): Promise<FeedbackDto> => {
    const response = await apiClient.get<FeedbackDto>(`/feedback/${id}`)
    return response.data
  },
  update: async (id: string, data: UpdateFeedbackRequest): Promise<FeedbackDto> => {
    const response = await apiClient.put<FeedbackDto>(`/feedback/${id}`, data)
    return response.data
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/feedback/${id}`)
  },
}
