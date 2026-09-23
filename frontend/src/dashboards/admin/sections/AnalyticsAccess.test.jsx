import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AnalyticsAccess from './AnalyticsAccess';

const currentUser = vi.hoisted(() => ({ raw: null }));
const analyticsApi = vi.hoisted(() => ({
  overview: vi.fn(),
  forecast: vi.fn(),
  publicReach: vi.fn(),
  users: vi.fn(),
  system: vi.fn(),
  export: vi.fn(),
}));

vi.mock('@/shared/hooks/useCurrentDashboardUser', () => ({
  default: () => ({ rawUser: currentUser.raw }),
}));

vi.mock('@/api/analyticsAPI', () => ({
  fetchAnalyticsOverview: analyticsApi.overview,
  fetchForecastAnalytics: analyticsApi.forecast,
  fetchPublicReachAnalytics: analyticsApi.publicReach,
  fetchUserAnalytics: analyticsApi.users,
  fetchSystemAnalytics: analyticsApi.system,
  fetchAnalyticsExport: analyticsApi.export,
}));

const range = { start: '2026-08-17', end: '2026-09-15', days: 30, timezone: 'Asia/Manila' };
const forecastPayload = {
  total: 1,
  statusCounts: { Published: 1 },
  summary: {
    packages: 1,
    submitted: 1,
    publishedEvents: 1,
    revisionRequests: 0,
    completionRate: 100,
  },
  throughput: [],
  timing: {},
  packages: [],
  range,
  generatedAt: '2026-09-15T00:00:00.000Z',
};
const overviewPayload = {
  sections: { forecast: forecastPayload },
  partial: false,
  errors: [],
  range,
  generatedAt: '2026-09-15T00:00:00.000Z',
};
const publicPayload = {
  totalViews: 1,
  summary: { viewsToday: 1, periodViews: 1, allTimeViews: 1, publishedChartsViewed: 1 },
  trend: [],
  topCharts: [],
  range,
  generatedAt: '2026-09-15T00:00:00.000Z',
};
const userPayload = {
  total: 2,
  statusCounts: { active: 2 },
  roleCounts: { forecaster: 2 },
  contributions: { totalEvents: 0, activeContributors: 0, trend: [], actionMix: [] },
  summary: {
    totalAccounts: 2,
    activeAccounts: 2,
    pendingAccounts: 0,
    activeContributors: 0,
    contributionEvents: 0,
  },
  range,
  generatedAt: '2026-09-15T00:00:00.000Z',
};
const systemPayload = {
  available: true,
  summary: {
    models: 1,
    readyModels: 1,
    packagesAvailable: 1,
    pipelineHealth: 'healthy',
    currentForecastCycle: '2026091418',
  },
  models: [],
  range,
  generatedAt: '2026-09-15T00:00:00.000Z',
};

beforeEach(() => {
  analyticsApi.overview.mockReset().mockResolvedValue(overviewPayload);
  analyticsApi.forecast.mockReset().mockResolvedValue(forecastPayload);
  analyticsApi.publicReach.mockReset().mockResolvedValue(publicPayload);
  analyticsApi.users.mockReset().mockResolvedValue(userPayload);
  analyticsApi.system.mockReset().mockResolvedValue(systemPayload);
  analyticsApi.export
    .mockReset()
    .mockResolvedValue({ blob: new Blob(['metric,value\n']), filename: 'analytics.csv' });
});

describe('AnalyticsAccess production workspace', () => {
  it('shows Executive plus only permitted subsections', async () => {
    currentUser.raw = { permissions: ['analytics_forecast.view'] };
    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.overview).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('tab', { name: 'Executive' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Forecast' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Collaboration' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'System' })).not.toBeInTheDocument();
    expect(analyticsApi.users).not.toHaveBeenCalled();
    expect(analyticsApi.system).not.toHaveBeenCalled();
  });

  it('does not grant analytics access from analytics.export alone', async () => {
    currentUser.raw = { permissions: ['analytics.export'] };
    render(<AnalyticsAccess isDarkMode={false} />);

    expect(
      await screen.findByText('No analytics subsection is assigned to your User Type.')
    ).toBeInTheDocument();
    expect(analyticsApi.overview).not.toHaveBeenCalled();
  });

  it('loads a subsection only when selected', async () => {
    currentUser.raw = {
      permissions: ['analytics_forecast.view', 'analytics_users.view', 'analytics_system.view'],
    };
    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.overview).toHaveBeenCalledTimes(1));
    expect(analyticsApi.forecast).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('tab', { name: 'Forecast' }));
    await waitFor(() => expect(analyticsApi.forecast).toHaveBeenCalledTimes(1));
    expect(analyticsApi.users).not.toHaveBeenCalled();
  });

  it('maps Public Reach to analytics_system.view', async () => {
    currentUser.raw = { permissions: ['analytics_system.view'] };
    render(<AnalyticsAccess isDarkMode={false} />);

    await waitFor(() => expect(analyticsApi.overview).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('tab', { name: 'Public Reach' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'System' })).toBeInTheDocument();
  });

  it('keeps cached data visible when refresh fails', async () => {
    currentUser.raw = { permissions: ['analytics_forecast.view'] };
    render(<AnalyticsAccess isDarkMode={false} />);
    await waitFor(() => expect(analyticsApi.overview).toHaveBeenCalledTimes(1));

    analyticsApi.overview.mockRejectedValueOnce(new Error('Overview unavailable'));
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Overview unavailable');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Showing the last successfully loaded data.'
    );
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('refetches the active subsection when the date range changes', async () => {
    currentUser.raw = { permissions: ['analytics_forecast.view'] };
    render(<AnalyticsAccess isDarkMode={false} />);
    await waitFor(() => expect(analyticsApi.overview).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: '7 Days' }));
    await waitFor(() => expect(analyticsApi.overview).toHaveBeenCalledTimes(2));
    expect(analyticsApi.overview.mock.calls[1][0]).toEqual(
      expect.objectContaining({ start: expect.any(String), end: expect.any(String) })
    );
  });
});
