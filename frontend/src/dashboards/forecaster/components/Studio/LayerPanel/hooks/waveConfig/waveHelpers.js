import {
  BASE_SIZE_STOPS,
  WAVE_BUCKET_BASE,
  MRI3_TIMESTEP,
} from '@dashboards/forecaster/components/Studio/LayerPanel/constants/layerConstants';
import {
  getCachedForecastPackageContext,
  resolveBMKGForecastRun,
  resolveECWAMForecastRun,
  resolveWW3ForecastRun,
} from './ww3ForecastRuns';
import { resolveManagedWaveRun } from './waveModelRuntimeRegistry';

// ── Model helpers ─────────────────────────────────────────────────────────────

export const normalizeModelName = (model = '') => model.trim().toUpperCase();

export const getSelectedModels = (models = []) => [
  ...new Set(models.map(normalizeModelName).filter(Boolean)),
];

// ── Tile URL builder ──────────────────────────────────────────────────────────

const WW3_TILE_BASE = import.meta.env.VITE_WW3_TILE_BASE_URL?.replace(/\/$/, '') || '/wavetiles';
const ECWAM_TILE_BASE =
  import.meta.env.VITE_ECWAM_TILE_BASE_URL?.replace(/\/$/, '') || WW3_TILE_BASE;

const BMKG_TILE_BASE =
  import.meta.env.VITE_BMKG_TILE_BASE_URL?.replace(/\/$/, '') ||
  'https://peta-maritim.bmkg.go.id/api21/mpl_req/w3g_global/swh/0';

const resolveForecastContext = ({ forecastDate, chartType, forecastHour }) =>
  forecastDate || chartType || forecastHour !== undefined
    ? { forecastDate, chartType, forecastHour }
    : getCachedForecastPackageContext();

const TILE_URL_BUILDERS = {
  MRI3: ({ theme, date }) =>
    `${WAVE_BUCKET_BASE}/MRI3/${theme}/${date}/${MRI3_TIMESTEP}/{z}/{x}/{y}.png`,
  WW3: ({ theme, forecastDate, chartType, forecastHour }) => {
    const { runTag } = resolveWW3ForecastRun(
      resolveForecastContext({ forecastDate, chartType, forecastHour })
    );
    return `${WW3_TILE_BASE}/WW3/${theme}/${runTag}/{z}/{x}/{y}.png`;
  },
  ECWAM: ({ theme, forecastDate, chartType, forecastHour }) => {
    const { runTag } = resolveECWAMForecastRun(
      resolveForecastContext({ forecastDate, chartType, forecastHour })
    );
    return `${ECWAM_TILE_BASE}/ECWAM/${theme}/${runTag}/{z}/{x}/{y}.png`;
  },
  BMKG: ({ forecastDate, chartType }) => {
    const { modelRunDateTime, validDateTime } = resolveBMKGForecastRun(
      resolveForecastContext({ forecastDate, chartType })
    );
    return `${BMKG_TILE_BASE}/${modelRunDateTime}/${validDateTime}/{z}/{x}/{y}.png?ci=1&overlays=,contourf&conc=snow`;
  },
};

export const buildWaveTileUrl = ({ model, theme, date, forecastDate, chartType, forecastHour }) => {
  const m = normalizeModelName(model);
  const managedRun = resolveManagedWaveRun({
    model: m,
    ...resolveForecastContext({ forecastDate, chartType, forecastHour }),
  });
  if (managedRun) {
    return `${WW3_TILE_BASE}/${m}/${theme}/${managedRun.runTag}/{z}/{x}/{y}.png`;
  }

  const builder = TILE_URL_BUILDERS[m];
  return builder
    ? builder({ theme, date, forecastDate, chartType, forecastHour })
    : `${WAVE_BUCKET_BASE}/${m}/${theme}/${date}/{z}/{x}/{y}.png`;
};

const CONTOUR_URL_BUILDERS = {
  WW3: ({ forecastDate, chartType, forecastHour }) => {
    const { runTag } = resolveWW3ForecastRun(
      resolveForecastContext({ forecastDate, chartType, forecastHour })
    );
    return `${WW3_TILE_BASE}/WW3/contours/${runTag}/contours.geojson`;
  },
  ECWAM: ({ forecastDate, chartType, forecastHour }) => {
    const { runTag } = resolveECWAMForecastRun(
      resolveForecastContext({ forecastDate, chartType, forecastHour })
    );
    return `${ECWAM_TILE_BASE}/ECWAM/contours/${runTag}/contours.geojson`;
  },
};

export const buildWaveContourUrl = ({ model, forecastDate, chartType, forecastHour } = {}) => {
  const normalizedModel = normalizeModelName(model);
  const managedRun = resolveManagedWaveRun({
    model: normalizedModel,
    ...resolveForecastContext({ forecastDate, chartType, forecastHour }),
  });
  if (managedRun) {
    return managedRun.profile.contoursEnabled
      ? `${WW3_TILE_BASE}/${normalizedModel}/contours/${managedRun.runTag}/contours.geojson`
      : null;
  }

  const builder = CONTOUR_URL_BUILDERS[normalizedModel];
  return builder ? builder({ forecastDate, chartType, forecastHour }) : null;
};

export const buildWW3ContourUrl = ({ forecastDate, chartType, forecastHour } = {}) =>
  buildWaveContourUrl({ model: 'WW3', forecastDate, chartType, forecastHour });

export const buildECWAMContourUrl = ({ forecastDate, chartType, forecastHour } = {}) =>
  buildWaveContourUrl({ model: 'ECWAM', forecastDate, chartType, forecastHour });

// ── Icon size expression ──────────────────────────────────────────────────────

export const buildIconSize = (sizeMult = 1.0) => [
  'interpolate',
  ['linear'],
  ['get', 'waveHeight'],
  ...BASE_SIZE_STOPS.flatMap(([waveH, baseSize]) => [waveH, baseSize * sizeMult]),
];
