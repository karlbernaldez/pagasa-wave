import { describe, expect, it } from 'vitest';

import { normalizeFeatureCollection } from './normalizeFeatureCollection';

describe('normalizeFeatureCollection annotation styles', () => {
  it('preserves an existing nested style object', () => {
    const input = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [120, 14],
              [121, 15],
            ],
          },
          properties: {
            style: {
              lineColor: '#123456',
              lineWidth: 7,
              lineOpacity: 0.45,
              lineDash: 'dotted',
            },
          },
        },
      ],
    };

    expect(normalizeFeatureCollection(input).features[0].properties.style).toEqual(
      input.features[0].properties.style
    );
  });

  it('moves a legacy top-level style object into feature properties', () => {
    const style = {
      lineColor: '#abcdef',
      lineWidth: 5,
      lineOpacity: 0.8,
      lineDash: 'dashed',
    };
    const input = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [120, 14],
          [121, 15],
        ],
      },
      style,
    };

    expect(normalizeFeatureCollection(input).features[0].properties.style).toEqual(style);
  });
});
