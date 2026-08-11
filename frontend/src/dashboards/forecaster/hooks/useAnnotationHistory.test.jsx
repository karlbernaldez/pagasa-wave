import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAnnotationHistory } from './useAnnotationHistory';

function createCommand(label, calls, { undoError, redoError } = {}) {
  return {
    label,
    undo: vi.fn(async () => {
      calls.push(`undo:${label}`);
      if (undoError) throw undoError;
    }),
    redo: vi.fn(async () => {
      calls.push(`redo:${label}`);
      if (redoError) throw redoError;
    }),
  };
}

function createDeferredCommand(label, calls) {
  let resolveUndo;
  let resolveRedo;
  let rejectUndo;
  let rejectRedo;

  return {
    command: {
      label,
      undo: vi.fn(() => {
        calls.push(`undo:${label}`);
        return new Promise((resolve, reject) => {
          resolveUndo = resolve;
          rejectUndo = reject;
        });
      }),
      redo: vi.fn(() => {
        calls.push(`redo:${label}`);
        return new Promise((resolve, reject) => {
          resolveRedo = resolve;
          rejectRedo = reject;
        });
      }),
    },
    resolveUndo: () => resolveUndo?.(),
    resolveRedo: () => resolveRedo?.(),
    rejectUndo: (error) => rejectUndo?.(error),
    rejectRedo: (error) => rejectRedo?.(error),
  };
}

describe('useAnnotationHistory', () => {
  it('undoes newest commands first and redoes them in order', async () => {
    const calls = [];
    const first = createCommand('first', calls);
    const second = createCommand('second', calls);
    const { result } = renderHook(() => useAnnotationHistory({ projectId: 'history-order' }));

    act(() => {
      result.current.record(first);
      result.current.record(second);
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    await act(async () => {
      await result.current.undo();
      await result.current.undo();
      await result.current.redo();
      await result.current.redo();
    });

    expect(calls).toEqual(['undo:second', 'undo:first', 'redo:first', 'redo:second']);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('clears redo history after recording a new command', async () => {
    const calls = [];
    const { result } = renderHook(() => useAnnotationHistory({ projectId: 'history-redo-clear' }));

    act(() => result.current.record(createCommand('first', calls)));
    await act(async () => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.record(createCommand('replacement', calls)));
    expect(result.current.canRedo).toBe(false);
  });

  it('isolates history across project changes and clears stale commands', async () => {
    const calls = [];
    const projectACommand = createCommand('project-a', calls);
    const projectBCommand = createCommand('project-b', calls);
    const { result, rerender } = renderHook(
      ({ projectId }) => useAnnotationHistory({ projectId }),
      { initialProps: { projectId: 'history-project-a' } }
    );

    act(() => result.current.record(projectACommand));
    expect(result.current.canUndo).toBe(true);

    rerender({ projectId: 'history-project-b' });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    await act(async () => {
      expect(await result.current.undo()).toBe(false);
      expect(await result.current.redo()).toBe(false);
    });
    expect(projectACommand.undo).not.toHaveBeenCalled();
    expect(projectACommand.redo).not.toHaveBeenCalled();

    act(() => result.current.record(projectBCommand));
    expect(result.current.canUndo).toBe(true);

    rerender({ projectId: 'history-project-a' });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    await act(async () => {
      expect(await result.current.undo()).toBe(false);
      expect(await result.current.redo()).toBe(false);
    });

    expect(projectACommand.undo).not.toHaveBeenCalled();
    expect(projectACommand.redo).not.toHaveBeenCalled();
    expect(projectBCommand.undo).not.toHaveBeenCalled();
    expect(projectBCommand.redo).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it('ignores an in-flight undo completion after switching projects', async () => {
    const calls = [];
    const projectADeferred = createDeferredCommand('project-a', calls);
    const projectBCommand = createCommand('project-b', calls);
    const { result, rerender } = renderHook(
      ({ projectId }) => useAnnotationHistory({ projectId }),
      { initialProps: { projectId: 'history-inflight-project-a' } }
    );

    act(() => result.current.record(projectADeferred.command));

    let projectAUndo;
    await act(async () => {
      projectAUndo = result.current.undo();
      await Promise.resolve();
    });
    expect(result.current.isApplying).toBe(true);
    expect(projectADeferred.command.undo).toHaveBeenCalledOnce();

    rerender({ projectId: 'history-inflight-project-b' });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);

    await act(async () => {
      projectADeferred.resolveUndo();
      expect(await projectAUndo).toBe(true);
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);

    act(() => result.current.record(projectBCommand));
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    await act(async () => {
      expect(await result.current.undo()).toBe(true);
    });

    expect(projectBCommand.undo).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('does not let a stale project completion clear the active project applying state', async () => {
    const calls = [];
    const projectADeferred = createDeferredCommand('project-a', calls);
    const projectBDeferred = createDeferredCommand('project-b', calls);
    const { result, rerender } = renderHook(
      ({ projectId }) => useAnnotationHistory({ projectId }),
      { initialProps: { projectId: 'history-overlap-project-a' } }
    );

    act(() => result.current.record(projectADeferred.command));

    let projectAUndo;
    await act(async () => {
      projectAUndo = result.current.undo();
      await Promise.resolve();
    });

    rerender({ projectId: 'history-overlap-project-b' });
    act(() => result.current.record(projectBDeferred.command));

    let projectBUndo;
    await act(async () => {
      projectBUndo = result.current.undo();
      await Promise.resolve();
    });
    expect(result.current.isApplying).toBe(true);

    await act(async () => {
      projectADeferred.resolveUndo();
      expect(await projectAUndo).toBe(true);
    });

    expect(result.current.isApplying).toBe(true);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    await act(async () => {
      projectBDeferred.resolveUndo();
      expect(await projectBUndo).toBe(true);
    });

    expect(result.current.isApplying).toBe(false);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('ignores an in-flight undo failure after switching projects', async () => {
    const calls = [];
    const error = new Error('project-a undo failed');
    const onError = vi.fn();
    const projectADeferred = createDeferredCommand('project-a', calls);
    const projectBCommand = createCommand('project-b', calls);
    const { result, rerender } = renderHook(
      ({ projectId }) => useAnnotationHistory({ projectId, onError }),
      { initialProps: { projectId: 'history-failed-inflight-undo-a' } }
    );

    act(() => result.current.record(projectADeferred.command));

    let projectAUndo;
    await act(async () => {
      projectAUndo = result.current.undo();
      await Promise.resolve();
    });
    expect(result.current.isApplying).toBe(true);

    rerender({ projectId: 'history-failed-inflight-undo-b' });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);

    let caughtError;
    await act(async () => {
      projectADeferred.rejectUndo(error);
      try {
        await projectAUndo;
      } catch (caught) {
        caughtError = caught;
      }
    });

    expect(caughtError).toBe(error);
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);

    act(() => result.current.record(projectBCommand));
    await act(async () => {
      expect(await result.current.undo()).toBe(true);
      expect(await result.current.redo()).toBe(true);
    });

    expect(projectBCommand.undo).toHaveBeenCalledOnce();
    expect(projectBCommand.redo).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('ignores an in-flight redo failure after switching projects', async () => {
    const calls = [];
    const error = new Error('project-a redo failed');
    const onError = vi.fn();
    const projectADeferred = createDeferredCommand('project-a', calls);
    const projectBCommand = createCommand('project-b', calls);
    const { result, rerender } = renderHook(
      ({ projectId }) => useAnnotationHistory({ projectId, onError }),
      { initialProps: { projectId: 'history-failed-inflight-redo-a' } }
    );

    act(() => result.current.record(projectADeferred.command));

    let projectAUndo;
    await act(async () => {
      projectAUndo = result.current.undo();
      await Promise.resolve();
      projectADeferred.resolveUndo();
      expect(await projectAUndo).toBe(true);
    });
    expect(result.current.canRedo).toBe(true);

    let projectARedo;
    await act(async () => {
      projectARedo = result.current.redo();
      await Promise.resolve();
    });
    expect(result.current.isApplying).toBe(true);

    rerender({ projectId: 'history-failed-inflight-redo-b' });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);

    let caughtError;
    await act(async () => {
      projectADeferred.rejectRedo(error);
      try {
        await projectARedo;
      } catch (caught) {
        caughtError = caught;
      }
    });

    expect(caughtError).toBe(error);
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);

    act(() => result.current.record(projectBCommand));
    await act(async () => {
      expect(await result.current.undo()).toBe(true);
    });

    expect(projectBCommand.undo).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('keeps only the configured number of commands', async () => {
    const calls = [];
    const { result } = renderHook(() =>
      useAnnotationHistory({ projectId: 'history-limit', limit: 2 })
    );

    act(() => {
      result.current.record(createCommand('first', calls));
      result.current.record(createCommand('second', calls));
      result.current.record(createCommand('third', calls));
    });

    await act(async () => {
      await result.current.undo();
      await result.current.undo();
      await result.current.undo();
    });

    expect(calls).toEqual(['undo:third', 'undo:second']);
  });

  it('keeps a failed command on its original stack', async () => {
    const calls = [];
    const error = new Error('request failed');
    const onError = vi.fn();
    const command = createCommand('first', calls, { undoError: error });
    const { result } = renderHook(() =>
      useAnnotationHistory({ projectId: 'history-failed-command', onError })
    );

    act(() => result.current.record(command));

    let caughtError;
    await act(async () => {
      try {
        await result.current.undo();
      } catch (caught) {
        caughtError = caught;
      }
    });

    expect(caughtError).toBe(error);
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);
  });
});
