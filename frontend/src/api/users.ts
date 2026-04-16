import apiClient from "./client";
import type { User, AdminUserCreateData, AdminUserUpdateData, PaginatedResponse } from "../types";

export interface UserFilters {
  role?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export const usersApi = {
  list: (filters: UserFilters = {}) =>
    apiClient.get<PaginatedResponse<User>>("/users", { params: filters }),

  get: (id: string) => apiClient.get<User>(`/users/${id}`),

  create: (data: AdminUserCreateData) =>
    apiClient.post<User>("/users", data),

  update: (id: string, data: AdminUserUpdateData) =>
    apiClient.put<User>(`/users/${id}`, data),
};
