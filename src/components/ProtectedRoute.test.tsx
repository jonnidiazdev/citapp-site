import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockedUseAuthStore = vi.mocked(useAuthStore);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login when not authenticated', () => {
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({ user: null, isAuthenticated: false, login: vi.fn(), logout: vi.fn(), register: vi.fn(), setUser: vi.fn() })
    );

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <ProtectedRoute requiredRole="admin">
          <div>Dashboard</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders children for authenticated admin', () => {
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({
        user: { id: '1', email: 'a@test.com', name: 'Admin', role: 'admin', createdAt: '' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        setUser: vi.fn(),
      })
    );

    render(
      <MemoryRouter>
        <ProtectedRoute requiredRole="admin">
          <div>Dashboard</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('redirects when role does not match', () => {
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({
        user: { id: '1', email: 'c@test.com', name: 'Client', role: 'client', createdAt: '' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        setUser: vi.fn(),
      })
    );

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <ProtectedRoute requiredRole="admin">
          <div>Dashboard</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});
