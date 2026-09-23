import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AnalyticsAccess from './AnalyticsAccess';

const currentUser = vi.hoisted(() => ({ raw: null }));
const analyticsApi = vi.hoisted(() => ({
  forecast: vi.fn(),
  users: vi.fn(),
  system: vi.fn(),
  export: vi.fn(),
}));

vi.mock('@/shared/hooks/useCurrentDashboardUser', () => ({
  default: () => ({ rawUser: currentUser.raw }),
}));

vi.mock('@/api/analyticsAPI', () => ({
  fetchForecastAnalytics: analyticsApi.forecast,
  fetchUserAnalytics: analyticsApi.users,
  fetchSystemAnalytics: analyticsApi.system,
  fetchAnalyticsExport: analyticsApi.export,
}));

const forecastPayload = {
  total: 1,
  sampleSize: 1,
  packages: [],
  statusCounts: { Submitted: 1 },
  range: { start: '2026-09-02', end: '2026-09-15', days: 14, timezone: 'Asia/Manila' },
  generatedAt: '2026-09-15T00:00:00.000Z',
};

const userPayload = {
  total: 2,
  statusCounts: { active: 2 },
  roleCounts: { forecaster: 2 },
  range: { start: '2026-09-02', end: '2026-09-15', days: 14, timezone: 'Asia/Manila' },
  generatedAt: '2026-09-15T00:00:00.000Z',
};

const systemPayload = {
  users: { total: 2, active: 2, statusCounts: { active: 2 } },
  forecastPackages: { total: 1, statusCounts: { Published: 1 } },
  range: { start: '2026-09-02', end: '2026-09-15', days: 14, timezone: 'Asia/Manila' },
  generatedAt: '2026-09-15T00:00:00.000Z',
};

beforeEach(() => {
  currentUser.raw = null;
  analyticsApi.forecast.mockReset().mockResolvedValue(forecastPayload);
  analyticsApi.users.mockReset().mockResolvedValue(userPayload);
  analyticsApi.system.mockReset().mockResolvedValue(systemPayload);
  analyticsApi.export.mockReset().mockResolvedValue({
    blob: new Blob(['metric,value\n']),
    filename: 'analytics.csv',
  });
});

describe('AnalyticsAccess RBAC fetch boundaries', () => {
  it('loads only Forecast Operations for a forecast-only analytics user', async () => {
    currentUser.raw = { permissions: ['analytics_forecast.view'] };

    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(1));
    expect(analyticsApi.users).not.toHaveBeenCalled();
    expect(analyticsApi.system).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Forecast' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Users' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'System' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Export CSV/i })).not.toBeInTheDocument();
  });

  it('loads only the active permitted subsection until another permitted tab is selected', async () => {
    currentUser.raw = {
      permissions: ['analytics_forecast.view', 'analytics_users.view', 'analytics_system.view'],
    };

    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(1));
    expect(analyticsApi.users).not.toHaveBeenCalled();
    expect(analyticsApi.system).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Users' }));

    await waitFor(() => expect(analyticsApi.users).toHaveBeenCalledTimes(1));
    expect(analyticsApi.forecast).toHaveBeenCalledTimes(1);
    expect(analyticsApi.system).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'System' }));

    await waitFor(() => expect(analyticsApi.system).toHaveBeenCalledTimes(1));
    expect(analyticsApi.forecast).toHaveBeenCalledTimes(1);
    expect(analyticsApi.users).toHaveBeenCalledTimes(1);
  });

  it('loads the system API directly for a system-only analytics user', async () => {
    currentUser.raw = { permissions: ['analytics_system.view'] };

    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.system).toHaveBeenCalledTimes(1));
    expect(analyticsApi.forecast).not.toHaveBeenCalled();
    expect(analyticsApi.users).not.toHaveBeenCalled();
  });

  it('does not request any analytics API when no analytics subsection is permitted', async () => {
    currentUser.raw = { permissions: ['dashboard.view', 'users.view'] };

    render(<AnalyticsAccess isDarkMode={false} />);

    expect(
      await screen.findByText('No analytics subsection is assigned to your User Type.')
    ).toBeInTheDocument();
    expect(analyticsApi.forecast).not.toHaveBeenCalled();
    expect(analyticsApi.users).not.toHaveBeenCalled();
    expect(analyticsApi.system).not.toHaveBeenCalled();
  });

  it('shows export only when analytics.export is effective', async () => {
    currentUser.raw = {
      permissions: ['analytics_forecast.view', 'analytics.export'],
    };

    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
  });

  it('keeps the last successful subsection data visible when refresh fails', async () => {
    currentUser.raw = { permissions: ['analytics_forecast.view'] };

    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Packages in period')).toBeInTheDocument();

    analyticsApi.forecast.mockRejectedValueOnce(new Error('Forecast analytics unavailable'));
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Forecast analytics unavailable');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Showing the last successfully loaded data.'
    );
    expect(screen.getByText('Packages in period')).toBeInTheDocument();
  });

  it('does not leak a failed subsection error into a different cached subsection', async () => {
    currentUser.raw = {
      permissions: ['analytics_forecast.view', 'analytics_users.view'],
    };
    analyticsApi.users.mockRejectedValueOnce(new Error('User analytics unavailable'));

    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Users' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('User analytics unavailable');

    fireEvent.click(screen.getByRole('button', { name: 'Forecast' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Packages in period')).toBeInTheDocument();
  });

  it('labels old subsection data as stale', async () => {
    currentUser.raw = { permissions: ['analytics_forecast.view'] };
    analyticsApi.forecast.mockResolvedValueOnce({
      ...forecastPayload,
      generatedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    });

    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/data may be stale/i)).toBeInTheDocument();
  });

  it('renders a loading placeholder before the first request resolves', async () => {
    currentUser.raw = { permissions: ['analytics_forecast.view'] };
    let resolveForecast;
    analyticsApi.forecast.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveForecast = resolve;
        })
    );

    render(<AnalyticsAccess isDarkMode={false} />);

    expect(screen.getByText(/Loading forecast operations/i)).toBeInTheDocument();
    expect(screen.queryByText('Packages in period')).not.toBeInTheDocument();

    resolveForecast(forecastPayload);
    expect(await screen.findByText('Packages in period')).toBeInTheDocument();
  });

  it('shows an unavailable state instead of zero-value analytics when the first load fails', async () => {
    currentUser.raw = { permissions: ['analytics_forecast.view'] };
    analyticsApi.forecast.mockRejectedValueOnce(new Error('Forecast analytics unavailable'));

    render(<AnalyticsAccess isDarkMode={false} />);

    expect(await screen.findByText('Analytics data is currently unavailable.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByText('Packages in period')).not.toBeInTheDocument();
  });

  it('shows a dedicated empty state without rendering zero-value analytics cards', async () => {
    currentUser.raw = { permissions: ['analytics_forecast.view'] };
    analyticsApi.forecast.mockResolvedValueOnce({
      ...forecastPayload,
      total: 0,
      sampleSize: 0,
      statusCounts: {},
    });

    render(<AnalyticsAccess isDarkMode={false} />);

    expect(await screen.findByText('No analytics records in this period.')).toBeInTheDocument();
    expect(screen.queryByText('Packages in period')).not.toBeInTheDocument();
  });

  it('labels an in-flight manual refresh without hiding the cached data', async () => {
    currentUser.raw = { permissions: ['analytics_forecast.view'] };
    let resolveRefresh;
    analyticsApi.forecast.mockResolvedValueOnce(forecastPayload).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        })
    );

    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(screen.getByRole('button', { name: 'Refreshing…' })).toBeDisabled();
    expect(screen.getByText('Packages in period')).toBeInTheDocument();

    resolveRefresh(forecastPayload);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled());
  });

  it('refetches the active subsection when a preset range changes', async () => {
    currentUser.raw = { permissions: ['analytics_forecast.view'] };

    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));

    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(2));
    expect(analyticsApi.forecast.mock.calls[1][0]).toEqual(
      expect.objectContaining({ start: expect.any(String), end: expect.any(String) })
    );
  });
});
