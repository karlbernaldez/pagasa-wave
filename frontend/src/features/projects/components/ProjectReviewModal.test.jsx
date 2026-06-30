import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ProjectReviewModal from './ProjectReviewModal';

vi.mock('@/features/projects/components/review/ReviewMapWorkspace', () => ({
  default: () => <section aria-label="review map workspace" />,
}));

vi.mock('@/features/projects/components/review/ReviewSidebar', () => ({
  default: ({ statusLabel }) => <aside aria-label="review sidebar">{statusLabel}</aside>,
}));

vi.mock('@/features/projects/components/review/ReviewActionsFooter', () => ({
  default: ({ onClose }) => (
    <footer>
      <button type="button" onClick={onClose}>Close</button>
    </footer>
  ),
}));

vi.mock('@/api/featureServices', () => ({
  fetchProjectFeatureCollection: vi.fn(() => Promise.resolve({ type: 'FeatureCollection', features: [] })),
}));

vi.mock('@/api/projectAPI', () => ({
  addReviewComment: vi.fn(),
  requestProjectRevision: vi.fn(),
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
});
