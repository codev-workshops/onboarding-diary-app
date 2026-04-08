import apiClient from "./client";
import type { LoginRequest, RegisterRequest, TokenResponse, User } from "../types/auth";

export const authApi = {
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await apiClient.post<User>("/auth/register", data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>("/auth/login", data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  updateMe: async (
    data: Partial<Pick<User, "full_name" | "department" | "start_date">>,
  ): Promise<User> => {
    const response = await apiClient.put<User>("/auth/me", data);
    return response.data;
  },
};
