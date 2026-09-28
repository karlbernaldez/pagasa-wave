import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PackageReviewChecklistPanel from './PackageReviewChecklistPanel';
import {
  getPackageReviewChecklist,
  updatePackageReviewChecklistItem,
} from '@/api/reviewChecklist';

vi.mock('@/api/reviewChecklist', () => ({
  getPackageReviewChecklist: vi.fn(),
  updatePackageReviewChecklistItem: vi.fn(),
}));

const checklist = {
  _id: 'checklist-1',
  definitionNameSnapshot: 'Operational Review',
  definitionVersion: 2,
  reviewAttempt: 1,
  progress: {
    required: 1,
    requiredCompleted: 0,
    optional: 0,
    canApprove: false,
  },
  items: [
    {
      _id: 'item-1',
      itemKey: 'forecast_cycle',
      labelSnapshot: 'Forecast cycle verified',
      descriptionSnapshot: 'Confirm the operational source cycle.',
      requiredSnapshot: true,
      allowNotApplicableSnapshot: false,
      sortOrderSnapshot: 10,
      status: 'Pending',
      comment: '',
      reviewedBy: null,
      reviewedAt: null,
      version: 1,
    },
  ],
};

describe('PackageReviewChecklistPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPackageReviewChecklist.mockResolvedValue(checklist);
  });

  it('loads package checklist evidence and exposes required progress', async () => {
    render(
      <PackageReviewChecklistPanel
        packageId="package-1"
        isDarkMode={false}
        canReview
        enabled
      />
    );

    expect(await screen.findByText('Forecast cycle verified')).toBeInTheDocument();
    expect(screen.getByText('0/1 required')).toBeInTheDocument();
    expect(screen.getByText(/Version 2/)).toBeInTheDocument();
  });

  it('writes an item assessment with its optimistic-lock version', async () => {
    updatePackageReviewChecklistItem.mockResolvedValue({
      checklist: {
        ...checklist,
        items: [
          {
            ...checklist.items[0],
            status: 'Pass',
            version: 2,
          },
        ],
      },
      progress: {
        ...checklist.progress,
        requiredCompleted: 1,
        canApprove: true,
      },
    });

    render(
      <PackageReviewChecklistPanel
        packageId="package-1"
        isDarkMode={false}
        canReview
        enabled
      />
    );

    await screen.findByText('Forecast cycle verified');
    fireEvent.click(screen.getByRole('button', { name: /^pass$/i }));

    await waitFor(() =>
      expect(updatePackageReviewChecklistItem).toHaveBeenCalledWith(
        'package-1',
        'item-1',
        {
          status: 'Pass',
          comment: '',
          version: 1,
        }
      )
    );

    expect(await screen.findByText('1/1 required')).toBeInTheDocument();
  });

  it('keeps checklist evidence view-only without review permission', async () => {
    render(
      <PackageReviewChecklistPanel
        packageId="package-1"
        isDarkMode={false}
        canReview={false}
        enabled
      />
    );

    await screen.findByText('Forecast cycle verified');
    expect(screen.getByRole('button', { name: /^pass$/i })).toBeDisabled();
    expect(screen.getByPlaceholderText(/reviewer note/i)).toBeDisabled();
    expect(screen.getByText(/View-only checklist access/i)).toBeInTheDocument();
  });
});
