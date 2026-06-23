import apiClient from './client'
import type { IssueDto, CreateIssueRequest, UpdateIssueRequest } from '../types/issue'
import type { PagedResult } from '../types/task'

export const issueApi = {
  create: async (data: CreateIssueRequest): Promise<IssueDto> => {
    const response = await apiClient.post<IssueDto>('/issues', data)
    return response.data
  },
  list: async (params?: Record<string, string | number>): Promise<PagedResult<IssueDto>> => {
    const response = await apiClient.get<PagedResult<IssueDto>>('/issues', { params })
    return response.data
  },
  getById: async (id: string): Promise<IssueDto> => {
    const response = await apiClient.get<IssueDto>(`/issues/${id}`)
    return response.data
  },
  update: async (id: string, data: UpdateIssueRequest): Promise<IssueDto> => {
    const response = await apiClient.put<IssueDto>(`/issues/${id}`, data)
    return response.data
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/issues/${id}`)
  },
}
