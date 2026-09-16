import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardOverview from './Overview';

const currentUser = vi.hoisted(() => ({ raw: null }));
const dashboardApi = vi.hoisted(() => ({ overview: vi.fn() }));

vi.mock('@/shared/hooks/useCurrentDashboardUser', () => ({
  default: () => ({ rawUser: currentUser.raw }),
}));

vi.mock('@/api/dashboardAPI', () => ({
  fetchDashboardOverview: dashboardApi.overview,
}));

vi.mock('./analytics/analyticsDateRange', () => ({
  buildPresetRange: (days) => ({ start: `start-${days}`, end: `end-${days}` }),
}));

const basePayload = {
  meta: {
    operationalDate: '2026-09-15',
    generatedAt: '2026-09-15T08:00:00.000Z',
    timezone: 'Asia/Manila',
    range: { start: '2026-09-02', end: '2026-09-15', days: 14, timezone: 'Asia/Manila' },
    partial: false,
  },
  summaryCards: [],
  forecastWorkflowTrend: null,
  packageStatusDistribution: [],
  waveModels: [],
  recentPackages: [],
  attentionItems: [],
  recentActivity: [],
  quickActions: [],
  errors: [],
};

beforeEach(() => {
  currentUser.raw = null;
  dashboardApi.overview.mockReset().mockResolvedValue(basePayload);
});

describe('DashboardOverview dynamic read model', () => {
  it('loads only the dedicated dashboard overview endpoint from the page', async () => {
    currentUser.raw = { permissions: ['dashboard.view'] };

    render(<DashboardOverview isDarkMode={false} onSelectTab={vi.fn()} />);

    await waitFor(() => expect(dashboardApi.overview).toHaveBeenCalledTimes(1));
    expect(dashboardApi.overview).toHaveBeenCalledWith({ start: 'start-14', end: 'end-14' });
    expect(screen.getByText('Operational Dashboard')).toBeInTheDocument();
  });

  it('reloads historical dashboard analytics when the trend range changes', async () => {
    currentUser.raw = { permissions: ['dashboard.view', 'analytics_forecast.view'] };
    dashboardApi.overview.mockResolvedValue({
      ...basePayload,
      forecastWorkflowTrend: {
        title: 'Forecast Workflow Trend',
        description: 'Actual workflow events during the selected operating period.',
        series: [{ key: 'submitted', label: 'Submitted' }],
        points: [{ date: '2026-09-15', submitted: 1 }],
      },
    });

    render(<DashboardOverview isDarkMode={false} onSelectTab={vi.fn()} />);

    const rangeSelect = await screen.findByRole('combobox', {
      name: 'Forecast workflow trend period',
    });
    expect(rangeSelect).toHaveValue('14');

    fireEvent.change(rangeSelect, { target: { value: '30' } });

    await waitFor(() =>
      expect(dashboardApi.overview).toHaveBeenLastCalledWith({ start: 'start-30', end: 'end-30' })
    );
    expect(rangeSelect).toHaveValue('30');
  });

  it('renders separate chart and distribution carousels for dashboard analytics', async () => {
    currentUser.raw = {
      permissions: [
        'dashboard.view',
        'analytics_forecast.view',
        'analytics_users.view',
        'analytics_system.view',
      ],
    };
    dashboardApi.overview.mockResolvedValue({
      ...basePayload,
      forecastWorkflowTrend: {
        title: 'Forecast Workflow Trend',
        description: 'Actual workflow events during the selected operating period.',
        series: [{ key: 'submitted', label: 'Submitted' }],
        points: [{ date: '2026-09-15', submitted: 1 }],
      },
      packageStatusDistribution: [{ key: 'Published', label: 'Published', count: 2 }],
      userAnalytics: {
        total: 2,
        statusCounts: { active: 2 },
        roleCounts: { forecaster: 1, administrator: 1 },
        contributions: {
          totalEvents: 3,
          activeContributors: 2,
          actionMix: [{ action: 'approved', label: 'Approved', count: 3 }],
          trend: [{ date: '2026-09-15', total: 3, actions: { approved: 3 } }],
        },
      },
      systemAnalytics: {
        users: { total: 2, active: 2, statusCounts: { active: 2 } },
        forecastPackages: { total: 2, statusCounts: { Published: 2 }, publishedCharts: 2 },
        publishedChartViews: {
          totalViews: 5,
          viewsToday: 2,
          trend: [{ date: '2026-09-15', views: 2 }],
          topCharts: [{ projectId: 'chart-1', name: 'Analysis', views: 5 }],
        },
      },
    });

    render(<DashboardOverview isDarkMode={false} onSelectTab={vi.fn()} />);

    expect((await screen.findAllByText('Chart 1 of 5')).length).toBe(2);
    expect(screen.getByRole('tab', { name: 'Show Contribution Activity' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Show Contribution Mix' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Show Published Chart Views' })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Show Top Viewed Published Charts' })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Show Account Status' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Show User Type Distribution' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Show Forecast Package Health' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Show New Account Health' })).toBeInTheDocument();
  });

  it('renders configured wave models without assuming WW3 or ECWAM', async () => {
    currentUser.raw = { permissions: ['dashboard.view', 'wave_pipeline.view'] };
    dashboardApi.overview.mockResolvedValue({
      ...basePayload,
      summaryCards: [
        {
          key: 'models_ready',
          label: 'Models Ready',
          value: 1,
          total: 2,
          format: 'ratio',
          tone: 'warning',
          icon: 'models',
        },
      ],
      waveModels: [
        {
          id: 'swan-id',
          key: 'swan',
          code: 'SWAN',
          name: 'Regional SWAN',
          sourceCycle: '2026091500',
          frames: { ready: 21, expected: 21 },
          package: { name: '2026SEP15', status: 'ready' },
          pipelineState: 'READY',
        },
        {
          id: 'custom-id',
          key: 'custom-wave',
          code: 'CUSTOM_WAVE',
          name: 'Custom Wave Model',
          sourceCycle: '2026091418',
          frames: { ready: 9, expected: 21 },
          package: null,
          pipelineState: 'BUILDING',
        },
      ],
    });

    render(<DashboardOverview isDarkMode={false} onSelectTab={vi.fn()} />);

    expect(await screen.findByText('Regional SWAN')).toBeInTheDocument();
    expect(screen.getByText('Custom Wave Model')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('renders only the five most recent forecast packages', async () => {
    currentUser.raw = { permissions: ['dashboard.view', 'forecast.view'] };
    dashboardApi.overview.mockResolvedValue({
      ...basePayload,
      recentPackages: Array.from({ length: 6 }, (_, index) => ({
        id: `package-${index + 1}`,
        forecastDate: `2026-09-${String(15 - index).padStart(2, '0')}T00:00:00.000Z`,
        name: `Recent Package ${index + 1}`,
        status: 'Draft',
        updatedAt: '2026-09-15T08:00:00.000Z',
        actions: [
          {
            key: 'open',
            label: 'Open',
            target: { type: 'dashboard_tab', tab: 'forecast_packages' },
          },
        ],
      })),
    });

    render(<DashboardOverview isDarkMode={false} onSelectTab={vi.fn()} />);

    expect(await screen.findByText('Recent Package 1')).toBeInTheDocument();
    expect(screen.getByText('Recent Package 5')).toBeInTheDocument();
    expect(screen.queryByText('Recent Package 6')).not.toBeInTheDocument();
  });

  it('renders only actions returned by the permission-filtered backend contract', async () => {
    currentUser.raw = { permissions: ['dashboard.view', 'calendar.view'] };
    const onSelectTab = vi.fn();
    dashboardApi.overview.mockResolvedValue({
      ...basePayload,
      quickActions: [
        {
          key: 'calendar',
          label: 'Calendar',
          description: 'Open the operational forecast calendar.',
          icon: 'calendar',
          target: { type: 'dashboard_tab', tab: 'calendar' },
        },
      ],
    });

    render(<DashboardOverview isDarkMode={false} onSelectTab={onSelectTab} />);

    const calendar = await screen.findByRole('button', { name: /Calendar/i });
    fireEvent.click(calendar);
    expect(onSelectTab).toHaveBeenCalledWith('calendar');
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
  });

  it('keeps available dashboard data visible when the backend reports a partial result', async () => {
    currentUser.raw = { permissions: ['dashboard.view', 'forecast.review'] };
    dashboardApi.overview.mockResolvedValue({
      ...basePayload,
      meta: { ...basePayload.meta, partial: true },
      summaryCards: [
        {
          key: 'in_review',
          label: 'In Review',
          value: 3,
          format: 'integer',
          tone: 'info',
          icon: 'review',
        },
      ],
      errors: [
        {
          source: 'wave_models',
          code: 'WAVE_MODEL_STATUS_UNAVAILABLE',
          message: 'Wave model readiness is temporarily unavailable.',
        },
      ],
    });

    render(<DashboardOverview isDarkMode={false} onSelectTab={vi.fn()} />);

    expect(await screen.findByText('In Review')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(
      screen.getByText(/Some dashboard sources are temporarily unavailable/i)
    ).toBeInTheDocument();
  });
});
