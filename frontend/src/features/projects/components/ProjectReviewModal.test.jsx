import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ProjectReviewModal from './ProjectReviewModal';
import { fetchAdminForecastPackage } from '@/api/projectAPI';

vi.mock('@/features/projects/components/review/ReviewMapWorkspace', () => ({
  default: () => <section aria-label="review map workspace" />,
}));

vi.mock('@/features/projects/components/review/ReviewSidebar', () => ({
  default: ({ statusLabel }) => <aside aria-label="review sidebar">{statusLabel}</aside>,
}));

const publishExposureHistory = [];

vi.mock('@/features/projects/components/review/ReviewActionsFooter', () => ({
  default: ({ onClose, onPublish, isApproved }) => {
    const canPublish = isApproved && typeof onPublish === 'function';
    publishExposureHistory.push(canPublish);

    return (
      <footer>
        {canPublish && <button type="button">Publish chart</button>}
        <button type="button" onClick={onClose}>Close</button>
      </footer>
    );
  },
}));

vi.mock('@/api/featureServices', () => ({
  fetchProjectFeatureCollection: vi.fn(() => Promise.resolve({ type: 'FeatureCollection', features: [] })),
}));

vi.mock('@/api/projectAPI', () => ({
  addReviewComment: vi.fn(),
  requestProjectRevision: vi.fn(),
  startReviewProject: vi.fn((id) => Promise.resolve({ _id: id, status: 'Under Review' })),
  fetchAdminForecastPackage: vi.fn(() => Promise.resolve(null)),
}));

const baseProject = {
  _id: 'project-1',
  name: 'Coastal Wave Forecast',
  chartType: 'Wave',
  ownerDisplay: 'Forecast Team',
  status: 'under_review',
  forecastDate: '2026-05-12T00:00:00.000Z',
  features: [],
  versions: [],
  auditLogs: [],
};

function renderModal(project) {
  return render(
    <ProjectReviewModal
      project={project}
      onClose={vi.fn()}
      onApprove={vi.fn()}
      onReject={vi.fn()}
      onPublish={vi.fn()}
      onActionComplete={vi.fn()}
    />,
  );
}

describe('ProjectReviewModal', () => {
  beforeEach(() => {
    publishExposureHistory.length = 0;
  });

  it('keeps hook order stable when opening from no project to a selected project', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = renderModal(null);

    expect(screen.queryByText(/project review/i)).not.toBeInTheDocument();

    expect(() => {
      rerender(
        <ProjectReviewModal
          project={baseProject}
          onClose={vi.fn()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
          onPublish={vi.fn()}
          onActionComplete={vi.fn()}
        />,
      );
    }).not.toThrow();

    expect(await screen.findByText((text) => text.includes('Coastal Wave Forecast'))).toBeInTheDocument();
    expect(screen.getByLabelText(/review map workspace/i)).toBeInTheDocument();

    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Rendered more hooks than during the previous render'),
    );

    consoleErrorSpy.mockRestore();
  });

  it('never exposes chart publishing while navigating inside a package review', async () => {
    const approvedProject = {
      ...baseProject,
      _id: 'project-2',
      name: '24h Wave Forecast',
      chartType: 'forecast_24h',
      status: 'Approved',
    };
    const queue = [baseProject, approvedProject];

    fetchAdminForecastPackage.mockResolvedValue({ projects: queue });

    renderModal(baseProject);

    const nextButton = await screen.findByRole('button', { name: /next chart/i });
    await waitFor(() => expect(nextButton).toBeEnabled());

    expect(screen.queryByRole('button', { name: /publish chart/i })).not.toBeInTheDocument();

    fireEvent.click(nextButton);

    await screen.findByRole('heading', { name: /^24h Wave Forecast$/i });
    expect(screen.queryByRole('button', { name: /publish chart/i })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /publish chart/i })).not.toBeInTheDocument();
    });

    expect(publishExposureHistory).not.toContain(true);
  });

});
