import { describe, expect, it } from 'vitest';

import { coordinatesTextToGeoJson, normalizeBoundaryGeoJson } from './domainBoundaryImport';

describe('domain boundary imports', () => {
  it('builds and closes a polygon from longitude latitude input', () => {
    const geojson = coordinatesTextToGeoJson('116,4\n127,4\n127,22\n116,22');

    const ring = geojson.features[0].geometry.coordinates[0];
    expect(ring).toHaveLength(5);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it('normalizes Polygon GeoJSON into a FeatureCollection', () => {
    const geojson = normalizeBoundaryGeoJson({
      type: 'Polygon',
      coordinates: [
        [
          [116, 4],
          [127, 4],
          [127, 22],
          [116, 4],
        ],
      ],
    });

    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features).toHaveLength(1);
  });

  it('rejects non-polygon GeoJSON', () => {
    expect(() =>
      normalizeBoundaryGeoJson({
        type: 'LineString',
        coordinates: [
          [116, 4],
          [127, 22],
        ],
      })
    ).toThrow(/Polygon or MultiPolygon/);
  });

  it('rejects coordinate input outside WGS84 longitude latitude range', () => {
    expect(() => coordinatesTextToGeoJson('200,4\n127,4\n127,22')).toThrow(
      /WGS84 longitude\/latitude/
    );
  });
});
