import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProtectedRoute from './ProtectedRoute';
import { checkAuthSession } from '@/api/auth';

const setIsLoggedIn = vi.fn();
const setRole = vi.fn();

vi.mock('@/api/auth', () => ({
  checkAuthSession: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isLoggedIn: false,
    role: null,
    setIsLoggedIn,
    setRole,
  }),
}));

vi.mock('@/components/ui/modals/OnlyUserModal', () => ({
  default: () => <div>Only user modal</div>,
}));

vi.mock('@/components/ui/LoadingScreen', () => ({
  default: () => <div>Loading session</div>,
}));

function renderProtectedRoute({ element, initialEntry = '/secure' } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/secure"
          element={
            element || (
              <ProtectedRoute requireAuth>
                <div>Protected content</div>
              </ProtectedRoute>
            )
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/forecasts" element={<div>Forecast workspace</div>} />
        <Route path="/forecasts/review" element={<div>Forecast review queue</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProtectedRoute session verification', () => {
  it('does not redirect to login when authentication cannot be verified temporarily', async () => {
    checkAuthSession.mockResolvedValue({ authenticated: false, user: null, unavailable: true });

    renderProtectedRoute();

    expect(await screen.findByText('Unable to verify your session')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
    expect(setIsLoggedIn).not.toHaveBeenCalledWith(false);
    expect(setRole).not.toHaveBeenCalledWith(null);
  });

  it('retries session verification without forcing a logout', async () => {
    checkAuthSession
      .mockResolvedValueOnce({ authenticated: false, user: null, unavailable: true })
      .mockResolvedValueOnce({
        authenticated: true,
        unavailable: false,
        user: { id: 'user-1', role: 'forecaster' },
      });

    renderProtectedRoute();

    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    await waitFor(() => expect(checkAuthSession).toHaveBeenCalledTimes(2));
    expect(checkAuthSession).toHaveBeenLastCalledWith({ force: true });
    expect(setIsLoggedIn).toHaveBeenCalledWith(true);
    expect(setRole).toHaveBeenCalledWith('forecaster');
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('redirects only when the session is definitively unauthenticated', async () => {
    checkAuthSession.mockResolvedValue({ authenticated: false, user: null, unavailable: false });

    renderProtectedRoute();

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(setIsLoggedIn).toHaveBeenCalledWith(false);
    expect(setRole).toHaveBeenCalledWith(null);
  });

  it('uses effective permissions for denied authenticated redirects regardless of User Type', async () => {
    checkAuthSession.mockResolvedValue({
      authenticated: true,
      unavailable: false,
      user: {
        id: 'reviewer-1',
        role: 'duty_reviewer',
        permissions: ['forecast.review'],
      },
    });

    renderProtectedRoute({
      element: (
        <ProtectedRoute requireAuth permission="forecast.approve">
          <div>Approval workspace</div>
        </ProtectedRoute>
      ),
    });

    expect(await screen.findByText('Forecast review queue')).toBeInTheDocument();
    expect(screen.queryByText('Approval workspace')).not.toBeInTheDocument();
  });

  it('redirects authenticated public-route visitors using canonical permission landing', async () => {
    checkAuthSession.mockResolvedValue({
      authenticated: true,
      unavailable: false,
      user: {
        id: 'forecast-user-1',
        role: 'custom_forecast_operator',
        permissions: ['forecast.view'],
      },
    });

    renderProtectedRoute({
      element: (
        <ProtectedRoute requireAuth={false}>
          <div>Public-only page</div>
        </ProtectedRoute>
      ),
    });

    expect(await screen.findByText('Forecast workspace')).toBeInTheDocument();
    expect(screen.queryByText('Public-only page')).not.toBeInTheDocument();
  });
});
