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
    expect(screen.getByText('Operational Dashboard')).toBeInTheDocument();
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
    expect(screen.getByText(/Some dashboard sources are temporarily unavailable/i)).toBeInTheDocument();
  });
});
