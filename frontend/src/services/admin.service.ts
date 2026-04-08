import api from "./api";
import type { AdminUser, AdminDashboardData, CreateUserInput, UpdateUserInput, PaginatedResponse, ManagerOption } from "../types";

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const { data } = await api.get<AdminDashboardData>("/admin/dashboard");
  return data;
}

export async function listUsers(params?: Record<string, string>): Promise<PaginatedResponse<AdminUser>> {
  const { data } = await api.get<PaginatedResponse<AdminUser>>("/admin/users", { params });
  return data;
}

export async function getUserById(id: string): Promise<AdminUser> {
  const { data } = await api.get<AdminUser>(`/admin/users/${id}`);
  return data;
}

export async function createUser(input: CreateUserInput): Promise<AdminUser> {
  const { data } = await api.post<AdminUser>("/admin/users", input);
  return data;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(`/admin/users/${id}`, input);
  return data;
}

export async function toggleUserStatus(id: string): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(`/admin/users/${id}/status`);
  return data;
}

export async function assignManager(recruitId: string, managerId: string | null): Promise<AdminUser> {
  const { data } = await api.patch<AdminUser>(`/admin/users/${recruitId}/assign-manager`, { managerId });
  return data;
}

export async function getManagers(): Promise<ManagerOption[]> {
  const { data } = await api.get<ManagerOption[]>("/admin/managers");
  return data;
}
