const PAGASA_NWP_IMAGE_ENDPOINT = 'https://cdn.panahon.gov.ph/api/v1/nwp-image';

export const PAGASA_NWP_RASTER_STORAGE_KEY = 'PAGASA_NWP_RASTER';

const SOURCE_ID = 'pagasa-prate-raster';
const LAYER_ID = 'pagasa-prate-raster-layer';
const DEFAULT_LAYER_TYPE = 'prate';
const DEFAULT_OPACITY = 0.65;

export const PAGASA_NWP_IMAGE_COORDINATES = [
  [100, 40.047201],
  [160.004086, 40.047201],
  [160, -5],
  [100, -5],
];

const pad2 = (value) => String(value).padStart(2, '0');

const getToken = () => import.meta.env.VITE_PAGASA_PANAHON_TOKEN || '';

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
        hour: Number(match[4] ?? 0),
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

export function formatPanahonForecastDate(value) {
  const { year, month, day, hour } = readDateParts(value);
  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:00:00`;
}

export function getTodayInitDate() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}T00:00:00Z`;
}

export function buildPagasaPanahonNwpRasterUrl({
  initDate = getTodayInitDate(),
  forecastDate = new Date(),
  layerType = DEFAULT_LAYER_TYPE,
  token = getToken(),
} = {}) {
  const params = new URLSearchParams({
    url: layerType,
    token,
    t: formatPanahonForecastDate(forecastDate),
    model: 'undefined',
    init: initDate,
  });

  return `${PAGASA_NWP_IMAGE_ENDPOINT}?${params.toString()}`;
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
    forecastDate = new Date(),
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