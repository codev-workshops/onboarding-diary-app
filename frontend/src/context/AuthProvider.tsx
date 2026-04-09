import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { authApi } from "../api/auth";
import type { User, LoginRequest, RegisterRequest } from "../types/auth";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem("access_token"));
  const didInit = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch {
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize user on mount if token exists (runs once, safe in StrictMode)
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const token = localStorage.getItem("access_token");
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);
    localStorage.setItem("access_token", response.access_token);
    localStorage.setItem("user", JSON.stringify(response.user));
    setUser(response.user);
  };

  const register = async (data: RegisterRequest) => {
    await authApi.register(data);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
