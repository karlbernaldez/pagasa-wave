import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProtectedAdminRoute from './ProtectedAdminRoute';
import { checkAuthSession } from '@/api/auth';

const setIsLoggedIn = vi.fn();
const setRole = vi.fn();

vi.mock('@/api/auth', () => ({
  checkAuthSession: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ setIsLoggedIn, setRole }),
}));

vi.mock('@/components/ui/modals/OnlyAdminModal', () => ({
  default: () => <div>Access denied</div>,
}));

function renderGuard(permission = null) {
  return render(
    <MemoryRouter>
      <ProtectedAdminRoute requireAuth permission={permission}>
        <div>Protected admin content</div>
      </ProtectedAdminRoute>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProtectedAdminRoute permission authorization', () => {
  it('allows a custom reviewer with forecast.review', async () => {
    checkAuthSession.mockResolvedValue({
      authenticated: true,
      unavailable: false,
      user: {
        id: 'reviewer-1',
        role: 'reviewer',
        permissions: ['forecast.review'],
      },
    });

    renderGuard('forecast.review');

    expect(await screen.findByText('Protected admin content')).toBeInTheDocument();
    expect(screen.queryByText('Access denied')).not.toBeInTheDocument();
  });

  it('denies a custom reviewer without the required permission', async () => {
    checkAuthSession.mockResolvedValue({
      authenticated: true,
      unavailable: false,
      user: {
        id: 'reviewer-1',
        role: 'reviewer',
        permissions: ['forecast.review'],
      },
    });

    renderGuard('users.view');

    expect(await screen.findByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected admin content')).not.toBeInTheDocument();
  });

  it('allows Administrator only when the required permission is present', async () => {
    checkAuthSession.mockResolvedValue({
      authenticated: true,
      unavailable: false,
      user: {
        id: 'admin-1',
        role: 'admin',
        permissions: ['roles.view'],
      },
    });

    renderGuard('roles.view');

    expect(await screen.findByText('Protected admin content')).toBeInTheDocument();
  });

  it('does not grant an admin-named User Type a permission bypass', async () => {
    checkAuthSession.mockResolvedValue({
      authenticated: true,
      unavailable: false,
      user: {
        id: 'admin-like-1',
        role: 'admin',
        permissions: [],
      },
    });

    renderGuard('roles.view');

    expect(await screen.findByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected admin content')).not.toBeInTheDocument();
  });
});
