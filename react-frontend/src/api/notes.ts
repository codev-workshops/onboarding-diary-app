import apiClient from './client'
import type { NoteDto, CreateNoteRequest, UpdateNoteRequest } from '../types/note'
import type { PagedResult } from '../types/task'

export const noteApi = {
  create: async (data: CreateNoteRequest): Promise<NoteDto> => {
    const response = await apiClient.post<NoteDto>('/notes', data)
    return response.data
  },
  list: async (params?: Record<string, string | number>): Promise<PagedResult<NoteDto>> => {
    const response = await apiClient.get<PagedResult<NoteDto>>('/notes', { params })
    return response.data
  },
  getById: async (id: string): Promise<NoteDto> => {
    const response = await apiClient.get<NoteDto>(`/notes/${id}`)
    return response.data
  },
  update: async (id: string, data: UpdateNoteRequest): Promise<NoteDto> => {
    const response = await apiClient.put<NoteDto>(`/notes/${id}`, data)
    return response.data
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`)
  },
}
