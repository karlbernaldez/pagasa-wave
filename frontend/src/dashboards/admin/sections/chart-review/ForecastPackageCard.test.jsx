import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import ForecastPackageCard from './ForecastPackageCard';

const testTheme = {
  tokens: {
    spacing: { 2: '0.5rem', 3: '0.75rem', 4: '1rem', 5: '1.25rem' },
    radius: { lg: '0.75rem', xl: '1rem' },
    typography: { scale: { sm: '0.875rem', md: '1rem' }, weight: { semibold: 600, bold: 700 } },
    motion: { duration: { fast: '150ms' }, easing: { standard: 'ease' } },
    shadows: { focus: '0 0 0 3px rgba(59, 130, 246, 0.35)' },
    colors: {
      action: { primary: '#2563eb', primaryHover: '#1d4ed8', secondary: '#f8fafc', secondaryHover: '#e2e8f0', danger: '#dc2626', dangerHover: '#b91c1c' },
      text: { dark: { primary: '#ffffff' }, light: { primary: '#0f172a', secondary: '#475569' } },
      surface: { light: { raised: '#ffffff', muted: '#f8fafc' } },
      brand: { primary: '#0057b8', secondary: '#0f172a' },
      border: { light: { default: '#e2e8f0', strong: '#cbd5e1' } },
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
  it('shows approved packages as publishable with reviewed progress', () => {
    const handlers = renderCard(createPackage());
    const publishButton = screen.getByRole('button', { name: /publish package/i });

    expect(publishButton).toBeEnabled();
    expect(screen.getByText(/^approved$/i)).toBeInTheDocument();
    expect(screen.getByText(/4\/4 reviewed/i)).toBeInTheDocument();

    fireEvent.click(publishButton);
    expect(handlers.onPublishPackage).toHaveBeenCalledWith(expect.objectContaining({ status: 'Approved' }));
  });

  it('shows one published status and opens the package summary', () => {
    renderCard(createPackage({ status: 'Published' }));

    expect(screen.getAllByText(/^published$/i)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /view package/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/choose the chart you want to view/i)).toBeInTheDocument();
  });

  it('uses Start review for submitted packages', () => {
    renderCard(createPackage({
      status: 'Submitted',
      charts: [
        createChart('Submitted', 'analysis'),
        createChart('Submitted', 'forecast_24h'),
        createChart('Submitted', 'forecast_36h'),
        createChart('Submitted', 'forecast_48h'),
      ],
    }));

    expect(screen.getByRole('button', { name: /start review/i })).toBeEnabled();
    expect(screen.getByText(/^submitted$/i)).toBeInTheDocument();
  });

  it('uses status-specific chart actions in the package summary', () => {
    renderCard(createPackage({
      status: 'Revision Requested',
      charts: [
        createChart('Revision Requested', 'analysis'),
        createChart('Approved', 'forecast_24h'),
        createChart('Published', 'forecast_36h'),
        createChart('Rejected', 'forecast_48h'),
      ],
    }));

    expect(screen.getByRole('button', { name: /revision requested/i })).toBeDisabled();
  });

  it('opens submitted and under-review charts from the package summary', () => {
    const handlers = renderCard(createPackage({
      status: 'Under Review',
      charts: [
        createChart('Under Review', 'analysis'),
        createChart('Submitted', 'forecast_24h'),
        createChart('Approved', 'forecast_36h'),
        createChart('Published', 'forecast_48h'),
      ],
    }));

    fireEvent.click(screen.getByRole('button', { name: /continue review/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const continueReview = screen.getByText(/^continue review$/i).closest('button');
    fireEvent.click(continueReview);
    expect(handlers.onOpenChart).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Under Review' }),
      expect.objectContaining({ status: 'Under Review' })
    );
  });
});
