import { useState, useEffect, useCallback } from 'react';
import { addWindLayer } from '@dashboards/forecaster/map/layers/windLayer';
import { WIND_ELEMENTS, STORAGE_KEYS } from '../constants/layerConstants';
import { parseStoredModels, readBoolStorage } from '../utils/layerPanelUtils';

const OFF_ELEMENTS = { particles: false, raster: false, barbs: false };

const applyWindLayers = (mapRef, elements) => {
  const map = mapRef.current;
  if (!map) return;
  const vis = (v) => (v ? 'visible' : 'none');

  map.setLayoutProperty('wind-particles', 'visibility', vis(elements.particles));
  map.setLayoutProperty('wind-raster',    'visibility', vis(elements.raster));
  map.setLayoutProperty('wind-arrows',    'visibility', vis(elements.barbs));
  map.setLayoutProperty('wind-labels',    'visibility', vis(elements.barbs));

  const showBase = elements.particles || elements.raster || elements.barbs;
  map.setLayoutProperty('glass-fill',  'visibility', vis(showBase));
  map.setLayoutProperty('glass-stroke','visibility', vis(showBase));
  map.setLayoutProperty('glass-depth', 'visibility', vis(showBase));
};

/**
 * Manages wind layer configuration state and all map side-effects.
 * Initialises from localStorage on mount.
 */
export const useWindConfig = ({ mapRef, isDarkMode }) => {
  const [windConfig, setWindConfig] = useState({
    enabled:  false,
    models:   ['ECMWF'],
    elements: OFF_ELEMENTS,
  });

  // ── Hydrate from localStorage ───────────────────────────────────────────────
  useEffect(() => {
    const saved = {
      enabled:  readBoolStorage(STORAGE_KEYS.WIND_ENABLED),
      models:   parseStoredModels(localStorage.getItem(STORAGE_KEYS.WIND_MODEL), 'ECMWF'),
      elements: {
        particles: readBoolStorage('WIND_PARTICLES'),
        raster:    readBoolStorage('WIND_RASTER'),
        barbs:     readBoolStorage('WIND_BARBS'),
      },
    };
    setWindConfig(saved);
    // Map apply happens in the parent's combined init effect (useSystemLayers)
  }, []);

  // ── Toggle enabled ──────────────────────────────────────────────────────────
  const toggleWindLayer = useCallback(() => {
    setWindConfig((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      localStorage.setItem(STORAGE_KEYS.WIND_ENABLED, String(next.enabled));

      if (!next.enabled) {
        applyWindLayers(mapRef, OFF_ELEMENTS);
      } else {
        applyWindLayers(mapRef, next.elements);
        addWindLayer(mapRef.current, isDarkMode);
      }
      return next;
    });
  }, [mapRef, isDarkMode]);

  // ── Select element (single-select radio behaviour) ──────────────────────────
  const setWindElement = useCallback((elementId) => {
    setWindConfig((prev) => {
      const updatedElements = WIND_ELEMENTS.reduce((acc, opt) => ({
        ...acc,
        [opt.id]: opt.id === elementId,
      }), {});

      const next = { ...prev, elements: updatedElements };
      WIND_ELEMENTS.forEach((opt) =>
        localStorage.setItem(opt.storageKey, String(next.elements[opt.id]))
      );
      applyWindLayers(mapRef, next.elements);
      return next;
    });
  }, [mapRef]);

  // ── Toggle model (multi-select) ─────────────────────────────────────────────
  const toggleWindModel = useCallback((model) => {
    setWindConfig((prev) => {
      const models = prev.models.includes(model)
        ? prev.models.filter((id) => id !== model)
        : [...prev.models, model];

      localStorage.setItem(STORAGE_KEYS.WIND_MODEL, models.join(','));
      return { ...prev, models };
    });
  }, []);

  return { windConfig, toggleWindLayer, setWindElement, toggleWindModel };
};