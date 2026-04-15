export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "recruit" | "manager" | "admin";
  department: string | null;
  start_date: string | null;
  is_active: boolean;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  per_page: number;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  department?: string;
  start_date?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserUpdateData {
  full_name?: string;
  department?: string | null;
  start_date?: string | null;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export interface AdminUserUpdateData {
  role?: string;
  is_active?: boolean;
  manager_id?: string | null;
}
