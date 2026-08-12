import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAnnotationHistory } from './useAnnotationHistory';

function createCommand(label) {
  return {
    label,
    undo: vi.fn(async () => undefined),
    redo: vi.fn(async () => undefined),
  };
}

function createDeferredUndoCommand(label) {
  let resolveUndo;

  return {
    command: {
      label,
      undo: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveUndo = resolve;
          })
      ),
      redo: vi.fn(async () => undefined),
    },
    resolveUndo: () => resolveUndo?.(),
  };
}

describe('useAnnotationHistory unmount invalidation', () => {
  it('starts a same-project remount with empty history', () => {
    const projectId = 'history-unmount-remount';
    const first = renderHook(() => useAnnotationHistory({ projectId }));

    act(() => first.result.current.record(createCommand('old')));
    expect(first.result.current.canUndo).toBe(true);

    first.unmount();

    const second = renderHook(() => useAnnotationHistory({ projectId }));
    expect(second.result.current.canUndo).toBe(false);
    expect(second.result.current.canRedo).toBe(false);
    expect(second.result.current.isApplying).toBe(false);

    second.unmount();
  });

  it('prevents an in-flight undo from repopulating history after same-project remount', async () => {
    const projectId = 'history-unmount-inflight';
    const deferred = createDeferredUndoCommand('old');
    const first = renderHook(() => useAnnotationHistory({ projectId }));

    act(() => first.result.current.record(deferred.command));

    let undoPromise;
    await act(async () => {
      undoPromise = first.result.current.undo();
      await Promise.resolve();
    });

    expect(first.result.current.isApplying).toBe(true);
    first.unmount();

    const fresh = createCommand('fresh');
    const second = renderHook(() => useAnnotationHistory({ projectId }));

    expect(second.result.current.canUndo).toBe(false);
    expect(second.result.current.canRedo).toBe(false);

    act(() => second.result.current.record(fresh));
    expect(second.result.current.canUndo).toBe(true);

    await act(async () => {
      deferred.resolveUndo();
      expect(await undoPromise).toBe(true);
    });

    expect(second.result.current.canUndo).toBe(true);
    expect(second.result.current.canRedo).toBe(false);

    await act(async () => {
      expect(await second.result.current.undo()).toBe(true);
    });

    expect(fresh.undo).toHaveBeenCalledOnce();
    expect(deferred.command.redo).not.toHaveBeenCalled();

    second.unmount();
  });
});
