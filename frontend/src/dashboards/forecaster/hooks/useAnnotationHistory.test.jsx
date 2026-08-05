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
