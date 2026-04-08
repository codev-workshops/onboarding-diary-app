export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "recruit" | "manager" | "admin";
  department: string | null;
  start_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  department?: string;
  start_date?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}
