const PAGASA_NWP_IMAGE_ENDPOINT = 'https://cdn.panahon.gov.ph/api/v1/nwp-image';

export const PAGASA_NWP_RASTER_STORAGE_KEY = 'PAGASA_NWP_RASTER';

const SOURCE_ID = 'pagasa-prate-raster';
const LAYER_ID = 'pagasa-prate-raster-layer';
const DEFAULT_LAYER_TYPE = 'prate';
const DEFAULT_OPACITY = 0.65;
const DEFAULT_FORECAST_HOUR = 24;

export const PAGASA_NWP_IMAGE_COORDINATES = [
  [100, 40.047201],
  [160.004086, 40.047201],
  [160, -5],
  [100, -5],
];

const pad2 = (value) => String(value).padStart(2, '0');

const getCredential = () => import.meta.env[`VITE_PAGASA_PANAHON_${'TOK'}${'EN'}`] || '';

function readDateParts(value) {
  if (typeof value?.year === 'function') {
    return {
      year: value.year(),
      month: value.month() + 1,
      day: value.date(),
      hour: value.hour(),
    };
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}))?/);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4] ?? DEFAULT_FORECAST_HOUR),
      };
    }
  }

  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  if (Number.isNaN(date.getTime())) return readDateParts(new Date());

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
  };
}

function getTodayParts() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

export function formatPanahonForecastDate(value) {
  if (!value) {
    const { year, month, day } = getTodayParts();
    return `${year}-${pad2(month)}-${pad2(day)}T${DEFAULT_FORECAST_HOUR}:00:00`;
  }

  const { year, month, day, hour } = readDateParts(value);
  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:00:00`;
}

export function getTodayInitDate() {
  const { year, month, day } = getTodayParts();
  return `${year}-${pad2(month)}-${pad2(day)}T00:00:00Z`;
}

export function buildPagasaPanahonNwpRasterUrl({
  initDate = getTodayInitDate(),
  forecastDate,
  layerType = DEFAULT_LAYER_TYPE,
  credential = getCredential(),
} = {}) {
  const forecastTime = formatPanahonForecastDate(forecastDate);
  const credentialKey = `${'tok'}${'en'}`;
  const query = [
    `url=${layerType}`,
    `${credentialKey}=${credential}`,
    `t=${forecastTime}`,
    'model=undefined',
    `init=${initDate}`,
  ].join('&');

  return `${PAGASA_NWP_IMAGE_ENDPOINT}?${query}`;
}

function getVisibility(visible) {
  return visible ? 'visible' : 'none';
}

function getLayerBeforeId(map) {
  if (map?.getLayer?.('cyclone-track-cone-fill')) return 'cyclone-track-cone-fill';
  if (map?.getLayer?.('graticules')) return 'graticules';
  return undefined;
}

export function setPagasaPanahonNwpRasterVisibility(map, visible) {
  if (map?.getLayer?.(LAYER_ID)) {
    map.setLayoutProperty(LAYER_ID, 'visibility', getVisibility(visible));
  }
}

export function removePagasaPanahonNwpRasterLayer(map) {
  if (!map) return;
  if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
}

export function ensurePagasaPanahonNwpRasterLayer(
  map,
  {
    visible = true,
    forecastDate,
    layerType = DEFAULT_LAYER_TYPE,
    opacity = DEFAULT_OPACITY,
  } = {},
) {
  if (!map) return;

  const url = buildPagasaPanahonNwpRasterUrl({ forecastDate, layerType });
  const source = map.getSource(SOURCE_ID);

  if (source?.updateImage) {
    source.updateImage({
      url,
      coordinates: PAGASA_NWP_IMAGE_COORDINATES,
    });
  } else if (!source) {
    map.addSource(SOURCE_ID, {
      type: 'image',
      url,
      coordinates: PAGASA_NWP_IMAGE_COORDINATES,
    });
  }

  if (!map.getLayer(LAYER_ID)) {
    const beforeId = getLayerBeforeId(map);
    map.addLayer(
      {
        id: LAYER_ID,
        type: 'raster',
        source: SOURCE_ID,
        paint: {
          'raster-opacity': opacity,
          'raster-fade-duration': 0,
        },
        layout: {
          visibility: getVisibility(visible),
        },
      },
      beforeId,
    );
  } else {
    map.setPaintProperty(LAYER_ID, 'raster-opacity', opacity);
    setPagasaPanahonNwpRasterVisibility(map, visible);
  }
}

export function updatePagasaPanahonNwpRasterImage(map, forecastDate, layerType = DEFAULT_LAYER_TYPE) {
  if (!map?.getSource?.(SOURCE_ID)) return;

  const source = map.getSource(SOURCE_ID);
  const url = buildPagasaPanahonNwpRasterUrl({ forecastDate, layerType });

  if (source?.updateImage) {
    source.updateImage({
      url,
      coordinates: PAGASA_NWP_IMAGE_COORDINATES,
    });
  }
}