import apiClient from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, UserDto, UpdateProfileRequest } from '../types/auth'

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  getMe: async (): Promise<UserDto> => {
    const response = await apiClient.get<UserDto>('/auth/me')
    return response.data
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserDto> => {
    const response = await apiClient.put<UserDto>('/users/me', data)
    return response.data
  },
}
