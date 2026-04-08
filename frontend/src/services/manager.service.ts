import api from "./api";
import type { ManagerDashboardData, PaginatedResponse, Task, Issue, Feedback, Note, RecruitListItem } from "../types";

export async function getManagerDashboard(): Promise<ManagerDashboardData> {
  const { data } = await api.get<ManagerDashboardData>("/manager/dashboard");
  return data;
}

export async function getRecruitList(): Promise<RecruitListItem[]> {
  const { data } = await api.get<RecruitListItem[]>("/manager/recruits");
  return data;
}

export async function getRecruitTasks(recruitId: string, params?: Record<string, string>): Promise<PaginatedResponse<Task>> {
  const { data } = await api.get<PaginatedResponse<Task>>(`/manager/recruits/${recruitId}/tasks`, { params });
  return data;
}

export async function getRecruitIssues(recruitId: string, params?: Record<string, string>): Promise<PaginatedResponse<Issue>> {
  const { data } = await api.get<PaginatedResponse<Issue>>(`/manager/recruits/${recruitId}/issues`, { params });
  return data;
}

export async function getRecruitFeedback(recruitId: string, params?: Record<string, string>): Promise<PaginatedResponse<Feedback>> {
  const { data } = await api.get<PaginatedResponse<Feedback>>(`/manager/recruits/${recruitId}/feedback`, { params });
  return data;
}

export async function getRecruitNotes(recruitId: string, params?: Record<string, string>): Promise<PaginatedResponse<Note>> {
  const { data } = await api.get<PaginatedResponse<Note>>(`/manager/recruits/${recruitId}/notes`, { params });
  return data;
}
