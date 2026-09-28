import * as polyclip from 'polyclip-ts';

const EPSILON = 1e-9;

function cloneFeature(feature, geometry) {
  const { bbox: _staleBbox, ...rest } = feature || {};
  return {
    ...rest,
    geometry,
    properties: { ...(feature?.properties || {}) },
  };
}

function asPolygons(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function pointOnSegment(point, a, b) {
  const [px, py] = point;
  const [ax, ay] = a;
  const [bx, by] = b;
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  if (Math.abs(cross) > EPSILON) return false;

  const dot = (px - ax) * (px - bx) + (py - ay) * (py - by);
  return dot <= EPSILON;
}

function pointInRing(point, ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[j];
    const b = ring[i];

    if (pointOnSegment(point, a, b)) return true;

    const intersects =
      (b[1] > point[1]) !== (a[1] > point[1]) &&
      point[0] <
        ((a[0] - b[0]) * (point[1] - b[1])) / ((a[1] - b[1]) || Number.EPSILON) +
          b[0];

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygonCoordinates(point, polygon) {
  if (!polygon?.length || !pointInRing(point, polygon[0])) return false;

  for (let i = 1; i < polygon.length; i += 1) {
    if (pointInRing(point, polygon[i])) return false;
  }

  return true;
}

function pointInDomain(point, domainPolygons) {
  return domainPolygons.some((polygon) => pointInPolygonCoordinates(point, polygon));
}

function segmentIntersectionT(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]];
  const s = [d[0] - c[0], d[1] - c[1]];
  const denominator = r[0] * s[1] - r[1] * s[0];
  const cma = [c[0] - a[0], c[1] - a[1]];
  const crossCmaR = cma[0] * r[1] - cma[1] * r[0];

  if (Math.abs(denominator) < EPSILON) {
    if (Math.abs(crossCmaR) >= EPSILON) return [];

    const rr = r[0] * r[0] + r[1] * r[1];
    if (rr < EPSILON) return [];

    const t0 = (cma[0] * r[0] + cma[1] * r[1]) / rr;
    const t1 = t0 + (s[0] * r[0] + s[1] * r[1]) / rr;
    return [Math.max(0, Math.min(t0, t1)), Math.min(1, Math.max(t0, t1))].filter(
      (t) => t >= -EPSILON && t <= 1 + EPSILON
    );
  }

  const t = (cma[0] * s[1] - cma[1] * s[0]) / denominator;
  const u = (cma[0] * r[1] - cma[1] * r[0]) / denominator;

  if (t < -EPSILON || t > 1 + EPSILON || u < -EPSILON || u > 1 + EPSILON) {
    return [];
  }

  return [Math.max(0, Math.min(1, t))];
}

function interpolate(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
}

function getDomainEdges(domainPolygons) {
  const edges = [];

  domainPolygons.forEach((polygon) => {
    polygon.forEach((ring) => {
      for (let i = 1; i < ring.length; i += 1) {
        edges.push([ring[i - 1], ring[i]]);
      }
      if (
        ring.length > 2 &&
        (ring[0][0] !== ring[ring.length - 1][0] ||
          ring[0][1] !== ring[ring.length - 1][1])
      ) {
        edges.push([ring[ring.length - 1], ring[0]]);
      }
    });
  });

  return edges;
}

function pushCoordinate(target, coordinate) {
  const last = target[target.length - 1];
  if (
    !last ||
    Math.abs(last[0] - coordinate[0]) > EPSILON ||
    Math.abs(last[1] - coordinate[1]) > EPSILON
  ) {
    target.push(coordinate);
  }
}

function clipLineCoordinates(coordinates, domainPolygons, domainEdges) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return [];

  const pieces = [];
  let current = [];

  for (let i = 1; i < coordinates.length; i += 1) {
    const a = coordinates[i - 1];
    const b = coordinates[i];
    const tValues = [0, 1];

    domainEdges.forEach(([c, d]) => {
      segmentIntersectionT(a, b, c, d).forEach((t) => tValues.push(t));
    });

    const sorted = [...new Set(tValues.map((t) => Number(t.toFixed(12))))].sort(
      (x, y) => x - y
    );

    for (let j = 1; j < sorted.length; j += 1) {
      const t0 = sorted[j - 1];
      const t1 = sorted[j];
      if (t1 - t0 < EPSILON) continue;

      const mid = interpolate(a, b, (t0 + t1) / 2);
      if (!pointInDomain(mid, domainPolygons)) {
        if (current.length >= 2) pieces.push(current);
        current = [];
        continue;
      }

      const start = interpolate(a, b, t0);
      const end = interpolate(a, b, t1);
      pushCoordinate(current, start);
      pushCoordinate(current, end);
    }
  }

  if (current.length >= 2) pieces.push(current);
  return pieces;
}

function clipPointFeature(feature, domainPolygons) {
  const geometry = feature.geometry;

  if (geometry.type === 'Point') {
    return pointInDomain(geometry.coordinates, domainPolygons) ? [feature] : [];
  }

  const coordinates = geometry.coordinates.filter((point) =>
    pointInDomain(point, domainPolygons)
  );

  if (!coordinates.length) return [];
  if (coordinates.length === 1) {
    return [cloneFeature(feature, { type: 'Point', coordinates: coordinates[0] })];
  }

  return [cloneFeature(feature, { type: 'MultiPoint', coordinates })];
}

function clipLineFeature(feature, domainPolygons, domainEdges) {
  const geometry = feature.geometry;
  const lines =
    geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates;

  const clipped = lines.flatMap((line) =>
    clipLineCoordinates(line, domainPolygons, domainEdges)
  );

  if (!clipped.length) return [];
  if (clipped.length === 1) {
    return [cloneFeature(feature, { type: 'LineString', coordinates: clipped[0] })];
  }

  return [cloneFeature(feature, { type: 'MultiLineString', coordinates: clipped })];
}

function polygonGeometryToPolyclip(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function clipPolygonFeature(feature, domainUnion) {
  const input = polygonGeometryToPolyclip(feature.geometry);
  if (!input?.length || !domainUnion?.length) return [];

  const result = polyclip.intersection(input, domainUnion);
  if (!result?.length) return [];

  if (result.length === 1) {
    return [cloneFeature(feature, { type: 'Polygon', coordinates: result[0] })];
  }

  return [cloneFeature(feature, { type: 'MultiPolygon', coordinates: result })];
}

function normalizeDomain(settings = {}) {
  const boundary = settings?.publishedDomainBoundary || {};
  const collection = boundary.geojson;

  if (
    boundary.enabled !== true ||
    boundary.clipAnnotations !== true ||
    collection?.type !== 'FeatureCollection' ||
    !Array.isArray(collection.features) ||
    collection.features.length === 0
  ) {
    return null;
  }

  const polygons = collection.features.flatMap((feature) =>
    asPolygons(feature?.geometry)
  );

  if (!polygons.length) return null;

  const unionInput = polygons.map((polygon) => polygon);
  const union = polyclip.union(...unionInput);

  return {
    polygons,
    edges: getDomainEdges(polygons),
    union,
  };
}

export function clipPublishedAnnotations(featureCollection, settings = {}) {
  const domain = normalizeDomain(settings);
  if (!domain) return featureCollection;

  const features = [];

  (featureCollection?.features || []).forEach((feature) => {
    const type = feature?.geometry?.type;

    if (type === 'Point' || type === 'MultiPoint') {
      features.push(...clipPointFeature(feature, domain.polygons));
      return;
    }

    if (type === 'LineString' || type === 'MultiLineString') {
      features.push(...clipLineFeature(feature, domain.polygons, domain.edges));
      return;
    }

    if (type === 'Polygon' || type === 'MultiPolygon') {
      features.push(...clipPolygonFeature(feature, domain.union));
    }
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}
