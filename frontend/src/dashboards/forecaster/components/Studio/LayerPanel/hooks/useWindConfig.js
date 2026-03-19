import { useState, useEffect, useCallback, useRef } from 'react';
import { addWindSource, addWindLayer } from '@dashboards/forecaster/map/layers/windLayer';
import { WIND_ELEMENTS, WIND_MODELS, OFF_ELEMENTS } from '../constants/layerConstants';
import { normalizeModel } from './windConfig/windHelpers';
import { syncAllWindLayers } from './windConfig/windLayerSync';
import { useWindStorage } from './windConfig/useWindStorage';

const DEFAULT_BARB_STYLE = {
  size:    1.0,
  opacity: 0.5,
};

const INITIAL_STATE = {
  enabled:   false,
  models:    ['ECMWF'],
  elements:  OFF_ELEMENTS,
  barbStyle: DEFAULT_BARB_STYLE,
};

export const useWindConfig = ({ mapRef, isDarkMode }) => {
  const [windConfig, setWindConfig] = useState(INITIAL_STATE);

  const prevThemeRef = useRef(isDarkMode ? 'dark' : 'light');
  const prevModelRef = useRef(null);

  const { readWindStorage, saveEnabled, saveModels, saveElements, saveBarbStyle } = useWindStorage();

  const applyLayers = useCallback(
    (config) => syncAllWindLayers(mapRef.current, config, isDarkMode, prevThemeRef, prevModelRef),
    [mapRef, isDarkMode],
  );

  // ── Hydrate ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved    = readWindStorage();
    const hydrated = {
      ...INITIAL_STATE,
      ...saved,
      barbStyle: { ...DEFAULT_BARB_STYLE, ...saved.barbStyle },
    };
    setWindConfig(hydrated);

    if (mapRef.current && hydrated.enabled) {
      addWindSource(mapRef.current, isDarkMode, hydrated.models.join(',')).then(() =>
        addWindLayer(mapRef.current, isDarkMode).then(() => applyLayers(hydrated))
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dark-mode change ────────────────────────────────────────────────────────
  useEffect(() => {
    setWindConfig((prev) => {
      applyLayers(prev);
      return prev;
    });
  }, [isDarkMode, applyLayers]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const toggleWindLayer = useCallback(() => {
    setWindConfig((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      saveEnabled(next.enabled);

      if (!next.enabled) {
        applyLayers({ ...next, elements: OFF_ELEMENTS });
      } else {
        addWindSource(mapRef.current, isDarkMode, next.models.join(',')).then(() =>
          addWindLayer(mapRef.current, isDarkMode).then(() => applyLayers(next))
        );
      }
      return next;
    });
  }, [mapRef, isDarkMode, applyLayers, saveEnabled]);

  const setWindElement = useCallback((elementId) => {
    setWindConfig((prev) => {
      const elements = WIND_ELEMENTS.reduce(
        (acc, { id }) => ({ ...acc, [id]: id === elementId }),
        {},
      );
      const next = { ...prev, elements };
      saveElements(next.elements);
      applyLayers(next);
      return next;
    });
  }, [applyLayers, saveElements]);

  const toggleWindModel = useCallback((model) => {
    const meta = WIND_MODELS.find((m) => m.id === normalizeModel(model));
    if (!meta?.available) return;

    setWindConfig((prev) => {
      const normalized = normalizeModel(model);
      const models     = prev.models.includes(normalized)
        ? prev.models.filter((id) => id !== normalized)
        : [...prev.models, normalized];

      const next = { ...prev, models };
      saveModels(models);
      applyLayers(next);
      return next;
    });
  }, [applyLayers, saveModels]);

  // ── Barb style ───────────────────────────────────────────────────────────────
  const setWindBarbStyle = useCallback((patch) => {
    setWindConfig((prev) => {
      const next = { ...prev, barbStyle: { ...prev.barbStyle, ...patch } };
      saveBarbStyle(next.barbStyle);
      applyLayers(next);
      return next;
    });
  }, [applyLayers, saveBarbStyle]);

  return { windConfig, toggleWindLayer, setWindElement, toggleWindModel, setWindBarbStyle };
};