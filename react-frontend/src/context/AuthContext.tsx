import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { UserDto } from '../types/auth'
import { authApi } from '../api/auth'

interface AuthContextType {
  user: UserDto | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: UserDto) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('token'))

  const login = useCallback((newToken: string, newUser: UserDto) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (token && !user) {
      authApi
        .getMe()
        .then(setUser)
        .catch(() => logout())
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token, user, logout])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
