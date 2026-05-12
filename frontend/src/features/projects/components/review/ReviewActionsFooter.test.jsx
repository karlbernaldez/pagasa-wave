import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ReviewActionsFooter from './ReviewActionsFooter';

function renderFooter(props = {}) {
  const handlers = {
    onAddComment: vi.fn(),
    onRequestRevision: vi.fn(),
    onApprove: vi.fn(),
    onReject: vi.fn(),
    onPublish: vi.fn(),
    onClose: vi.fn(),
  };

  render(
    <ReviewActionsFooter
      isReviewable
      isUnderReview
      hasRemarks
      {...handlers}
      {...props}
    />
  );

  return handlers;
}

describe('ReviewActionsFooter', () => {
  it('disables remark-dependent actions and shows helper text when remarks are empty', () => {
    renderFooter({ hasRemarks: false });

    expect(screen.getByRole('button', { name: /add comment/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /request revision/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reject/i })).toBeDisabled();
    expect(screen.getByText(/add remarks to enable comment, revision, or reject actions/i)).toBeInTheDocument();
  });

  it('calls Add Comment when remarks exist', async () => {
    const user = userEvent.setup();
    const handlers = renderFooter({ hasRemarks: true });

    await user.click(screen.getByRole('button', { name: /add comment/i }));

    expect(handlers.onAddComment).toHaveBeenCalledTimes(1);
  });

  it('disables Request Revision when project is not under review', () => {
    renderFooter({ isUnderReview: false, hasRemarks: true });

    expect(screen.getByRole('button', { name: /request revision/i })).toBeDisabled();
  });

  it('enables Request Revision when project is under review and remarks exist', async () => {
    const user = userEvent.setup();
    const handlers = renderFooter({ isUnderReview: true, hasRemarks: true });
    const requestRevisionButton = screen.getByRole('button', { name: /request revision/i });

    expect(requestRevisionButton).toBeEnabled();

    await user.click(requestRevisionButton);

    expect(handlers.onRequestRevision).toHaveBeenCalledTimes(1);
  });

  it('disables Approve when project is not under review', () => {
    renderFooter({ isUnderReview: false, hasRemarks: true });

    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled();
  });

  it('calls Approve when project is under review', async () => {
    const user = userEvent.setup();
    const handlers = renderFooter({ isUnderReview: true });

    await user.click(screen.getByRole('button', { name: /approve/i }));

    expect(handlers.onApprove).toHaveBeenCalledTimes(1);
  });

  it('disables Reject when remarks are empty', () => {
    renderFooter({ hasRemarks: false, isUnderReview: true });

    expect(screen.getByRole('button', { name: /reject/i })).toBeDisabled();
  });

  it('calls Reject when project is under review and remarks exist', async () => {
    const user = userEvent.setup();
    const handlers = renderFooter({ isUnderReview: true, hasRemarks: true });
    const rejectButton = screen.getByRole('button', { name: /reject/i });

    expect(rejectButton).toBeEnabled();

    await user.click(rejectButton);

    expect(handlers.onReject).toHaveBeenCalledTimes(1);
  });

  it('shows Publish only when project is approved', async () => {
    const user = userEvent.setup();
    const handlers = renderFooter({ isApproved: true });
    const publishButton = screen.getByRole('button', { name: /publish/i });

    expect(publishButton).toBeInTheDocument();

    await user.click(publishButton);

    expect(handlers.onPublish).toHaveBeenCalledTimes(1);
  });

  it('does not show Publish when project is not approved', () => {
    renderFooter({ isApproved: false });

    expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument();
  });

  it('hides review-only actions when project is not reviewable', () => {
    renderFooter({ isReviewable: false, isApproved: false });

    expect(screen.queryByRole('button', { name: /add comment/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /request revision/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls Close handler', async () => {
    const user = userEvent.setup();
    const handlers = renderFooter();

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables all visible buttons while an action is busy', () => {
    renderFooter({ busyAction: 'approve', isApproved: true });

    expect(screen.getByRole('button', { name: /add comment/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /request revision/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reject/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /publish/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /close/i })).toBeDisabled();
  });
});
