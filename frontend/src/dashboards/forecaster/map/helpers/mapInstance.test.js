import { afterEach, describe, expect, it } from 'vitest';

import { getLatestMapInstance, registerMapInstance } from './mapInstance';

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
});
