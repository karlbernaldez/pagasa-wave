import { useCallback } from 'react';
import { WIND_ELEMENTS, STORAGE_KEYS } from '@dashboards/forecaster/components/Studio/LayerPanel/constants/layerConstants';
import { parseStoredModels, readBoolStorage } from '../../utils/layerPanelUtils';

const BARB_STYLE_KEY = 'WIND_BARB_STYLE';

const DEFAULT_BARB_STYLE = { size: 1.0, opacity: 0.5 };

// ── Reader ────────────────────────────────────────────────────────────────────

const readBarbStyle = () => {
  try {
    const raw = localStorage.getItem(BARB_STYLE_KEY);
    return raw ? { ...DEFAULT_BARB_STYLE, ...JSON.parse(raw) } : DEFAULT_BARB_STYLE;
  } catch {
    return DEFAULT_BARB_STYLE;
  }
};

export const readWindStorage = () => ({
  enabled:   readBoolStorage(STORAGE_KEYS.WIND_ENABLED),
  models:    parseStoredModels(localStorage.getItem(STORAGE_KEYS.WIND_MODEL), 'ECMWF'),
  elements: {
    particles: readBoolStorage('WIND_PARTICLES'),
    raster:    readBoolStorage('WIND_RASTER'),
    barbs:     readBoolStorage('WIND_BARBS'),
  },
  barbStyle: readBarbStyle(),
});

// ── Writers ───────────────────────────────────────────────────────────────────

export const persistWindEnabled = (enabled) =>
  localStorage.setItem(STORAGE_KEYS.WIND_ENABLED, String(enabled));

export const persistWindModels = (models) =>
  localStorage.setItem(STORAGE_KEYS.WIND_MODEL, models.length ? models.join(',') : 'NONE');

export const persistWindElements = (elements) =>
  WIND_ELEMENTS.forEach((opt) =>
    localStorage.setItem(opt.storageKey, String(elements[opt.id]))
  );

export const persistWindBarbStyle = (barbStyle) =>
  localStorage.setItem(BARB_STYLE_KEY, JSON.stringify(barbStyle));

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useWindStorage = () => ({
  readWindStorage,
  saveEnabled:   useCallback(persistWindEnabled,   []),
  saveModels:    useCallback(persistWindModels,    []),
  saveElements:  useCallback(persistWindElements,  []),
  saveBarbStyle: useCallback(persistWindBarbStyle, []),
});