import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAnnotationHistory } from './useAnnotationHistory';

function createDeferredCommand(label, calls) {
  let resolveUndo;
  let resolveRedo;

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
        return new Promise((resolve) => {
          resolveRedo = resolve;
        });
      }),
    },
    resolveUndo: () => resolveUndo?.(),
    resolveRedo: () => resolveRedo?.(),
  };
}

describe('useAnnotationHistory queue draining', () => {
  it('returns false for a queued undo after an earlier undo drains the stack', async () => {
    const calls = [];
    const deferred = createDeferredCommand('single', calls);
    const { result } = renderHook(() => useAnnotationHistory({ projectId: 'history-double-undo' }));

    act(() => result.current.record(deferred.command));

    let firstUndo;
    let secondUndo;
    await act(async () => {
      firstUndo = result.current.undo();
      secondUndo = result.current.undo();
      await Promise.resolve();
    });

    expect(deferred.command.undo).toHaveBeenCalledOnce();

    await act(async () => {
      deferred.resolveUndo();
      expect(await firstUndo).toBe(true);
      expect(await secondUndo).toBe(false);
    });

    expect(deferred.command.undo).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
    expect(result.current.isApplying).toBe(false);
  });

  it('returns false for a queued redo after an earlier redo drains the stack', async () => {
    const calls = [];
    const deferred = createDeferredCommand('single', calls);
    const { result } = renderHook(() => useAnnotationHistory({ projectId: 'history-double-redo' }));

    act(() => result.current.record(deferred.command));

    let undo;
    await act(async () => {
      undo = result.current.undo();
      await Promise.resolve();
      deferred.resolveUndo();
      expect(await undo).toBe(true);
    });

    let firstRedo;
    let secondRedo;
    await act(async () => {
      firstRedo = result.current.redo();
      secondRedo = result.current.redo();
      await Promise.resolve();
    });

    expect(deferred.command.redo).toHaveBeenCalledOnce();

    await act(async () => {
      deferred.resolveRedo();
      expect(await firstRedo).toBe(true);
      expect(await secondRedo).toBe(false);
    });

    expect(deferred.command.redo).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);
  });
});
