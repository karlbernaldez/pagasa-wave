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

describe('useAnnotationHistory same-project remounts', () => {
  it('preserves history when the toolbar remounts for the same project', async () => {
    const projectId = 'history-remount-preserve';
    const firstCommand = createCommand('first');
    const secondCommand = createCommand('second');

    const first = renderHook(() => useAnnotationHistory({ projectId }));

    act(() => {
      first.result.current.record(firstCommand);
      first.result.current.record(secondCommand);
    });

    expect(first.result.current.canUndo).toBe(true);
    first.unmount();

    const second = renderHook(() => useAnnotationHistory({ projectId }));

    expect(second.result.current.canUndo).toBe(true);
    expect(second.result.current.canRedo).toBe(false);

    await act(async () => {
      expect(await second.result.current.undo()).toBe(true);
      expect(await second.result.current.undo()).toBe(true);
    });

    expect(secondCommand.undo).toHaveBeenCalledOnce();
    expect(firstCommand.undo).toHaveBeenCalledOnce();
    expect(second.result.current.canUndo).toBe(false);
    expect(second.result.current.canRedo).toBe(true);

    second.unmount();
  });
});
