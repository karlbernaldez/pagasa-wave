import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import ForecastPackageCard from './ForecastPackageCard';

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

function createChart(status, chartType = 'analysis') {
  return {
    chartType,
    project: {
      _id: `${chartType}-${status}`.replaceAll(' ', '-').toLowerCase(),
      name: `${chartType} ${status}`,
      status,
    },
  };
}

function createPackage(overrides = {}) {
  const charts = overrides.charts || [
    createChart('Approved', 'analysis'),
    createChart('Approved', 'forecast_24h'),
    createChart('Approved', 'forecast_36h'),
    createChart('Approved', 'forecast_48h'),
  ];

  return {
    id: 'package-1',
    title: 'Daily Forecast Package',
    status: 'Approved',
    dateKey: '2026-06-30',
    ownerLabel: 'Forecaster One',
    chartCount: charts.length,
    pendingCount: charts.filter((chart) => ['Submitted', 'Under Review'].includes(chart.project.status)).length,
    approvedCount: charts.filter((chart) => ['Approved', 'Published'].includes(chart.project.status)).length,
    returnedCount: charts.filter((chart) => ['Rejected', 'Revision Requested'].includes(chart.project.status)).length,
    primaryChart: charts[0]?.project,
    charts,
    ...overrides,
  };
}

function renderCard(forecastPackage, handlers = {}) {
  const onOpenChart = handlers.onOpenChart || vi.fn();
  const onPublishPackage = handlers.onPublishPackage || vi.fn();

  render(
    <ThemeProvider theme={testTheme}>
      <ForecastPackageCard
        forecastPackage={forecastPackage}
        isDarkMode={false}
        onOpenChart={onOpenChart}
        onPublishPackage={onPublishPackage}
        publishingPackageId={handlers.publishingPackageId || null}
      />
    </ThemeProvider>
  );

  return { onOpenChart, onPublishPackage };
}

describe('ForecastPackageCard', () => {
  it('shows approved packages as ready to publish with reviewed chart progress', () => {
    renderCard(createPackage());

    expect(screen.getByRole('button', { name: /publish package/i })).toBeEnabled();
    expect(screen.getByText(/ready to publish/i)).toBeInTheDocument();
    expect(screen.getByText(/all required charts are approved/i)).toBeInTheDocument();
    expect(screen.getByText(/4\/4 required charts already reviewed or returned/i)).toBeInTheDocument();
    expect(screen.getByText(/approved\/published/i)).toBeInTheDocument();
  });

  it('does not render a duplicate package stage chip when the stage repeats the status', () => {
    renderCard(createPackage({ status: 'Published' }));

    expect(screen.getAllByText(/^published$/i)).toHaveLength(1);
    expect(screen.getByText(/final output is available/i)).toBeInTheDocument();
  });

  it('renders a distinct workflow stage chip when it adds information beyond the status', () => {
    renderCard(createPackage({
      status: 'Submitted',
      charts: [
        createChart('Submitted', 'analysis'),
        createChart('Submitted', 'forecast_24h'),
        createChart('Submitted', 'forecast_36h'),
        createChart('Submitted', 'forecast_48h'),
      ],
    }));

    expect(screen.getByText(/^submitted$/i)).toBeInTheDocument();
    expect(screen.getByText(/ready to start review/i)).toBeInTheDocument();
    expect(screen.getByText(/open a submitted chart to move this package into under review/i)).toBeInTheDocument();
  });

  it('uses status-specific disabled labels for non-reviewable chart rows', () => {
    renderCard(createPackage({
      status: 'Revision Requested',
      charts: [
        createChart('Revision Requested', 'analysis'),
        createChart('Approved', 'forecast_24h'),
        createChart('Published', 'forecast_36h'),
        createChart('Rejected', 'forecast_48h'),
      ],
    }));

    expect(screen.getByRole('button', { name: /waiting for revision/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /needs revision/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^approved$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /published output/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /closed/i })).toBeDisabled();
  });

  it('opens only reviewable submitted or under-review charts', () => {
    const handlers = renderCard(createPackage({
      status: 'Under Review',
      charts: [
        createChart('Under Review', 'analysis'),
        createChart('Submitted', 'forecast_24h'),
        createChart('Approved', 'forecast_36h'),
        createChart('Published', 'forecast_48h'),
      ],
    }));

    const reviewButtons = screen.getAllByRole('button', { name: /review chart/i });
    expect(reviewButtons).toHaveLength(2);

    fireEvent.click(reviewButtons[0]);
    fireEvent.click(reviewButtons[1]);
    fireEvent.click(screen.getByRole('button', { name: /^approved$/i }));

    expect(handlers.onOpenChart).toHaveBeenCalledTimes(2);
    expect(handlers.onOpenChart).toHaveBeenNthCalledWith(1, expect.objectContaining({ status: 'Under Review' }), expect.any(Object));
    expect(handlers.onOpenChart).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: 'Submitted' }), expect.any(Object));
  });
});
