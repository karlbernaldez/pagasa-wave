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

describe('useAnnotationHistory', () => {
  it('undoes newest commands first and redoes them in order', async () => {
    const calls = [];
    const first = createCommand('first', calls);
    const second = createCommand('second', calls);
    const { result } = renderHook(() => useAnnotationHistory({ projectId: 'project-1' }));

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
    const { result } = renderHook(() => useAnnotationHistory({ projectId: 'project-1' }));

    act(() => result.current.record(createCommand('first', calls)));
    await act(async () => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.record(createCommand('replacement', calls)));
    expect(result.current.canRedo).toBe(false);
  });

  it('clears history when the project changes', () => {
    const calls = [];
    const { result, rerender } = renderHook(
      ({ projectId }) => useAnnotationHistory({ projectId }),
      { initialProps: { projectId: 'project-1' } }
    );

    act(() => result.current.record(createCommand('first', calls)));
    expect(result.current.canUndo).toBe(true);

    rerender({ projectId: 'project-2' });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('keeps only the configured number of commands', async () => {
    const calls = [];
    const { result } = renderHook(() =>
      useAnnotationHistory({ projectId: 'project-1', limit: 2 })
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
      useAnnotationHistory({ projectId: 'project-1', onError })
    );

    act(() => result.current.record(command));

    await expect(
      act(async () => {
        await result.current.undo();
      })
    ).rejects.toThrow('request failed');

    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isApplying).toBe(false);
  });
});
