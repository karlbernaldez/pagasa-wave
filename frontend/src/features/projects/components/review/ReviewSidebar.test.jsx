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
  { id: 'remark-1', comment: 'Most recent remark', actor: 'Admin One', date: '2026-01-16T10:00:00.000Z' },
  { id: 'remark-2', comment: 'Second recent remark', actor: 'Admin Two', date: '2026-01-15T10:00:00.000Z' },
  { id: 'remark-3', comment: 'Third recent remark', actor: 'Admin Three', date: '2026-01-14T10:00:00.000Z' },
];

const defaultTimeline = [
  { id: 'timeline-1', action: 'review_started', actor: 'Reviewer One', date: '2026-01-16T09:00:00.000Z' },
  { id: 'timeline-2', action: 'comment_added', actor: 'Reviewer Two', date: '2026-01-16T09:30:00.000Z' },
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
  it('renders status, reviewer, and review date information', () => {
    renderSidebar();

    expect(screen.getByText(/review status/i)).toBeInTheDocument();
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
  });

  it('renders the current no-snapshot warning', () => {
    renderSidebar({ diff: { ...defaultDiff, hasPreviousSnapshot: false } });

    expect(screen.getByText(/no previous annotation snapshot is available/i)).toBeInTheDocument();
    expect(screen.getByText(/live project data/i)).toBeInTheDocument();
  });

  it('does not render the warning when a previous snapshot exists', () => {
    renderSidebar();
    expect(screen.queryByText(/no previous annotation snapshot is available/i)).not.toBeInTheDocument();
  });

  it('calls onRemarksChange when review remarks change', () => {
    const { onRemarksChange } = renderSidebar();
    const textarea = screen.getByPlaceholderText(/add remarks for comments, revisions, or no-publication decisions/i);

    expect(textarea).toHaveValue('Initial remarks');
    fireEvent.change(textarea, { target: { value: 'Updated review remarks' } });
    expect(onRemarksChange).toHaveBeenCalledWith('Updated review remarks');
  });

  it('disables remarks when the project is not reviewable', () => {
    renderSidebar({ isReviewable: false });
    expect(screen.getByPlaceholderText(/add remarks for comments/i)).toBeDisabled();
  });

  it('disables remarks while an action is busy', () => {
    renderSidebar({ busyAction: 'comment' });
    expect(screen.getByPlaceholderText(/add remarks for comments/i)).toBeDisabled();
  });

  it('shows the two most recent previous remarks in review history', () => {
    renderSidebar();

    expect(screen.getByText(/review history/i)).toBeInTheDocument();
    expect(screen.getByText('Most recent remark')).toBeInTheDocument();
    expect(screen.getByText('Second recent remark')).toBeInTheDocument();
    expect(screen.queryByText('Third recent remark')).not.toBeInTheDocument();
  });

  it('renders timeline actions in review history', () => {
    renderSidebar();

    expect(screen.getByText('review started')).toBeInTheDocument();
    expect(screen.getByText('comment added')).toBeInTheDocument();
    expect(screen.getByText(/Reviewer One/i)).toBeInTheDocument();
    expect(screen.getByText(/Reviewer Two/i)).toBeInTheDocument();
  });

  it('hides review history when remarks and timeline are empty', () => {
    renderSidebar({ previousRemarks: [], timeline: [] });
    expect(screen.queryByText(/review history/i)).not.toBeInTheDocument();
  });

  it('renders in dark mode without hiding core content', () => {
    renderSidebar({ isDarkMode: true });

    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText('Senior Reviewer')).toBeInTheDocument();
    expect(screen.getByText(/review history/i)).toBeInTheDocument();
  });
});
