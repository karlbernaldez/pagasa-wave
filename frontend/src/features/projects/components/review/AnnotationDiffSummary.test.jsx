import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { AnnotationDiffSummary, DiffLegend, DiffMetric } from './AnnotationDiffSummary';

const diff = {
  previousCount: 7,
  currentCount: 9,
  added: 3,
  changed: 2,
  removed: 1,
};

function expectMetric(label, value) {
  const labelElement = screen.getByText(label);
  const metricCard = labelElement.closest('div');

  expect(metricCard).toBeInTheDocument();
  expect(within(metricCard).getByText(String(value))).toBeInTheDocument();
}

describe('AnnotationDiffSummary', () => {
  it('renders all annotation diff metric labels and values', () => {
    render(<AnnotationDiffSummary diff={diff} />);

    expectMetric('Previous', 7);
    expectMetric('Current', 9);
    expectMetric('Added', 3);
    expectMetric('Changed', 2);
    expectMetric('Removed', 1);
  });

  it('renders correctly in dark mode', () => {
    render(<AnnotationDiffSummary diff={diff} isDarkMode />);

    expectMetric('Previous', 7);
    expectMetric('Current', 9);
    expectMetric('Added', 3);
    expectMetric('Changed', 2);
    expectMetric('Removed', 1);
  });
});

describe('DiffLegend', () => {
  it('renders all visual diff legend labels', () => {
    render(<DiffLegend />);

    expect(screen.getByText('Added')).toBeInTheDocument();
    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(screen.getByText('Removed')).toBeInTheDocument();
    expect(screen.getByText('Unchanged')).toBeInTheDocument();
  });

  it('renders all visual diff legend labels in dark mode', () => {
    render(<DiffLegend isDarkMode />);

    expect(screen.getByText('Added')).toBeInTheDocument();
    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(screen.getByText('Removed')).toBeInTheDocument();
    expect(screen.getByText('Unchanged')).toBeInTheDocument();
  });
});

describe('DiffMetric', () => {
  it('renders a single metric label and value', () => {
    render(<DiffMetric label="Changed" value={12} tone="orange" />);

    expectMetric('Changed', 12);
  });
});
