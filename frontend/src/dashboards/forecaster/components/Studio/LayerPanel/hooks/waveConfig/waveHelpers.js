import { BASE_SIZE_STOPS, WAVE_BUCKET_BASE, MRI3_TIMESTEP } from '@dashboards/forecaster/components/Studio/LayerPanel/constants/layerConstants';
import { getCachedForecastPackageContext, resolveWW3ForecastRun } from './ww3ForecastRuns';

// ── Model helpers ─────────────────────────────────────────────────────────────

export const normalizeModelName = (model = '') => model.trim().toUpperCase();

export const getSelectedModels = (models = []) =>
  [...new Set(models.map(normalizeModelName).filter(Boolean))];

// ── Tile URL builder ──────────────────────────────────────────────────────────

const LOCAL_WW3_TILE_BASE = 'http://127.0.0.1:8081';

const TILE_URL_BUILDERS = {
  MRI3: ({ theme, date }) =>
    `${WAVE_BUCKET_BASE}/MRI3/${theme}/${date}/${MRI3_TIMESTEP}/{z}/{x}/{y}.png`,
  WW3: ({ theme, forecastDate, chartType }) => {
    const context = forecastDate || chartType
      ? { forecastDate, chartType }
      : getCachedForecastPackageContext();
    const { runTag } = resolveWW3ForecastRun(context);
    return `${LOCAL_WW3_TILE_BASE}/WW3/${theme}/${runTag}/{z}/{x}/{y}.png`;
  },
  BMKG: () =>
    "https://peta-maritim.bmkg.go.id/api21/mpl_req/w3g_global/swh/0/202606020000/202606031200/{z}/{x}/{y}.png?ci=1&overlays=,contourf&conc=snow",
};

export const buildWaveTileUrl = ({ model, theme, date, forecastDate, chartType }) => {
  const m = normalizeModelName(model);
  const builder = TILE_URL_BUILDERS[m];
  return builder
    ? builder({ theme, date, forecastDate, chartType })
    : `${WAVE_BUCKET_BASE}/${m}/${theme}/${date}/{z}/{x}/{y}.png`;
};

// ── Icon size expression ──────────────────────────────────────────────────────

export const buildIconSize = (sizeMult = 1.0) => [
  'interpolate', ['linear'], ['get', 'waveHeight'],
  ...BASE_SIZE_STOPS.flatMap(([waveH, baseSize]) => [waveH, baseSize * sizeMult]),
];
