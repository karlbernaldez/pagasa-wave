import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getLatestMapInstance,
  registerMapInstance,
  subscribeToMapInstance,
} from './mapInstance';

describe('shared Mapbox instance registry', () => {
  afterEach(() => {
    registerMapInstance(null);
  });

  it('returns the active registered map', () => {
    const map = { getStyle: () => ({ layers: [] }) };

    registerMapInstance(map);

    expect(getLatestMapInstance()).toBe(map);
  });

  it('clears a destroyed map during Studio teardown', () => {
    const map = { getStyle: () => ({ layers: [] }) };
    registerMapInstance(map);

    registerMapInstance(null);

    expect(getLatestMapInstance()).toBeNull();
  });

  it('notifies subscribers when a map becomes available after mount', () => {
    const listener = vi.fn();
    const map = { getStyle: () => ({ layers: [] }) };
    const unsubscribe = subscribeToMapInstance(listener);

    expect(listener).toHaveBeenLastCalledWith(null);

    registerMapInstance(map);

    expect(listener).toHaveBeenLastCalledWith(map);
    unsubscribe();
  });

  it('stops notifying a subscriber after cleanup', () => {
    const listener = vi.fn();
    const map = { getStyle: () => ({ layers: [] }) };
    const unsubscribe = subscribeToMapInstance(listener);

    unsubscribe();
    registerMapInstance(map);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
