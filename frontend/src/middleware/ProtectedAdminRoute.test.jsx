import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

function renderGuard(permission = null) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedAdminRoute requireAuth permission={permission}>
              <div>Protected admin content</div>
            </ProtectedAdminRoute>
          }
        />
        <Route path="/forecasts/review" element={<div>Review workspace</div>} />
        <Route path="/" element={<div>Permission denied landing</div>} />
      </Routes>
    </MemoryRouter>
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
    expect(screen.queryByText('Review workspace')).not.toBeInTheDocument();
  });

  it('redirects a custom reviewer without the required permission to an allowed workspace', async () => {
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

    expect(await screen.findByText('Review workspace')).toBeInTheDocument();
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

    expect(await screen.findByText('Permission denied landing')).toBeInTheDocument();
    expect(screen.queryByText('Protected admin content')).not.toBeInTheDocument();
  });
});
