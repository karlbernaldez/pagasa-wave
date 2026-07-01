import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import ForecasterProjectLibraryPage from './ProjectLibraryPage';
import { fetchCurrentForecastPackage } from '@/api/forecastPackageAPI';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/app/providers/ThemeProvider', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock('@/api/forecastPackageAPI', () => ({
  createForecastPackage: vi.fn(),
  fetchCurrentForecastPackage: vi.fn(),
  submitForecastPackage: vi.fn(),
}));

vi.mock('../components/ForecastReminderCard', () => ({
  default: () => <div data-testid="forecast-reminder-card" />,
}));

vi.mock('../hooks/useForecasterWorkspaceSettings', () => ({
  default: () => ({
    operations: {},
    chartSequenceHelperMessage: '',
    emptyPackageMessage: '',
  }),
}));

const testTheme = {
  tokens: {
    spacing: {
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
    },
    radius: {
      lg: '0.75rem',
      xl: '1rem',
    },
    typography: {
      scale: {
        sm: '0.875rem',
        md: '1rem',
      },
      weight: {
        semibold: 600,
        bold: 700,
      },
    },
    motion: {
      duration: {
        fast: '150ms',
      },
      easing: {
        standard: 'ease',
      },
    },
    shadows: {
      focus: '0 0 0 3px rgba(59, 130, 246, 0.35)',
    },
    colors: {
      action: {
        primary: '#2563eb',
        primaryHover: '#1d4ed8',
        secondary: '#f8fafc',
        secondaryHover: '#e2e8f0',
        danger: '#dc2626',
        dangerHover: '#b91c1c',
      },
      text: {
        dark: {
          primary: '#ffffff',
        },
        light: {
          primary: '#0f172a',
          secondary: '#475569',
        },
      },
      surface: {
        light: {
          raised: '#ffffff',
          muted: '#f8fafc',
        },
      },
      brand: {
        primary: '#0057b8',
        secondary: '#0f172a',
      },
      border: {
        light: {
          default: '#e2e8f0',
          strong: '#cbd5e1',
        },
      },
    },
  },
};

function createChart(chartType, status = 'Submitted') {
  return {
    chartType,
    project: {
      _id: `${chartType}-project`,
      status,
    },
  };
}

function createPackage(status) {
  return {
    _id: `package-${status}`,
    name: 'Marine Forecast 2026-06-30',
    status,
    forecastDate: '2026-06-30T00:00:00.000Z',
    completion: {
      required: 4,
      completed: 4,
      percentage: 100,
      isComplete: true,
    },
    chartCompletion: [
      { chartType: 'analysis', isComplete: true },
      { chartType: 'forecast_24h', isComplete: true },
      { chartType: 'forecast_36h', isComplete: true },
      { chartType: 'forecast_48h', isComplete: true },
    ],
    charts: [
      createChart('analysis', status),
      createChart('forecast_24h', status),
      createChart('forecast_36h', status),
      createChart('forecast_48h', status),
    ],
  };
}

async function renderPageWithPackage(status) {
  fetchCurrentForecastPackage.mockResolvedValueOnce({ package: createPackage(status) });

  render(
    <ThemeProvider theme={testTheme}>
      <ForecasterProjectLibraryPage />
    </ThemeProvider>
  );

  await waitFor(() => expect(fetchCurrentForecastPackage).toHaveBeenCalledTimes(1));
  await screen.findByText('Marine Forecast 2026-06-30');
}

describe('ForecasterProjectLibraryPage locked package states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('explains that submitted packages are waiting for admin review', async () => {
    await renderPageWithPackage('Submitted');

    expect(screen.getAllByText(/submitted package: charts are locked while admin queues the review/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/package has been submitted. wait for admin to start review or request revisions/i)).toBeInTheDocument();
    expect(screen.getAllByText(/waiting for admin review/i)).not.toHaveLength(0);
  });

  it('explains that under-review packages are locked during admin review', async () => {
    await renderPageWithPackage('Under Review');

    expect(screen.getAllByText(/under review: charts are locked while admin checks this forecast package/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/admin review is in progress. keep the package unchanged unless revisions are requested/i)).toBeInTheDocument();
    expect(screen.getAllByText(/admin review in progress/i)).not.toHaveLength(0);
  });

  it('explains approved package locked state without generic copy', async () => {
    await renderPageWithPackage('Approved');

    expect(screen.getAllByText(/approved package: reviewed charts are locked and ready for publishing/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/package is approved and ready for publication/i)).toBeInTheDocument();
    expect(screen.queryByText(/this package is locked while it is approved/i)).not.toBeInTheDocument();
  });

  it('explains published package locked state without generic copy', async () => {
    await renderPageWithPackage('Published');

    expect(screen.getAllByText(/published package: final charts are locked as operational outputs/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/package has been published. use the public chart output/i)).toBeInTheDocument();
    expect(screen.queryByText(/this package is locked while it is published/i)).not.toBeInTheDocument();
  });
});
