import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useProjectReviewActionHandlers from './useProjectReviewActionHandlers';
import { requestForecastChartRevisionByProject } from '@/api/forecastPackageAPI';

vi.mock('@/api/projectAPI', () => ({
  addReviewComment: vi.fn(),
}));

vi.mock('@/api/forecastPackageAPI', () => ({
  requestForecastChartRevisionByProject: vi.fn(),
}));

describe('useProjectReviewActionHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes the review revision action through the containing forecast package chart endpoint', async () => {
    requestForecastChartRevisionByProject.mockResolvedValue({
      status: 'Revision Requested',
      affectedChartTypes: ['analysis'],
    });

    const runAction = vi.fn(async (_key, action) => action());
    const { result } = renderHook(() =>
      useProjectReviewActionHandlers({
        projectId: 'project-analysis',
        currentProject: { _id: 'project-analysis', chartType: 'analysis' },
        remarks: '  Correct the wave analysis annotations.  ',
        runAction,
        onApprove: vi.fn(),
        onReject: vi.fn(),
        onNoPublication: vi.fn(),
        onPublish: vi.fn(),
      })
    );

    await result.current.onRequestRevision();

    expect(runAction).toHaveBeenCalledWith('revision', expect.any(Function), {
      requireRemarks: true,
    });
    expect(requestForecastChartRevisionByProject).toHaveBeenCalledWith(
      'project-analysis',
      'Correct the wave analysis annotations.'
    );
  });
});
