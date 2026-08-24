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

const resolveForecastContext = ({ forecastDate, chartType }) =>
  forecastDate || chartType ? { forecastDate, chartType } : getCachedForecastPackageContext();

const TILE_URL_BUILDERS = {
  MRI3: ({ theme, date }) =>
    `${WAVE_BUCKET_BASE}/MRI3/${theme}/${date}/${MRI3_TIMESTEP}/{z}/{x}/{y}.png`,
  WW3: ({ theme, forecastDate, chartType }) => {
    const { runTag } = resolveWW3ForecastRun(resolveForecastContext({ forecastDate, chartType }));
    return `${WW3_TILE_BASE}/WW3/${theme}/${runTag}/{z}/{x}/{y}.png`;
  },
  ECWAM: ({ theme, forecastDate, chartType }) => {
    const { runTag } = resolveECWAMForecastRun(
      resolveForecastContext({ forecastDate, chartType })
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

export const buildWaveTileUrl = ({ model, theme, date, forecastDate, chartType }) => {
  const m = normalizeModelName(model);
  const builder = TILE_URL_BUILDERS[m];
  return builder
    ? builder({ theme, date, forecastDate, chartType })
    : `${WAVE_BUCKET_BASE}/${m}/${theme}/${date}/{z}/{x}/{y}.png`;
};

const CONTOUR_URL_BUILDERS = {
  WW3: ({ forecastDate, chartType }) => {
    const { runTag } = resolveWW3ForecastRun(resolveForecastContext({ forecastDate, chartType }));
    return `${WW3_TILE_BASE}/WW3/contours/${runTag}/contours.geojson`;
  },
  ECWAM: ({ forecastDate, chartType }) => {
    const { runTag } = resolveECWAMForecastRun(
      resolveForecastContext({ forecastDate, chartType })
    );
    return `${ECWAM_TILE_BASE}/ECWAM/contours/${runTag}/contours.geojson`;
  },
};

export const buildWaveContourUrl = ({ model, forecastDate, chartType } = {}) => {
  const builder = CONTOUR_URL_BUILDERS[normalizeModelName(model)];
  return builder ? builder({ forecastDate, chartType }) : null;
};

export const buildWW3ContourUrl = ({ forecastDate, chartType } = {}) =>
  buildWaveContourUrl({ model: 'WW3', forecastDate, chartType });

export const buildECWAMContourUrl = ({ forecastDate, chartType } = {}) =>
  buildWaveContourUrl({ model: 'ECWAM', forecastDate, chartType });

// ── Icon size expression ──────────────────────────────────────────────────────

export const buildIconSize = (sizeMult = 1.0) => [
  'interpolate',
  ['linear'],
  ['get', 'waveHeight'],
  ...BASE_SIZE_STOPS.flatMap(([waveH, baseSize]) => [waveH, baseSize * sizeMult]),
];
