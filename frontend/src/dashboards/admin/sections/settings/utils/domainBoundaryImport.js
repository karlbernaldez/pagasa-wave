const EMPTY_COLLECTION = Object.freeze({
  type: 'FeatureCollection',
  features: [],
});

function closeRing(points) {
  if (points.length < 3) throw new Error('A boundary ring needs at least three coordinate pairs.');
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return points;
  return [...points, [...first]];
}

function assertLngLat(lng, lat) {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    throw new Error('Boundary coordinates must be numeric longitude,latitude pairs.');
  }
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    throw new Error('Boundary coordinates must use WGS84 longitude/latitude values.');
  }
}

export function coordinatesTextToGeoJson(text) {
  const points = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split(/[\s,]+/).filter(Boolean);
      if (parts.length < 2) {
        throw new Error(`Coordinate line ${index + 1} must contain longitude and latitude.`);
      }
      const lng = Number(parts[0]);
      const lat = Number(parts[1]);
      assertLngLat(lng, lat);
      return [lng, lat];
    });

  if (points.length === 0) return EMPTY_COLLECTION;

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [closeRing(points)],
        },
      },
    ],
  };
}

export function normalizeBoundaryGeoJson(value) {
  let data = value;
  if (typeof value === 'string') {
    try {
      data = JSON.parse(value);
    } catch {
      throw new Error('The uploaded file is not valid JSON.');
    }
  }

  if (data?.type === 'FeatureCollection') {
    return {
      type: 'FeatureCollection',
      features: (data.features || []).map((feature) => {
        if (!['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type)) {
          throw new Error('Only Polygon and MultiPolygon GeoJSON features are supported.');
        }
        return {
          type: 'Feature',
          properties: {},
          geometry: feature.geometry,
        };
      }),
    };
  }

  if (data?.type === 'Feature') {
    if (!['Polygon', 'MultiPolygon'].includes(data.geometry?.type)) {
      throw new Error('Only Polygon and MultiPolygon GeoJSON features are supported.');
    }
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: data.geometry }],
    };
  }

  if (['Polygon', 'MultiPolygon'].includes(data?.type)) {
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: data }],
    };
  }

  throw new Error('Boundary data must be Polygon or MultiPolygon GeoJSON.');
}

function readRecordPolygon(view, offset, shapeType) {
  if (![5, 15, 25].includes(shapeType)) {
    throw new Error('Only Polygon shapefiles are supported.');
  }

  const numParts = view.getInt32(offset + 36, true);
  const numPoints = view.getInt32(offset + 40, true);
  if (numParts < 1 || numPoints < 3) return [];

  const partsOffset = offset + 44;
  const pointsOffset = partsOffset + numParts * 4;
  const partIndexes = Array.from({ length: numParts }, (_, index) =>
    view.getInt32(partsOffset + index * 4, true)
  );

  const points = Array.from({ length: numPoints }, (_, index) => {
    const lng = view.getFloat64(pointsOffset + index * 16, true);
    const lat = view.getFloat64(pointsOffset + index * 16 + 8, true);
    assertLngLat(lng, lat);
    return [lng, lat];
  });

  return partIndexes.map((start, index) => {
    const end = index + 1 < partIndexes.length ? partIndexes[index + 1] : points.length;
    return closeRing(points.slice(start, end));
  });
}

export function shapefileArrayBufferToGeoJson(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 100 || view.getInt32(0, false) !== 9994) {
    throw new Error('Invalid ESRI Shapefile header.');
  }

  const fileShapeType = view.getInt32(32, true);
  if (![5, 15, 25].includes(fileShapeType)) {
    throw new Error('Only Polygon shapefiles are supported for domain boundaries.');
  }

  const features = [];
  let recordOffset = 100;

  while (recordOffset + 8 <= view.byteLength) {
    const contentLengthBytes = view.getInt32(recordOffset + 4, false) * 2;
    const contentOffset = recordOffset + 8;
    if (contentLengthBytes <= 0 || contentOffset + contentLengthBytes > view.byteLength) break;

    const shapeType = view.getInt32(contentOffset, true);
    if (shapeType !== 0) {
      const rings = readRecordPolygon(view, contentOffset, shapeType);
      if (rings.length) {
        const signedArea = (ring) =>
          ring.slice(0, -1).reduce((area, point, index) => {
            const next = ring[index + 1] || ring[0];
            return area + point[0] * next[1] - next[0] * point[1];
          }, 0) / 2;

        const polygons = [];
        rings.forEach((ring) => {
          const isExterior = signedArea(ring) < 0;
          if (isExterior || polygons.length === 0) polygons.push([ring]);
          else polygons[polygons.length - 1].push(ring);
        });

        features.push({
          type: 'Feature',
          properties: {},
          geometry:
            polygons.length === 1
              ? { type: 'Polygon', coordinates: polygons[0] }
              : { type: 'MultiPolygon', coordinates: polygons },
        });
      }
    }

    recordOffset = contentOffset + contentLengthBytes;
  }

  if (!features.length) {
    throw new Error('The shapefile does not contain any polygon geometry.');
  }

  return { type: 'FeatureCollection', features };
}

export async function boundaryFileToGeoJson(file) {
  if (!file) throw new Error('Select a boundary file first.');
  const name = String(file.name || '').toLowerCase();

  if (name.endsWith('.geojson') || name.endsWith('.json')) {
    return normalizeBoundaryGeoJson(await file.text());
  }

  if (name.endsWith('.shp')) {
    return shapefileArrayBufferToGeoJson(await file.arrayBuffer());
  }

  throw new Error('Use a .geojson, .json, or Polygon .shp file.');
}
