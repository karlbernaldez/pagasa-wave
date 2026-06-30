import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import ForecastPackageCard from './ForecastPackageCard';

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
    <ForecastPackageCard
      forecastPackage={forecastPackage}
      isDarkMode={false}
      onOpenChart={onOpenChart}
      onPublishPackage={onPublishPackage}
      publishingPackageId={handlers.publishingPackageId || null}
    />
  );

  return { onOpenChart, onPublishPackage };
}

describe('ForecastPackageCard', () => {
  it('shows approved packages as ready to publish with reviewed chart progress', () => {
    renderCard(createPackage());

    expect(screen.getByRole('button', { name: /publish package/i })).toBeEnabled();
    expect(screen.getByText(/all required charts are approved/i)).toBeInTheDocument();
    expect(screen.getByText(/4\/4 required charts already reviewed or returned/i)).toBeInTheDocument();
    expect(screen.getByText(/approved\/published/i)).toBeInTheDocument();
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
