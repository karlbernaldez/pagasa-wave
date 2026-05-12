import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import ReviewSidebar from './ReviewSidebar';

const defaultDiff = {
  previousCount: 4,
  currentCount: 5,
  added: 2,
  changed: 1,
  removed: 1,
  hasPreviousSnapshot: true,
};

const defaultProject = {
  updatedAt: '2026-01-15T10:30:00.000Z',
  reviewedAt: '2026-01-16T11:45:00.000Z',
};

const defaultPreviousRemarks = [
  {
    id: 'remark-1',
    comment: 'Most recent remark',
    actor: 'Admin One',
    date: '2026-01-16T10:00:00.000Z',
  },
  {
    id: 'remark-2',
    comment: 'Second recent remark',
    actor: 'Admin Two',
    date: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'remark-3',
    comment: 'Third recent remark',
    actor: 'Admin Three',
    date: '2026-01-14T10:00:00.000Z',
  },
  {
    id: 'remark-4',
    comment: 'Fourth remark should be hidden',
    actor: 'Admin Four',
    date: '2026-01-13T10:00:00.000Z',
  },
];

const defaultTimeline = [
  {
    id: 'timeline-1',
    action: 'review_started',
    actor: 'Reviewer One',
    comment: 'Project review started',
    date: '2026-01-16T09:00:00.000Z',
  },
  {
    id: 'timeline-2',
    action: 'comment_added',
    actor: 'Reviewer Two',
    comment: 'Please check the current annotations',
    date: '2026-01-16T09:30:00.000Z',
  },
];

function renderSidebar(props = {}) {
  const onRemarksChange = vi.fn();

  render(
    <ReviewSidebar
      project={defaultProject}
      statusLabel="Under Review"
      diff={defaultDiff}
      remarks="Initial remarks"
      onRemarksChange={onRemarksChange}
      isReviewable
      reviewer="Senior Reviewer"
      previousRemarks={defaultPreviousRemarks}
      timeline={defaultTimeline}
      {...props}
    />
  );

  return { onRemarksChange };
}

describe('ReviewSidebar', () => {
  it('renders review status, reviewer, and review date sections', () => {
    renderSidebar();

    expect(screen.getByText('Review Status')).toBeInTheDocument();
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
    expect(screen.getByText('Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Senior Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Reviewed')).toBeInTheDocument();
  });

  it('renders the annotation diff summary values', () => {
    renderSidebar();

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Added')).toBeInTheDocument();
    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(screen.getByText('Removed')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
  });

  it('renders no previous snapshot warning when no previous snapshot exists', () => {
    renderSidebar({
      diff: {
        ...defaultDiff,
        hasPreviousSnapshot: false,
      },
    });

    expect(screen.getByText(/no previous annotation snapshot is available yet/i)).toBeInTheDocument();
  });

  it('does not render no previous snapshot warning when a previous snapshot exists', () => {
    renderSidebar();

    expect(screen.queryByText(/no previous annotation snapshot is available yet/i)).not.toBeInTheDocument();
  });

  it('calls onRemarksChange when remarks textarea changes', () => {
    const { onRemarksChange } = renderSidebar();
    const textarea = screen.getByPlaceholderText(/write review remarks/i);

    expect(textarea).toHaveValue('Initial remarks');

    fireEvent.change(textarea, { target: { value: 'Updated review remarks' } });

    expect(onRemarksChange).toHaveBeenCalledWith('Updated review remarks');
  });

  it('disables remarks textarea when project is not reviewable', () => {
    renderSidebar({ isReviewable: false });

    expect(screen.getByPlaceholderText(/write review remarks/i)).toBeDisabled();
  });

  it('disables remarks textarea while an action is busy', () => {
    renderSidebar({ busyAction: 'comment' });

    expect(screen.getByPlaceholderText(/write review remarks/i)).toBeDisabled();
  });

  it('shows only the latest three previous remarks', () => {
    renderSidebar();

    expect(screen.getByText('Previous Remarks')).toBeInTheDocument();
    expect(screen.getByText('Most recent remark')).toBeInTheDocument();
    expect(screen.getByText('Second recent remark')).toBeInTheDocument();
    expect(screen.getByText('Third recent remark')).toBeInTheDocument();
    expect(screen.queryByText('Fourth remark should be hidden')).not.toBeInTheDocument();
  });

  it('hides previous remarks card when there are no remarks', () => {
    renderSidebar({ previousRemarks: [] });

    expect(screen.queryByText('Previous Remarks')).not.toBeInTheDocument();
  });

  it('renders audit timeline items and comments', () => {
    renderSidebar();

    expect(screen.getByText('Audit Timeline')).toBeInTheDocument();
    expect(screen.getByText('review started')).toBeInTheDocument();
    expect(screen.getByText('comment added')).toBeInTheDocument();
    expect(screen.getByText('Project review started')).toBeInTheDocument();
    expect(screen.getByText('Please check the current annotations')).toBeInTheDocument();
  });

  it('renders empty audit timeline state when there are no timeline items', () => {
    renderSidebar({ timeline: [] });

    expect(screen.getByText('No audit events yet.')).toBeInTheDocument();
  });

  it('renders in dark mode without hiding core content', () => {
    renderSidebar({ isDarkMode: true });

    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText('Senior Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Audit Timeline')).toBeInTheDocument();
  });
});
