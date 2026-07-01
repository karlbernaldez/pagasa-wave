import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import ReviewActionsFooter from './ReviewActionsFooter';

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
    },
    typography: {
      scale: {
        sm: '0.875rem',
        md: '1rem',
      },
      weight: {
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
        danger: '#dc2626',
        dangerHover: '#b91c1c',
      },
      text: {
        dark: {
          primary: '#ffffff',
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
  it('disables remark-dependent actions and shows helper text when remarks are empty', () => {
    renderFooter({ hasRemarks: false });

    expect(screen.getByRole('button', { name: /add comment/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /request revision/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /no publication/i })).toBeDisabled();
    expect(screen.getByText(/add remarks to enable comment, revision, or no-publication actions/i)).toBeInTheDocument();
  });

  it('explains the impact of review actions before admins decide', () => {
    renderFooter({ hasRemarks: true, isUnderReview: true });

    expect(screen.getByText(/review action impact/i)).toBeInTheDocument();
    expect(screen.getByText(/moves this chart to approved and counts toward package approval/i)).toBeInTheDocument();
    expect(screen.getByText(/returns this chart and package to the forecaster with your remarks/i)).toBeInTheDocument();
    expect(screen.getByText(/closes this chart with an operational exception note/i)).toBeInTheDocument();
  });

  it('explains when review must be started before action decisions', () => {
    renderFooter({ isUnderReview: false, hasRemarks: true });

    expect(screen.getByText(/start review before making approval, revision, or no-publication decisions/i)).toBeInTheDocument();
  });

  it('explains publish impact for approved projects', () => {
    renderFooter({ isReviewable: false, isApproved: true });

    expect(screen.getByText(/publish action/i)).toBeInTheDocument();
    expect(screen.getByText(/publish finalizes this approved chart as an operational output/i)).toBeInTheDocument();
  });

  it('calls Add Comment when remarks exist', () => {
    const handlers = renderFooter({ hasRemarks: true });

    fireEvent.click(screen.getByRole('button', { name: /add comment/i }));

    expect(handlers.onAddComment).toHaveBeenCalledTimes(1);
  });

  it('disables Request Revision when project is not under review', () => {
    renderFooter({ isUnderReview: false, hasRemarks: true });

    expect(screen.getByRole('button', { name: /request revision/i })).toBeDisabled();
  });

  it('enables Request Revision when project is under review and remarks exist', () => {
    const handlers = renderFooter({ isUnderReview: true, hasRemarks: true });
    const requestRevisionButton = screen.getByRole('button', { name: /request revision/i });

    expect(requestRevisionButton).toBeEnabled();

    fireEvent.click(requestRevisionButton);

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

  it('calls No Publication when project is under review and remarks exist', () => {
    const handlers = renderFooter({ isUnderReview: true, hasRemarks: true });
    const noPublicationButton = screen.getByRole('button', { name: /no publication/i });

    expect(noPublicationButton).toBeEnabled();

    fireEvent.click(noPublicationButton);

    expect(handlers.onNoPublication).toHaveBeenCalledTimes(1);
    expect(handlers.onNoPublication).toHaveBeenCalledWith('Operational exception / no verified publication');
  });

  it('shows Publish only when project is approved', () => {
    const handlers = renderFooter({ isApproved: true });
    const publishButton = screen.getByRole('button', { name: /publish/i });

    expect(publishButton).toBeInTheDocument();

    fireEvent.click(publishButton);

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

    expect(screen.getByRole('button', { name: /add comment/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /request revision/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /no publication/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /publish/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /close/i })).toBeDisabled();
  });
});
