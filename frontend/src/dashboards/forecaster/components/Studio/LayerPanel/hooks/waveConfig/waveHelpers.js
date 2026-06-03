import { BASE_SIZE_STOPS, WAVE_BUCKET_BASE, MRI3_TIMESTEP } from '@dashboards/forecaster/components/Studio/LayerPanel/constants/layerConstants';

// ── Model helpers ─────────────────────────────────────────────────────────────

export const normalizeModelName = (model = '') => model.trim().toUpperCase();

export const getSelectedModels = (models = []) =>
  [...new Set(models.map(normalizeModelName).filter(Boolean))];

// ── Tile URL builder ──────────────────────────────────────────────────────────

const TILE_URL_BUILDERS = {
  MRI3: ({ theme, date }) =>
    `${WAVE_BUCKET_BASE}/MRI3/${theme}/${date}/${MRI3_TIMESTEP}/{z}/{x}/{y}.png`,
  WW3: ({ theme }) =>
    `${WAVE_BUCKET_BASE}/WW3/${theme}/2026011200/{z}/{x}/{y}.png`,
  BMKG: () =>
    "https://peta-maritim.bmkg.go.id/api21/mpl_req/w3g_global/swh/0/202606020000/202606031200/{z}/{x}/{y}.png?ci=1&overlays=,contourf&conc=snow",
};

export const buildWaveTileUrl = ({ model, theme, date }) => {
  const m = normalizeModelName(model);
  const builder = TILE_URL_BUILDERS[m];
  return builder
    ? builder({ theme, date })
    : `${WAVE_BUCKET_BASE}/${m}/${theme}/${date}/{z}/{x}/{y}.png`;
};

// ── Icon size expression ──────────────────────────────────────────────────────

export const buildIconSize = (sizeMult = 1.0) => [
  'interpolate', ['linear'], ['get', 'waveHeight'],
  ...BASE_SIZE_STOPS.flatMap(([waveH, baseSize]) => [waveH, baseSize * sizeMult]),
];