export const DEFAULT_MAP_STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';

export const DEFAULT_STUDIO_MAP_VIEW = Object.freeze({
  center: Object.freeze({
    longitude: 120.0,
    latitude: 15.5,
  }),
  zoom: Object.freeze({
    default: 5.5,
    min: 4,
    max: 16,
  }),
  maxBounds: Object.freeze({
    west: 80,
    south: -10,
    east: 170,
    north: 40,
  }),
  fitBounds: Object.freeze({
    west: 93,
    south: 5,
    east: 153.8595159535438,
    north: 25,
  }),
  padding: Object.freeze({
    top: 50,
    bottom: 50,
    left: 200,
    right: 200,
  }),
  fitBoundsMaxZoom: 8,
});

const toFiniteNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizePoint = (point = {}, fallback = {}) => ({
  longitude: toFiniteNumber(point.longitude, fallback.longitude),
  latitude: toFiniteNumber(point.latitude, fallback.latitude),
});

const clampPointToBounds = (point = {}, bounds = {}) => ({
  longitude: clamp(point.longitude, bounds.west, bounds.east),
  latitude: clamp(point.latitude, bounds.south, bounds.north),
});

const normalizeBounds = (bounds = {}, fallback = {}) => {
  const next = {
    west: toFiniteNumber(bounds.west, fallback.west),
    south: toFiniteNumber(bounds.south, fallback.south),
    east: toFiniteNumber(bounds.east, fallback.east),
    north: toFiniteNumber(bounds.north, fallback.north),
  };

  if (next.west >= next.east || next.south >= next.north) {
    return { ...fallback };
  }

  return next;
};

const clampBoundsToBounds = (bounds = {}, containingBounds = {}, fallback = {}) => {
  const next = {
    west: clamp(bounds.west, containingBounds.west, containingBounds.east),
    south: clamp(bounds.south, containingBounds.south, containingBounds.north),
    east: clamp(bounds.east, containingBounds.west, containingBounds.east),
    north: clamp(bounds.north, containingBounds.south, containingBounds.north),
  };

  if (next.west >= next.east || next.south >= next.north) {
    return clampBoundsToBounds(fallback, containingBounds, containingBounds);
  }

  return next;
};

const normalizeZoom = (zoom = {}, fallback = {}) => {
  const next = {
    default: toFiniteNumber(zoom.default, fallback.default),
    min: toFiniteNumber(zoom.min, fallback.min),
    max: toFiniteNumber(zoom.max, fallback.max),
  };

  if (next.min > next.default || next.default > next.max) {
    return { ...fallback };
  }

  return next;
};

const normalizePadding = (padding = {}, fallback = {}) => ({
  top: Math.max(0, toFiniteNumber(padding.top, fallback.top)),
  bottom: Math.max(0, toFiniteNumber(padding.bottom, fallback.bottom)),
  left: Math.max(0, toFiniteNumber(padding.left, fallback.left)),
  right: Math.max(0, toFiniteNumber(padding.right, fallback.right)),
});

export function normalizeStudioMapViewSettings(settings = {}) {
  const defaults = DEFAULT_STUDIO_MAP_VIEW;
  const zoom = normalizeZoom(settings.zoom, defaults.zoom);
  const fitBoundsMaxZoom = toFiniteNumber(settings.fitBoundsMaxZoom, defaults.fitBoundsMaxZoom);
  const maxBounds = normalizeBounds(settings.maxBounds, defaults.maxBounds);
  const fitBounds = clampBoundsToBounds(
    normalizeBounds(settings.fitBounds, defaults.fitBounds),
    maxBounds,
    defaults.fitBounds,
  );
  const center = clampPointToBounds(
    normalizePoint(settings.center, defaults.center),
    maxBounds,
  );

  return {
    center,
    zoom,
    maxBounds,
    fitBounds,
    padding: normalizePadding(settings.padding, defaults.padding),
    fitBoundsMaxZoom: fitBoundsMaxZoom <= zoom.max ? fitBoundsMaxZoom : defaults.fitBoundsMaxZoom,
  };
}

export function lngLatPair(point = {}) {
  return [Number(point.longitude), Number(point.latitude)];
}

export function boundsPair(bounds = {}) {
  return [
    [Number(bounds.west), Number(bounds.south)],
    [Number(bounds.east), Number(bounds.north)],
  ];
}
