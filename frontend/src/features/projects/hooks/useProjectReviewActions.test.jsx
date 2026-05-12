import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import useProjectReviewActions from './useProjectReviewActions';

const baseProject = {
  id: 'project-1',
  name: 'Original Project',
  status: 'under_review',
  features: [{ id: 'feature-1' }],
  versions: [{ id: 'version-1' }],
};

function HookHarness({
  initialProject = baseProject,
  initialRemarks = '  Review note  ',
  action = vi.fn().mockResolvedValue({ id: 'project-1', status: 'approved' }),
  onActionComplete = vi.fn(),
  onClose = vi.fn(),
  requireRemarks = false,
  closeOnSuccess = true,
}) {
  const [currentProject, setCurrentProject] = useState(initialProject);
  const [remarks, setRemarks] = useState(initialRemarks);
  const hasRemarks = remarks.trim().length > 0;
  const { busyAction, runAction } = useProjectReviewActions({
    currentProject,
    remarks,
    hasRemarks,
    setCurrentProject,
    setRemarks,
    onActionComplete,
    onClose,
  });

  return (
    <div>
      <p data-testid="busy-action">{busyAction || 'idle'}</p>
      <p data-testid="project-status">{currentProject.status}</p>
      <p data-testid="project-name">{currentProject.name}</p>
      <p data-testid="feature-count">{currentProject.features?.length ?? 0}</p>
      <p data-testid="remarks">{remarks}</p>
      <button
        type="button"
        onClick={() => runAction('approve', action, { requireRemarks, closeOnSuccess })}
      >
        Run action
      </button>
    </div>
  );
}

describe('useProjectReviewActions', () => {
  let alertSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('blocks remark-required actions when remarks are empty', async () => {
    const action = vi.fn();
    const onActionComplete = vi.fn();
    const onClose = vi.fn();

    render(
      <HookHarness
        initialRemarks="   "
        action={action}
        onActionComplete={onActionComplete}
        onClose={onClose}
        requireRemarks
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /run action/i }));

    expect(alertSpy).toHaveBeenCalledWith('Remarks are required for this action.');
    expect(action).not.toHaveBeenCalled();
    expect(onActionComplete).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('busy-action')).toHaveTextContent('idle');
  });

  it('runs an action, trims remarks, merges returned project state, clears remarks, and closes by default', async () => {
    const action = vi.fn().mockResolvedValue({ id: 'project-1', name: 'Reviewed Project', status: 'approved' });
    const onActionComplete = vi.fn();
    const onClose = vi.fn();

    render(<HookHarness action={action} onActionComplete={onActionComplete} onClose={onClose} requireRemarks />);

    fireEvent.click(screen.getByRole('button', { name: /run action/i }));

    expect(screen.getByTestId('busy-action')).toHaveTextContent('approve');

    await waitFor(() => {
      expect(screen.getByTestId('busy-action')).toHaveTextContent('idle');
    });

    expect(action).toHaveBeenCalledWith(baseProject, 'Review note');
    expect(screen.getByTestId('project-status')).toHaveTextContent('approved');
    expect(screen.getByTestId('project-name')).toHaveTextContent('Reviewed Project');
    expect(screen.getByTestId('feature-count')).toHaveTextContent('1');
    expect(screen.getByTestId('remarks')).toHaveTextContent('');
    expect(onActionComplete).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the modal open when closeOnSuccess is false', async () => {
    const action = vi.fn().mockResolvedValue({ id: 'project-1', status: 'under_review' });
    const onClose = vi.fn();

    render(<HookHarness action={action} onClose={onClose} closeOnSuccess={false} />);

    fireEvent.click(screen.getByRole('button', { name: /run action/i }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledTimes(1);
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('busy-action')).toHaveTextContent('idle');
  });

  it('keeps current project when action does not return an updated project', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const onActionComplete = vi.fn();

    render(<HookHarness action={action} onActionComplete={onActionComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /run action/i }));

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalledWith(baseProject);
    });

    expect(screen.getByTestId('project-status')).toHaveTextContent('under_review');
    expect(screen.getByTestId('project-name')).toHaveTextContent('Original Project');
  });

  it('ignores duplicate action attempts while busy', async () => {
    let resolveAction;
    const action = vi.fn(() => new Promise((resolve) => {
      resolveAction = resolve;
    }));

    render(<HookHarness action={action} />);

    fireEvent.click(screen.getByRole('button', { name: /run action/i }));
    fireEvent.click(screen.getByRole('button', { name: /run action/i }));

    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('busy-action')).toHaveTextContent('approve');

    await act(async () => {
      resolveAction({ id: 'project-1', status: 'approved' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('busy-action')).toHaveTextContent('idle');
    });
  });

  it('alerts on action failure and resets busy state', async () => {
    const action = vi.fn().mockRejectedValue(new Error('Review failed'));
    const onActionComplete = vi.fn();
    const onClose = vi.fn();

    render(<HookHarness action={action} onActionComplete={onActionComplete} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /run action/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Review failed');
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(onActionComplete).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('busy-action')).toHaveTextContent('idle');
    expect(screen.getByTestId('project-status')).toHaveTextContent('under_review');
  });
});
