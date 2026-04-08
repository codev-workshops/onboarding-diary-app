import api from "./api";
import type { AuthResponse, User } from "../types";

export async function register(data: {
  email: string;
  password: string;
  fullName: string;
  department?: string;
  startDate?: string;
}): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", data);
  return response.data;
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", data);
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function getProfile(): Promise<User> {
  const response = await api.get<User>("/auth/profile");
  return response.data;
}

export async function updateProfile(data: {
  fullName?: string;
  department?: string;
  startDate?: string;
}): Promise<User> {
  const response = await api.put<User>("/auth/profile", data);
  return response.data;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.put("/auth/profile/password", data);
}
