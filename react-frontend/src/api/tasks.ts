import apiClient from './client'
import type { TaskDto, CreateTaskRequest, UpdateTaskRequest, PagedResult } from '../types/task'

export const taskApi = {
  create: async (data: CreateTaskRequest): Promise<TaskDto> => {
    const response = await apiClient.post<TaskDto>('/tasks', data)
    return response.data
  },
  list: async (params?: Record<string, string | number>): Promise<PagedResult<TaskDto>> => {
    const response = await apiClient.get<PagedResult<TaskDto>>('/tasks', { params })
    return response.data
  },
  getById: async (id: string): Promise<TaskDto> => {
    const response = await apiClient.get<TaskDto>(`/tasks/${id}`)
    return response.data
  },
  update: async (id: string, data: UpdateTaskRequest): Promise<TaskDto> => {
    const response = await apiClient.put<TaskDto>(`/tasks/${id}`, data)
    return response.data
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`)
  },
}
