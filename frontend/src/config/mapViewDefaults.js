export const DEFAULT_MAP_STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';

export const MAP_STYLE_PRESETS = Object.freeze({
  wavelab: Object.freeze({
    label: 'WaveLab Default',
    url: DEFAULT_MAP_STYLE_URL,
  }),
  streets: Object.freeze({
    label: 'Mapbox Streets',
    url: 'mapbox://styles/mapbox/streets-v12',
  }),
  outdoors: Object.freeze({
    label: 'Mapbox Outdoors',
    url: 'mapbox://styles/mapbox/outdoors-v12',
  }),
  light: Object.freeze({
    label: 'Mapbox Light',
    url: 'mapbox://styles/mapbox/light-v11',
  }),
  dark: Object.freeze({
    label: 'Mapbox Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
  }),
  satellite: Object.freeze({
    label: 'Mapbox Satellite',
    url: 'mapbox://styles/mapbox/satellite-v9',
  }),
  'satellite-streets': Object.freeze({
    label: 'Mapbox Satellite Streets',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
  }),
});

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
  mapStyle: Object.freeze({
    lightStyleId: 'preset:wavelab',
    darkStyleId: 'preset:wavelab',
    customStyles: Object.freeze([]),
    themeMode: 'adaptive',
  }),
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

const normalizeCustomStyles = (styles = []) => {
  if (!Array.isArray(styles)) return [];

  const seen = new Set();
  return styles
    .map((style) => ({
      id: String(style?.id || '').trim(),
      name: String(style?.name || '').trim(),
      url: String(style?.url || '').trim(),
    }))
    .filter((style) => style.id && style.name && style.url && !seen.has(style.id))
    .map((style) => {
      seen.add(style.id);
      return style;
    });
};

const normalizeStyleId = (styleId, customStyles, fallback = 'preset:wavelab') => {
  const value = String(styleId || '').trim();

  if (value.startsWith('preset:')) {
    const preset = value.slice('preset:'.length);
    if (Object.prototype.hasOwnProperty.call(MAP_STYLE_PRESETS, preset)) {
      return value;
    }
  }

  if (value.startsWith('custom:')) {
    const customId = value.slice('custom:'.length);
    if (customStyles.some((style) => style.id === customId)) {
      return value;
    }
  }

  return fallback;
};

const normalizeMapStyle = (mapStyle = {}, fallback = DEFAULT_STUDIO_MAP_VIEW.mapStyle) => {
  const customStyles = normalizeCustomStyles(mapStyle?.customStyles);

  // Backward compatibility with the temporary single/custom style shapes.
  let legacyStyleId = null;
  if (mapStyle?.preset && mapStyle.preset !== 'custom') {
    legacyStyleId = `preset:${mapStyle.preset}`;
  } else if (mapStyle?.customStyleUrl) {
    const legacy = {
      id: 'legacy-custom',
      name: 'Custom Mapbox Style',
      url: String(mapStyle.customStyleUrl).trim(),
    };
    if (legacy.url) customStyles.push(legacy);
    legacyStyleId = legacy.url ? 'custom:legacy-custom' : null;
  }

  const legacyLight =
    mapStyle?.light?.preset && mapStyle.light.preset !== 'custom'
      ? `preset:${mapStyle.light.preset}`
      : null;
  const legacyDark =
    mapStyle?.dark?.preset && mapStyle.dark.preset !== 'custom'
      ? `preset:${mapStyle.dark.preset}`
      : null;

  const lightStyleId = normalizeStyleId(
    mapStyle?.lightStyleId || legacyLight || legacyStyleId,
    customStyles,
    fallback.lightStyleId
  );
  const darkStyleId = normalizeStyleId(
    mapStyle?.darkStyleId || legacyDark || legacyStyleId,
    customStyles,
    fallback.darkStyleId
  );
  const themeMode = ['adaptive', 'native'].includes(mapStyle?.themeMode)
    ? mapStyle.themeMode
    : fallback.themeMode;

  return { lightStyleId, darkStyleId, customStyles, themeMode };
};

export function resolveStudioMapStyleUrl(settings = {}, isDarkMode = false) {
  const mapStyle = normalizeMapStyle(settings.mapStyle);
  const styleId = isDarkMode ? mapStyle.darkStyleId : mapStyle.lightStyleId;

  if (styleId.startsWith('custom:')) {
    const customId = styleId.slice('custom:'.length);
    return (
      mapStyle.customStyles.find((style) => style.id === customId)?.url ||
      DEFAULT_MAP_STYLE_URL
    );
  }

  const preset = styleId.replace(/^preset:/, '');
  return MAP_STYLE_PRESETS[preset]?.url || DEFAULT_MAP_STYLE_URL;
}

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
    mapStyle: normalizeMapStyle(settings.mapStyle, defaults.mapStyle),
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
