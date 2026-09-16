import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DashboardBreakdownCard from './DashboardBreakdownCard';

describe('DashboardBreakdownCard', () => {
  it('renders total, dominant category, shares, and a dense insight for sparse data', () => {
    render(
      <DashboardBreakdownCard
        title="Account Status"
        description="Operational account state."
        rows={[{ label: 'active', value: 1 }]}
        isDarkMode={false}
      />
    );

    expect(screen.getByText('Account Status')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    expect(screen.getByText('Active represents all 1 record in the selected period.')).toBeInTheDocument();
  });

  it('calculates the primary share and preserves all non-zero breakdown rows', () => {
    render(
      <DashboardBreakdownCard
        title="Forecast Package Health"
        description="Package states."
        rows={[
          { label: 'draft', value: 15 },
          { label: 'published', value: 8 },
          { label: 'rejected', value: 0 },
        ]}
        isDarkMode
      />
    );

    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.queryByText('Rejected')).not.toBeInTheDocument();
    expect(screen.getAllByText('65%').length).toBeGreaterThan(0);
    expect(screen.getByText('Draft is the largest group at 65% (15 of 23).')).toBeInTheDocument();
  });
});
