import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextDef';
import type { AuthContextType } from '../context/AuthContextDef';
import ProtectedRoute from '../components/ProtectedRoute';

const mockUser = {
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'recruit' as const,
  department: 'Engineering',
  start_date: '2024-01-15',
  is_active: true,
  manager_id: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

function renderWithAuth(
  ui: React.ReactElement,
  authValue: Partial<AuthContextType> = {}
) {
  const defaultAuth: AuthContextType = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    ...authValue,
  };

  return render(
    <AuthContext.Provider value={defaultAuth}>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  it('shows loading spinner when auth is loading', () => {
    renderWithAuth(
      <ProtectedRoute><div>Protected</div></ProtectedRoute>,
      { isLoading: true }
    );
    // Spin component renders, child does not
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    renderWithAuth(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
      { isAuthenticated: true, user: mockUser }
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    renderWithAuth(
      <ProtectedRoute><div>Protected</div></ProtectedRoute>,
      { isAuthenticated: false }
    );
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('redirects when user role does not match required roles', () => {
    renderWithAuth(
      <ProtectedRoute roles={['admin']}><div>Admin Only</div></ProtectedRoute>,
      { isAuthenticated: true, user: mockUser } // mockUser is 'recruit'
    );
    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
  });

  it('renders children when user role matches required roles', () => {
    const adminUser = { ...mockUser, role: 'admin' as const };
    renderWithAuth(
      <ProtectedRoute roles={['admin']}><div>Admin Content</div></ProtectedRoute>,
      { isAuthenticated: true, user: adminUser }
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
