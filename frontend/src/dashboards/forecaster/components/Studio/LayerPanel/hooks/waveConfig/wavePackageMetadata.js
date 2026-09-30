import { formatWW3PackageDate } from './ww3ForecastRuns';

const WW3_TILE_BASE = import.meta.env.VITE_WW3_TILE_BASE_URL?.replace(/\/$/, '') || '/wavetiles';
const ECWAM_TILE_BASE =
  import.meta.env.VITE_ECWAM_TILE_BASE_URL?.replace(/\/$/, '') || WW3_TILE_BASE;

const metadataCache = new Map();

const normalizeModel = (value = '') => String(value).trim().toUpperCase();

const metadataBaseForModel = (model) => (model === 'ECWAM' ? ECWAM_TILE_BASE : WW3_TILE_BASE);

export const fetchWavePackageMetadata = async ({ model, forecastDate } = {}) => {
  const normalizedModel = normalizeModel(model);
  if (!['WW3', 'ECWAM'].includes(normalizedModel)) {
    throw new Error(`Unsupported package metadata model: ${normalizedModel || 'unknown'}`);
  }

  const packageTag = formatWW3PackageDate(forecastDate);
  const cacheKey = `${normalizedModel}:${packageTag}`;
  const cached = metadataCache.get(cacheKey);
  if (cached) return cached;

  const url = `${metadataBaseForModel(normalizedModel)}/${normalizedModel}/contours/${packageTag}/package.json`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(
      `${normalizedModel} package metadata is unavailable for ${packageTag} (HTTP ${response.status}).`
    );
  }

  const metadata = await response.json();
  const sourceCycle = String(metadata?.sourceCycle || '');
  if (!/^\d{10}$/.test(sourceCycle)) {
    throw new Error(`${normalizedModel} package metadata has an invalid sourceCycle.`);
  }

  const normalized = {
    ...metadata,
    model: normalizedModel,
    packageTag,
    sourceCycle,
  };
  metadataCache.set(cacheKey, normalized);
  return normalized;
};

export const clearWavePackageMetadataCache = () => metadataCache.clear();
