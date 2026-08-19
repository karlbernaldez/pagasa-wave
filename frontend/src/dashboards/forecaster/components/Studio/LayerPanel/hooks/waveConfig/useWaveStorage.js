import { STORAGE_KEYS, WAVE_ELEMENTS, DEFAULT_DIRECTION_STYLE } from '@dashboards/forecaster/components/Studio/LayerPanel/constants/layerConstants';
import { parseStoredModels, readBoolStorage } from '../../utils/layerPanelUtils';

// ── Readers ───────────────────────────────────────────────────────────────────

export const readWaveStorage = () => ({
  enabled: readBoolStorage(STORAGE_KEYS.WAVE_ENABLED),
  models:  parseStoredModels(localStorage.getItem(STORAGE_KEYS.WAVE_MODEL), 'WW3'),
  elements: {
    particles:    readBoolStorage('WAVE_PARTICLES'),
    raster:       readBoolStorage('WAVE_RASTER'),
    waveContours: readBoolStorage('WAVE_CONTOURS'),
    wavePeriod:   readBoolStorage('WAVE_PERIOD'),
  },
  directionStyle: (() => {
    try {
      return JSON.parse(localStorage.getItem('WAVE_DIRECTION_STYLE') || 'null') ?? DEFAULT_DIRECTION_STYLE;
    } catch {
      return DEFAULT_DIRECTION_STYLE;
    }
  })(),
});

// ── Writers ───────────────────────────────────────────────────────────────────

export const persistEnabled = (enabled) =>
  localStorage.setItem(STORAGE_KEYS.WAVE_ENABLED, String(enabled));

export const persistModels = (models) =>
  localStorage.setItem(STORAGE_KEYS.WAVE_MODEL, models.join(','));

export const persistElements = (elements) =>
  WAVE_ELEMENTS.forEach((opt) =>
    localStorage.setItem(opt.storageKey, String(elements[opt.id]))
  );

export const persistDirectionStyle = (style) =>
  localStorage.setItem('WAVE_DIRECTION_STYLE', JSON.stringify(style));

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useWaveStorage = () => ({
  readWaveStorage,
  saveEnabled: persistEnabled,
  saveModels: persistModels,
  saveElements: persistElements,
  saveDirectionStyle: persistDirectionStyle,
});
