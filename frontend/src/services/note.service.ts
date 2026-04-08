import api from "./api";
import type { Note, CreateNoteInput, UpdateNoteInput, PaginatedResponse } from "../types";

export async function listNotes(params?: Record<string, string>): Promise<PaginatedResponse<Note>> {
  const { data } = await api.get<PaginatedResponse<Note>>("/notes", { params });
  return data;
}

export async function getNote(id: string): Promise<Note> {
  const { data } = await api.get<Note>(`/notes/${id}`);
  return data;
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const { data } = await api.post<Note>("/notes", input);
  return data;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  const { data } = await api.patch<Note>(`/notes/${id}`, input);
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/notes/${id}`);
}
