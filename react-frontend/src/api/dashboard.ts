import apiClient from './client'
import type { DashboardDto } from '../types/dashboard'

export const dashboardApi = {
  get: async (): Promise<DashboardDto> => {
    const response = await apiClient.get<DashboardDto>('/dashboard')
    return response.data
  },
}
