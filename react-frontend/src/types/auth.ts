export interface UserDto {
  id: string
  email: string
  fullName: string
  role: 'Recruit' | 'Manager' | 'Admin'
  department?: string
  startDate?: string
  managerId?: string
  isActive: boolean
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: UserDto
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  department?: string
  startDate?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateProfileRequest {
  fullName: string
  department?: string
  startDate?: string
}
