import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getLatestMapInstance } from '@dashboards/forecaster/map/helpers/mapInstance';
import { useSpacebarPan } from './useSpacebarPan';

vi.mock('@dashboards/forecaster/map/helpers/mapInstance', () => ({
  getLatestMapInstance: vi.fn(),
}));

const dispatchKeyboardEvent = (type, options = {}) => {
  const event = new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    code: 'Space',
    key: ' ',
    ...options,
  });
  window.dispatchEvent(event);
  return event;
};

const createMap = () => {
  const canvas = document.createElement('canvas');
  canvas.style.cursor = 'crosshair';

  return {
    canvas,
    map: {
      dragPan: { enable: vi.fn() },
      getCanvas: vi.fn(() => canvas),
    },
  };
};

describe('useSpacebarPan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('temporarily suspends the active wave canvas while Space is held', () => {
    const { map, canvas } = createMap();
    const onToggleCanvas = vi.fn();
    getLatestMapInstance.mockReturnValue(map);

    renderHook(() =>
      useSpacebarPan({
        isWaveActive: true,
        isFrontActive: false,
        onToggleCanvas,
        onToggleFlagCanvas: vi.fn(),
        openModals: {},
      })
    );

    let keyDown;
    act(() => {
      keyDown = dispatchKeyboardEvent('keydown');
    });

    expect(keyDown.defaultPrevented).toBe(true);
    expect(onToggleCanvas).toHaveBeenCalledWith(false);
    expect(map.dragPan.enable).toHaveBeenCalledTimes(1);
    expect(canvas.style.cursor).toBe('grab');

    act(() => {
      dispatchKeyboardEvent('keyup');
    });

    expect(onToggleCanvas).toHaveBeenLastCalledWith(true);
    expect(canvas.style.cursor).toBe('crosshair');
  });

  it('restores a suspended front canvas when the window loses focus', () => {
    const { map } = createMap();
    const onToggleFlagCanvas = vi.fn();
    getLatestMapInstance.mockReturnValue(map);

    renderHook(() =>
      useSpacebarPan({
        isWaveActive: false,
        isFrontActive: true,
        onToggleCanvas: vi.fn(),
        onToggleFlagCanvas,
        openModals: {},
      })
    );

    act(() => {
      dispatchKeyboardEvent('keydown');
      window.dispatchEvent(new Event('blur'));
    });

    expect(onToggleFlagCanvas).toHaveBeenNthCalledWith(1, false);
    expect(onToggleFlagCanvas).toHaveBeenNthCalledWith(2, true);
  });

  it('does not intercept Space while the user is editing an input', () => {
    const { map } = createMap();
    const onToggleCanvas = vi.fn();
    getLatestMapInstance.mockReturnValue(map);

    renderHook(() =>
      useSpacebarPan({
        isWaveActive: true,
        isFrontActive: false,
        onToggleCanvas,
        onToggleFlagCanvas: vi.fn(),
        openModals: {},
      })
    );

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      code: 'Space',
      key: ' ',
    });

    act(() => {
      input.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(false);
    expect(onToggleCanvas).not.toHaveBeenCalled();
    expect(map.dragPan.enable).not.toHaveBeenCalled();

    input.remove();
  });

  it('does not intercept Space while a toolbar modal is open', () => {
    const { map } = createMap();
    const onToggleCanvas = vi.fn();
    getLatestMapInstance.mockReturnValue(map);

    renderHook(() =>
      useSpacebarPan({
        isWaveActive: true,
        isFrontActive: false,
        onToggleCanvas,
        onToggleFlagCanvas: vi.fn(),
        openModals: { markerTitle: true },
      })
    );

    act(() => {
      dispatchKeyboardEvent('keydown');
    });

    expect(onToggleCanvas).not.toHaveBeenCalled();
    expect(map.dragPan.enable).not.toHaveBeenCalled();
  });
});
