import apiClient from "./client";
import type {
  ChangePasswordData,
  LoginData,
  RegisterData,
  TokenResponse,
  User,
  UserUpdateData,
} from "../types";

export const authApi = {
  register: (data: RegisterData) =>
    apiClient.post<User>("/auth/register", data),

  login: (data: LoginData) =>
    apiClient.post<TokenResponse>("/auth/login", data),

  logout: () => apiClient.post("/auth/logout"),

  changePassword: (data: ChangePasswordData) =>
    apiClient.post("/auth/change-password", data),
};

export const userApi = {
  getProfile: () => apiClient.get<User>("/users/me"),

  updateProfile: (data: UserUpdateData) =>
    apiClient.put<User>("/users/me", data),
};
