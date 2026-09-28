import { describe, expect, it } from 'vitest';

import { clipPublishedAnnotations } from './clipPublishedAnnotations';

const domainSettings = {
  publishedDomainBoundary: {
    enabled: true,
    clipAnnotations: true,
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 10],
                [0, 0],
              ],
            ],
          },
        },
      ],
    },
  },
};

function collection(features) {
  return { type: 'FeatureCollection', features };
}

describe('clipPublishedAnnotations', () => {
  it('returns annotations unchanged when clipping is disabled', () => {
    const source = collection([
      {
        type: 'Feature',
        properties: { name: 'outside' },
        geometry: { type: 'Point', coordinates: [20, 20] },
      },
    ]);

    expect(
      clipPublishedAnnotations(source, {
        publishedDomainBoundary: {
          ...domainSettings.publishedDomainBoundary,
          clipAnnotations: false,
        },
      })
    ).toBe(source);
  });

  it('removes points outside the domain and keeps points inside', () => {
    const result = clipPublishedAnnotations(
      collection([
        {
          type: 'Feature',
          properties: { name: 'inside' },
          geometry: { type: 'Point', coordinates: [5, 5] },
        },
        {
          type: 'Feature',
          properties: { name: 'outside' },
          geometry: { type: 'Point', coordinates: [15, 5] },
        },
      ]),
      domainSettings
    );

    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties.name).toBe('inside');
  });

  it('clips a crossing line at the domain edges', () => {
    const result = clipPublishedAnnotations(
      collection([
        {
          type: 'Feature',
          properties: { type: 'front' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-5, 5],
              [15, 5],
            ],
          },
        },
      ]),
      domainSettings
    );

    expect(result.features).toHaveLength(1);
    expect(result.features[0].geometry.type).toBe('LineString');
    expect(result.features[0].geometry.coordinates[0][0]).toBeCloseTo(0);
    expect(result.features[0].geometry.coordinates.at(-1)[0]).toBeCloseTo(10);
  });

  it('intersects polygon annotations with the domain', () => {
    const result = clipPublishedAnnotations(
      collection([
        {
          type: 'Feature',
          properties: { label: 'area' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [5, 5],
                [15, 5],
                [15, 15],
                [5, 15],
                [5, 5],
              ],
            ],
          },
        },
      ]),
      domainSettings
    );

    expect(result.features).toHaveLength(1);
    const polygon = result.features[0].geometry;
    expect(['Polygon', 'MultiPolygon']).toContain(polygon.type);

    const coordinates =
      polygon.type === 'Polygon' ? polygon.coordinates[0] : polygon.coordinates[0][0];

    coordinates.forEach(([lng, lat]) => {
      expect(lng).toBeGreaterThanOrEqual(5);
      expect(lng).toBeLessThanOrEqual(10);
      expect(lat).toBeGreaterThanOrEqual(5);
      expect(lat).toBeLessThanOrEqual(10);
    });
  });

  it('respects holes in the configured domain for point annotations', () => {
    const settings = {
      publishedDomainBoundary: {
        enabled: true,
        clipAnnotations: true,
        geojson: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [0, 0],
                    [10, 0],
                    [10, 10],
                    [0, 10],
                    [0, 0],
                  ],
                  [
                    [4, 4],
                    [6, 4],
                    [6, 6],
                    [4, 6],
                    [4, 4],
                  ],
                ],
              },
            },
          ],
        },
      },
    };

    const result = clipPublishedAnnotations(
      collection([
        {
          type: 'Feature',
          properties: { name: 'hole' },
          geometry: { type: 'Point', coordinates: [5, 5] },
        },
        {
          type: 'Feature',
          properties: { name: 'domain' },
          geometry: { type: 'Point', coordinates: [2, 2] },
        },
      ]),
      settings
    );

    expect(result.features.map((feature) => feature.properties.name)).toEqual(['domain']);
  });
});
