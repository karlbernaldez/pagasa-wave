import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getLatestMapInstance,
  MAP_INSTANCE_READY_EVENT,
  registerMapInstance,
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

  it('notifies listeners when the Studio map becomes ready', () => {
    const listener = vi.fn();
    const map = { getStyle: () => ({ layers: [] }) };
    window.addEventListener(MAP_INSTANCE_READY_EVENT, listener);

    registerMapInstance(map);

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(MAP_INSTANCE_READY_EVENT, listener);
  });

  it('clears a destroyed map during Studio teardown', () => {
    const map = { getStyle: () => ({ layers: [] }) };
    registerMapInstance(map);

    registerMapInstance(null);

    expect(getLatestMapInstance()).toBeNull();
  });
});
