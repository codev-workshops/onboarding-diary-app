import api from "./api";
import type { Feedback, CreateFeedbackInput, UpdateFeedbackInput, PaginatedResponse } from "../types";

export async function listFeedback(params?: Record<string, string>): Promise<PaginatedResponse<Feedback>> {
  const { data } = await api.get<PaginatedResponse<Feedback>>("/feedback", { params });
  return data;
}

export async function getFeedback(id: string): Promise<Feedback> {
  const { data } = await api.get<Feedback>(`/feedback/${id}`);
  return data;
}

export async function createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
  const { data } = await api.post<Feedback>("/feedback", input);
  return data;
}

export async function updateFeedback(id: string, input: UpdateFeedbackInput): Promise<Feedback> {
  const { data } = await api.patch<Feedback>(`/feedback/${id}`, input);
  return data;
}

export async function deleteFeedback(id: string): Promise<void> {
  await api.delete(`/feedback/${id}`);
}
