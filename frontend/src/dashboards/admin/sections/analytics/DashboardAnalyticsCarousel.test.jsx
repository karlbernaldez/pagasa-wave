import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DashboardAnalyticsCarousel from './DashboardAnalyticsCarousel';

function ForecastSlideStub() {
  return null;
}

describe('DashboardAnalyticsCarousel', () => {
  it('keeps the shared date-range selector available when moving between chart slides', () => {
    const onRangeChange = vi.fn();
    const forecastSlide = (
      <ForecastSlideStub
        trend={{
          title: 'Forecast Workflow Trend',
          description: 'Actual workflow events during the selected operating period.',
          series: [{ key: 'submitted', label: 'Submitted' }],
          points: [{ date: '2026-09-15', submitted: 1 }],
        }}
        selectedDays={14}
        isRefreshing={false}
        onRangeChange={onRangeChange}
      />
    );

    render(
      <DashboardAnalyticsCarousel
        forecastSlide={forecastSlide}
        statusSlide={null}
        userAnalytics={{
          statusCounts: { active: 1 },
          roleCounts: { forecaster: 1 },
          contributions: {
            trend: [{ date: '2026-09-15', total: 2 }],
            actionMix: [{ action: 'approved', label: 'Approved', count: 2 }],
          },
        }}
        systemAnalytics={null}
        range={{ start: '2026-09-02', end: '2026-09-15' }}
        selectedDays={14}
        isDarkMode={false}
      />
    );

    const rangeSelect = screen.getByRole('combobox', {
      name: 'Forecast workflow trend period',
    });
    expect(rangeSelect).toHaveValue('14');

    fireEvent.click(screen.getByRole('tab', { name: 'Show Contribution Activity' }));

    expect(screen.getByRole('heading', { name: 'Contribution Activity' })).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Forecast workflow trend period' })
    ).toBeInTheDocument();

    fireEvent.change(rangeSelect, { target: { value: '30' } });
    expect(onRangeChange).toHaveBeenCalledWith(30);
  });
});
