export const MAP_VIEW_SETTINGS_PAGE = 'mapview';

export const DEFAULT_MAP_VIEW_SETTINGS = Object.freeze({
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

const MAX_PADDING = 1000;
const MIN_ZOOM = 0;
const MAX_ZOOM = 24;

const isPlainObject = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value));

const toFiniteNumber = (value, fallback = null) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const readNumber = (source, key, fallback) => toFiniteNumber(source?.[key], fallback);

const isLongitude = (value) => value >= -180 && value <= 180;
const isLatitude = (value) => value >= -90 && value <= 90;
const isZoom = (value) => value >= MIN_ZOOM && value <= MAX_ZOOM;
const isPadding = (value) => value >= 0 && value <= MAX_PADDING;

export function normalizeMapViewSettings(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const defaults = DEFAULT_MAP_VIEW_SETTINGS;

  const centerSource = isPlainObject(source.center) ? source.center : {};
  const zoomSource = isPlainObject(source.zoom) ? source.zoom : {};
  const maxBoundsSource = isPlainObject(source.maxBounds) ? source.maxBounds : {};
  const fitBoundsSource = isPlainObject(source.fitBounds) ? source.fitBounds : {};
  const paddingSource = isPlainObject(source.padding) ? source.padding : {};

  return {
    center: {
      longitude: readNumber(centerSource, 'longitude', defaults.center.longitude),
      latitude: readNumber(centerSource, 'latitude', defaults.center.latitude),
    },
    zoom: {
      default: readNumber(zoomSource, 'default', defaults.zoom.default),
      min: readNumber(zoomSource, 'min', defaults.zoom.min),
      max: readNumber(zoomSource, 'max', defaults.zoom.max),
    },
    maxBounds: {
      west: readNumber(maxBoundsSource, 'west', defaults.maxBounds.west),
      south: readNumber(maxBoundsSource, 'south', defaults.maxBounds.south),
      east: readNumber(maxBoundsSource, 'east', defaults.maxBounds.east),
      north: readNumber(maxBoundsSource, 'north', defaults.maxBounds.north),
    },
    fitBounds: {
      west: readNumber(fitBoundsSource, 'west', defaults.fitBounds.west),
      south: readNumber(fitBoundsSource, 'south', defaults.fitBounds.south),
      east: readNumber(fitBoundsSource, 'east', defaults.fitBounds.east),
      north: readNumber(fitBoundsSource, 'north', defaults.fitBounds.north),
    },
    padding: {
      top: readNumber(paddingSource, 'top', defaults.padding.top),
      bottom: readNumber(paddingSource, 'bottom', defaults.padding.bottom),
      left: readNumber(paddingSource, 'left', defaults.padding.left),
      right: readNumber(paddingSource, 'right', defaults.padding.right),
    },
    fitBoundsMaxZoom: readNumber(source, 'fitBoundsMaxZoom', defaults.fitBoundsMaxZoom),
  };
}

export function validateMapViewSettings(settings = {}) {
  const errors = [];

  if (!isLongitude(settings.center.longitude)) errors.push('center.longitude must be between -180 and 180.');
  if (!isLatitude(settings.center.latitude)) errors.push('center.latitude must be between -90 and 90.');

  if (!isZoom(settings.zoom.min)) errors.push('zoom.min must be between 0 and 24.');
  if (!isZoom(settings.zoom.default)) errors.push('zoom.default must be between 0 and 24.');
  if (!isZoom(settings.zoom.max)) errors.push('zoom.max must be between 0 and 24.');
  if (settings.zoom.min > settings.zoom.default) errors.push('zoom.min must be less than or equal to zoom.default.');
  if (settings.zoom.default > settings.zoom.max) errors.push('zoom.default must be less than or equal to zoom.max.');

  if (!isLongitude(settings.maxBounds.west)) errors.push('maxBounds.west must be between -180 and 180.');
  if (!isLongitude(settings.maxBounds.east)) errors.push('maxBounds.east must be between -180 and 180.');
  if (!isLatitude(settings.maxBounds.south)) errors.push('maxBounds.south must be between -90 and 90.');
  if (!isLatitude(settings.maxBounds.north)) errors.push('maxBounds.north must be between -90 and 90.');
  if (settings.maxBounds.west >= settings.maxBounds.east) errors.push('maxBounds.west must be less than maxBounds.east.');
  if (settings.maxBounds.south >= settings.maxBounds.north) errors.push('maxBounds.south must be less than maxBounds.north.');

  if (!isLongitude(settings.fitBounds.west)) errors.push('fitBounds.west must be between -180 and 180.');
  if (!isLongitude(settings.fitBounds.east)) errors.push('fitBounds.east must be between -180 and 180.');
  if (!isLatitude(settings.fitBounds.south)) errors.push('fitBounds.south must be between -90 and 90.');
  if (!isLatitude(settings.fitBounds.north)) errors.push('fitBounds.north must be between -90 and 90.');
  if (settings.fitBounds.west >= settings.fitBounds.east) errors.push('fitBounds.west must be less than fitBounds.east.');
  if (settings.fitBounds.south >= settings.fitBounds.north) errors.push('fitBounds.south must be less than fitBounds.north.');

  for (const key of ['top', 'bottom', 'left', 'right']) {
    if (!isPadding(settings.padding[key])) {
      errors.push(`padding.${key} must be between 0 and ${MAX_PADDING}.`);
    }
  }

  if (!isZoom(settings.fitBoundsMaxZoom)) errors.push('fitBoundsMaxZoom must be between 0 and 24.');
  if (settings.fitBoundsMaxZoom > settings.zoom.max) {
    errors.push('fitBoundsMaxZoom must be less than or equal to zoom.max.');
  }

  return errors;
}

export function buildMapViewSettingsResponse(data = {}) {
  const normalized = normalizeMapViewSettings(data);
  const errors = validateMapViewSettings(normalized);

  if (errors.length > 0) {
    return DEFAULT_MAP_VIEW_SETTINGS;
  }

  return normalized;
}

export function parseMapViewSettingsPayload(payload = {}) {
  const normalized = normalizeMapViewSettings(payload);
  const errors = validateMapViewSettings(normalized);

  if (errors.length > 0) {
    const error = new Error('Invalid map view settings payload.');
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  return normalized;
}
