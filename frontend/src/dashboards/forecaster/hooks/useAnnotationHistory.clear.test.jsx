import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAnnotationHistory } from './useAnnotationHistory';

function createCommand(label, calls) {
  return {
    label,
    undo: vi.fn(async () => {
      calls.push(`undo:${label}`);
    }),
    redo: vi.fn(async () => {
      calls.push(`redo:${label}`);
    }),
  };
}

function createDeferredCommand(label, calls) {
  let resolveUndo;
  let rejectRedo;

  return {
    command: {
      label,
      undo: vi.fn(() => {
        calls.push(`undo:${label}`);
        return new Promise((resolve) => {
          resolveUndo = resolve;
        });
      }),
      redo: vi.fn(() => {
        calls.push(`redo:${label}`);
        return new Promise((resolve, reject) => {
          rejectRedo = reject;
        });
      }),
    },
    resolveUndo: () => resolveUndo?.(),
    rejectRedo: (error) => rejectRedo?.(error),
  };
}

describe('useAnnotationHistory clear invalidation', () => {
  it('keeps history empty when an in-flight undo resolves after clear', async () => {
    const calls = [];
    const deferred = createDeferredCommand('old', calls);
    const fresh = createCommand('fresh', calls);
    const { result } = renderHook(() =>
      useAnnotationHistory({ projectId: 'history-clear-inflight-undo' })
    );

    act(() => result.current.record(deferred.command));

    let undoPromise;
    await act(async () => {
      undoPromise = result.current.undo();
      await Promise.resolve();
    });

    expect(result.current.isApplying).toBe(true);

    act(() => result.current.clear());

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);

    act(() => result.current.record(fresh));
    expect(result.current.canUndo).toBe(true);

    await act(async () => {
      deferred.resolveUndo();
      expect(await undoPromise).toBe(true);
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);

    await act(async () => {
      expect(await result.current.undo()).toBe(true);
      expect(await result.current.redo()).toBe(true);
    });

    expect(fresh.undo).toHaveBeenCalledOnce();
    expect(fresh.redo).toHaveBeenCalledOnce();
    expect(deferred.command.redo).not.toHaveBeenCalled();
  });

  it('does not surface an in-flight redo failure after clear', async () => {
    const calls = [];
    const error = new Error('stale redo failed');
    const onError = vi.fn();
    const deferred = createDeferredCommand('old', calls);
    const fresh = createCommand('fresh', calls);
    const { result } = renderHook(() =>
      useAnnotationHistory({ projectId: 'history-clear-inflight-redo', onError })
    );

    act(() => result.current.record(deferred.command));

    await act(async () => {
      const undoPromise = result.current.undo();
      await Promise.resolve();
      deferred.resolveUndo();
      expect(await undoPromise).toBe(true);
    });

    let redoPromise;
    await act(async () => {
      redoPromise = result.current.redo();
      await Promise.resolve();
    });

    expect(result.current.isApplying).toBe(true);

    act(() => result.current.clear());
    act(() => result.current.record(fresh));

    let caughtError;
    await act(async () => {
      deferred.rejectRedo(error);
      try {
        await redoPromise;
      } catch (caught) {
        caughtError = caught;
      }
    });

    expect(caughtError).toBe(error);
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);

    await act(async () => {
      expect(await result.current.undo()).toBe(true);
    });

    expect(fresh.undo).toHaveBeenCalledOnce();
  });

  it('drops queued pre-clear operations and allows a fresh queue', async () => {
    const calls = [];
    const older = createCommand('older', calls);
    const running = createDeferredCommand('running', calls);
    const fresh = createCommand('fresh', calls);
    const { result } = renderHook(() =>
      useAnnotationHistory({ projectId: 'history-clear-queued' })
    );

    act(() => {
      result.current.record(older);
      result.current.record(running.command);
    });

    let runningUndo;
    let queuedUndo;
    await act(async () => {
      runningUndo = result.current.undo();
      queuedUndo = result.current.undo();
      await Promise.resolve();
    });

    expect(running.command.undo).toHaveBeenCalledOnce();
    expect(older.undo).not.toHaveBeenCalled();

    act(() => result.current.clear());
    act(() => result.current.record(fresh));

    await act(async () => {
      running.resolveUndo();
      expect(await runningUndo).toBe(true);
      expect(await queuedUndo).toBe(false);
    });

    expect(older.undo).not.toHaveBeenCalled();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);

    await act(async () => {
      expect(await result.current.undo()).toBe(true);
    });

    expect(fresh.undo).toHaveBeenCalledOnce();
  });
});
