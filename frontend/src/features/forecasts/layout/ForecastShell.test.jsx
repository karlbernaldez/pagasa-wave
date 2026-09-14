import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ForecastShell from './ForecastShell';

const currentUser = vi.hoisted(() => ({
  raw: null,
  normalized: null,
}));

vi.mock('@/app/providers/ThemeProvider', () => ({
  useTheme: () => ({ isDarkMode: false, setIsDarkMode: vi.fn() }),
}));

vi.mock('@/shared/hooks/useCurrentDashboardUser', () => ({
  default: () => ({
    rawUser: currentUser.raw,
    user: currentUser.normalized,
  }),
}));

vi.mock('@/shared/dashboard-shell/DashboardShell', () => ({
  default: ({ sidebar, header, children }) => (
    <div>
      <div data-testid="user-role">{header.user?.role}</div>
      <nav>
        {sidebar.items.map((item) => (
          <span key={item.id}>{item.label}</span>
        ))}
      </nav>
      {children}
    </div>
  ),
}));

function renderShell(path = '/forecasts') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ForecastShell>
        <div>Forecast content</div>
      </ForecastShell>
    </MemoryRouter>
  );
}

beforeEach(() => {
  currentUser.raw = null;
  currentUser.normalized = null;
});

describe('ForecastShell permission-driven navigation', () => {
  it('shows the same review navigation for an arbitrary reviewer User Type', () => {
    currentUser.raw = {
      role: 'duty_reviewer',
      permissions: ['forecast.view', 'forecast.review'],
    };
    currentUser.normalized = {
      role: 'duty reviewer',
      name: 'Duty Reviewer',
    };

    renderShell('/forecasts/review');

    expect(screen.getByText('Forecast Packages')).toBeInTheDocument();
    expect(screen.getByText('Review Queue')).toBeInTheDocument();
    expect(screen.getByTestId('user-role')).toHaveTextContent('duty reviewer');
    expect(screen.getByTestId('user-role')).not.toHaveTextContent('Forecaster');
  });

  it('hides review navigation without forecast.review even for a forecaster-named User Type', () => {
    currentUser.raw = {
      role: 'forecaster',
      permissions: ['forecast.view'],
    };
    currentUser.normalized = {
      role: 'Forecaster',
      name: 'Forecast User',
    };

    renderShell();

    expect(screen.getByText('Forecast Packages')).toBeInTheDocument();
    expect(screen.queryByText('Review Queue')).not.toBeInTheDocument();
  });

  it('does not grant Forecast navigation from User Type name alone', () => {
    currentUser.raw = {
      role: 'admin',
      permissions: [],
    };
    currentUser.normalized = {
      role: 'Administrator',
      name: 'Admin User',
    };

    renderShell();

    expect(screen.queryByText('Forecast Packages')).not.toBeInTheDocument();
    expect(screen.queryByText('Review Queue')).not.toBeInTheDocument();
  });
});
