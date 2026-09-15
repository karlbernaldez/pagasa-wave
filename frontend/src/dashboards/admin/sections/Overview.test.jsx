import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardOverview from './Overview';

const currentUser = vi.hoisted(() => ({ raw: null, normalized: null }));
const analyticsApi = vi.hoisted(() => ({
  forecast: vi.fn(),
  users: vi.fn(),
  system: vi.fn(),
}));
const wavePipelineApi = vi.hoisted(() => ({ status: vi.fn() }));

vi.mock('@/shared/hooks/useCurrentDashboardUser', () => ({
  default: () => ({
    rawUser: currentUser.raw,
    user: currentUser.normalized,
  }),
}));

vi.mock('@/api/analyticsAPI', () => ({
  fetchForecastAnalytics: analyticsApi.forecast,
  fetchUserAnalytics: analyticsApi.users,
  fetchSystemAnalytics: analyticsApi.system,
}));

vi.mock('@/api/wavePipelineStatus', () => ({
  fetchWavePipelineStatus: wavePipelineApi.status,
}));

const forecastPayload = {
  total: 2,
  sampleSize: 2,
  packages: [],
  statusCounts: { Submitted: 1, Published: 1 },
};
const userPayload = { total: 2, statusCounts: { active: 2 }, roleCounts: {} };
const systemPayload = {
  users: { total: 2, active: 2, statusCounts: { active: 2 } },
  forecastPackages: { total: 2, statusCounts: { Published: 2 } },
};
const pipelinePayload = { models: [{ model: 'WW3', state: 'READY' }] };

beforeEach(() => {
  currentUser.raw = null;
  currentUser.normalized = { name: 'WaveLab User', role: 'Operator' };
  analyticsApi.forecast.mockReset().mockResolvedValue(forecastPayload);
  analyticsApi.users.mockReset().mockResolvedValue(userPayload);
  analyticsApi.system.mockReset().mockResolvedValue(systemPayload);
  wavePipelineApi.status.mockReset().mockResolvedValue(pipelinePayload);
});

describe('DashboardOverview permission-aware data loading', () => {
  it('does not request protected summary APIs for dashboard-only access', async () => {
    currentUser.raw = { permissions: ['dashboard.view'] };

    render(<DashboardOverview isDarkMode={false} onSelectTab={vi.fn()} />);

    await waitFor(() =>
      expect(screen.queryByText('Preparing your operational dashboard…')).not.toBeInTheDocument()
    );
    expect(analyticsApi.forecast).not.toHaveBeenCalled();
    expect(analyticsApi.users).not.toHaveBeenCalled();
    expect(analyticsApi.system).not.toHaveBeenCalled();
    expect(wavePipelineApi.status).not.toHaveBeenCalled();
  });

  it('requests only the forecast analytics summary when that is the only summary permission', async () => {
    currentUser.raw = { permissions: ['dashboard.view', 'analytics_forecast.view'] };

    render(<DashboardOverview isDarkMode={false} onSelectTab={vi.fn()} />);

    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(1));
    expect(analyticsApi.users).not.toHaveBeenCalled();
    expect(analyticsApi.system).not.toHaveBeenCalled();
    expect(wavePipelineApi.status).not.toHaveBeenCalled();
  });

  it('keeps wave pipeline loading independent from analytics permissions', async () => {
    currentUser.raw = { permissions: ['dashboard.view', 'wave_pipeline.view'] };

    render(<DashboardOverview isDarkMode={false} onSelectTab={vi.fn()} />);

    await waitFor(() => expect(wavePipelineApi.status).toHaveBeenCalledTimes(1));
    expect(analyticsApi.forecast).not.toHaveBeenCalled();
    expect(analyticsApi.users).not.toHaveBeenCalled();
    expect(analyticsApi.system).not.toHaveBeenCalled();
  });

  it('loads all permitted sources without using the User Type name as authorization', async () => {
    currentUser.raw = {
      role: 'custom_operator',
      permissions: [
        'dashboard.view',
        'analytics_forecast.view',
        'analytics_users.view',
        'analytics_system.view',
        'wave_pipeline.view',
      ],
    };

    render(<DashboardOverview isDarkMode={false} onSelectTab={vi.fn()} />);

    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(1));
    expect(analyticsApi.users).toHaveBeenCalledTimes(1);
    expect(analyticsApi.system).toHaveBeenCalledTimes(1);
    expect(wavePipelineApi.status).toHaveBeenCalledTimes(1);
  });
});
