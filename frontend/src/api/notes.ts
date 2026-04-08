import apiClient from './client';
import type { Note, NoteCreate, NoteUpdate, PaginatedNoteResponse } from '../types/note';

interface NoteListParams {
  date_from?: string;
  date_to?: string;
  tags?: string;
  page?: number;
  per_page?: number;
}

export const noteApi = {
  create: async (data: NoteCreate): Promise<Note> => {
    const response = await apiClient.post<Note>('/api/v1/notes/', data);
    return response.data;
  },

  list: async (params?: NoteListParams): Promise<PaginatedNoteResponse> => {
    const response = await apiClient.get<PaginatedNoteResponse>('/api/v1/notes/', { params });
    return response.data;
  },

  get: async (id: string): Promise<Note> => {
    const response = await apiClient.get<Note>(`/api/v1/notes/${id}`);
    return response.data;
  },

  update: async (id: string, data: NoteUpdate): Promise<Note> => {
    const response = await apiClient.put<Note>(`/api/v1/notes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/notes/${id}`);
  },
};
