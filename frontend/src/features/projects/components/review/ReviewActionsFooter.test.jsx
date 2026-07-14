import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import ReviewActionsFooter from './ReviewActionsFooter';

const testTheme = {
  tokens: {
    spacing: { 2: '0.5rem', 3: '0.75rem', 4: '1rem', 5: '1.25rem' },
    radius: { lg: '0.75rem' },
    typography: { scale: { sm: '0.875rem', md: '1rem' }, weight: { bold: 700 } },
    motion: { duration: { fast: '150ms' }, easing: { standard: 'ease' } },
    shadows: { focus: '0 0 0 3px rgba(59, 130, 246, 0.35)' },
    colors: {
      action: { primary: '#2563eb', primaryHover: '#1d4ed8', danger: '#dc2626', dangerHover: '#b91c1c' },
      text: { dark: { primary: '#ffffff' } },
      surface: { light: { raised: '#ffffff', muted: '#f8fafc' } },
      brand: { primary: '#0057b8', secondary: '#0f172a' },
      border: { light: { default: '#e2e8f0', strong: '#cbd5e1' } },
    },
  },
};

function renderFooter(props = {}) {
  const handlers = {
    onAddComment: vi.fn(),
    onRequestRevision: vi.fn(),
    onApprove: vi.fn(),
    onReject: vi.fn(),
    onNoPublication: vi.fn(),
    onPublish: vi.fn(),
    onClose: vi.fn(),
  };

  render(
    <ThemeProvider theme={testTheme}>
      <ReviewActionsFooter
        isReviewable
        isUnderReview
        hasRemarks
        {...handlers}
        {...props}
      />
    </ThemeProvider>
  );

  return handlers;
}

describe('ReviewActionsFooter', () => {
  it('disables remark-dependent actions and explains how to enable them', () => {
    renderFooter({ hasRemarks: false });

    expect(screen.getByRole('button', { name: /^comment$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /request revision/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /no publication/i })).toBeDisabled();
    expect(screen.getByText(/add remarks to enable revision and no-publication actions/i)).toBeInTheDocument();
  });

  it('shows the current review guidance while a chart is under review', () => {
    renderFooter({ hasRemarks: true, isUnderReview: true });

    expect(screen.getByText(/approve the chart or return it with your remarks/i)).toBeInTheDocument();
  });

  it('explains when review must be started before a decision', () => {
    renderFooter({ isUnderReview: false, hasRemarks: true });

    expect(screen.getByText(/start review before making a decision/i)).toBeInTheDocument();
  });

  it('explains that an approved chart is ready to publish', () => {
    renderFooter({ isReviewable: false, isApproved: true });

    expect(screen.getByText(/approved and ready to publish/i)).toBeInTheDocument();
  });

  it('calls Comment when remarks exist', () => {
    const handlers = renderFooter({ hasRemarks: true });

    fireEvent.click(screen.getByRole('button', { name: /^comment$/i }));

    expect(handlers.onAddComment).toHaveBeenCalledTimes(1);
  });

  it('disables Request Revision when project is not under review', () => {
    renderFooter({ isUnderReview: false, hasRemarks: true });
    expect(screen.getByRole('button', { name: /request revision/i })).toBeDisabled();
  });

  it('enables and calls Request Revision when allowed', () => {
    const handlers = renderFooter({ isUnderReview: true, hasRemarks: true });
    const button = screen.getByRole('button', { name: /request revision/i });

    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(handlers.onRequestRevision).toHaveBeenCalledTimes(1);
  });

  it('disables Approve when project is not under review', () => {
    renderFooter({ isUnderReview: false, hasRemarks: true });
    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled();
  });

  it('calls Approve when project is under review', () => {
    const handlers = renderFooter({ isUnderReview: true });
    fireEvent.click(screen.getByRole('button', { name: /approve/i }));
    expect(handlers.onApprove).toHaveBeenCalledTimes(1);
  });

  it('disables No Publication when remarks are empty', () => {
    renderFooter({ hasRemarks: false, isUnderReview: true });
    expect(screen.getByRole('button', { name: /no publication/i })).toBeDisabled();
  });

  it('calls No Publication with the operational exception reason', () => {
    const handlers = renderFooter({ isUnderReview: true, hasRemarks: true });
    const button = screen.getByRole('button', { name: /no publication/i });

    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(handlers.onNoPublication).toHaveBeenCalledWith('Operational exception / no verified publication');
  });

  it('shows and calls Publish only for approved projects', () => {
    const handlers = renderFooter({ isApproved: true });
    const button = screen.getByRole('button', { name: /publish/i });

    fireEvent.click(button);
    expect(handlers.onPublish).toHaveBeenCalledTimes(1);
  });

  it('does not show Publish when project is not approved', () => {
    renderFooter({ isApproved: false });
    expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument();
  });

  it('hides review-only actions when project is not reviewable', () => {
    renderFooter({ isReviewable: false, isApproved: false });

    expect(screen.queryByRole('button', { name: /^comment$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /request revision/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /no publication/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls Close handler', () => {
    const handlers = renderFooter();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables all visible buttons while an action is busy', () => {
    renderFooter({ busyAction: 'approve', isApproved: true });

    expect(screen.getByRole('button', { name: /^comment$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /request revision/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /no publication/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /publish/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /close/i })).toBeDisabled();
  });
});
