import { useEffect, useMemo, useState } from 'react';

import { getSettings } from '@/api/siteSettings';

export const MAP_BOUNDS_PRESET = Object.freeze({
  TCAD: 'tcad',
  TCID: 'tcid',
  CUSTOM: 'custom',
});

export const TCAD_MAP_BOUNDS = Object.freeze([[93, 0], [153.8595159535438, 25]]);
export const TCID_MAP_BOUNDS = Object.freeze([[116, 4], [127, 22]]);

const LEGACY_PRESET_ALIASES = Object.freeze({
  philippinesRegional: MAP_BOUNDS_PRESET.TCID,
});

const DEFAULT_CUSTOM_BOUNDS = Object.freeze({
  westLng: 93,
  southLat: 0,
  eastLng: 153.8595159535438,
  northLat: 25,
});

const SETTINGS_UPDATED_EVENT = 'wavelab:settings-updated';

let cachedGeneralSettings = null;
let inFlightSettingsRequest = null;

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isValidLng(value) {
  return value >= -180 && value <= 180;
}

function isValidLat(value) {
  return value >= -85 && value <= 85;
}

export function normalizeMapBoundsPreset(value) {
  const preset = String(value || '').trim();
  const normalized = LEGACY_PRESET_ALIASES[preset] || preset;
  return Object.values(MAP_BOUNDS_PRESET).includes(normalized) ? normalized : MAP_BOUNDS_PRESET.TCAD;
}

export function getMapBoundsCenter(bounds) {
  const west = Number(bounds?.[0]?.[0]);
  const south = Number(bounds?.[0]?.[1]);
  const east = Number(bounds?.[1]?.[0]);
  const north = Number(bounds?.[1]?.[1]);

  if (![west, south, east, north].every(Number.isFinite)) return [120, 15.5];
  return [(west + east) / 2, (south + north) / 2];
}

export function getMapBoundsLabel(settings = {}) {
  const preset = normalizeMapBoundsPreset(settings.mapBoundsPreset);
  if (preset === MAP_BOUNDS_PRESET.TCID) return 'TCID bounds';
  if (preset === MAP_BOUNDS_PRESET.CUSTOM) {
    const name = String(settings.mapBoundsCustomName || settings.mapBoundsCustom?.name || '').trim();
    return name ? `${name} bounds` : 'Custom bounds';
  }
  return 'TCAD bounds';
}

export function resolvePublicMapBounds(settings = {}) {
  const preset = normalizeMapBoundsPreset(settings.mapBoundsPreset);

  if (preset === MAP_BOUNDS_PRESET.TCID) {
    return TCID_MAP_BOUNDS;
  }

  if (preset === MAP_BOUNDS_PRESET.CUSTOM) {
    const custom = settings.mapBoundsCustom || {};
    const westLng = toFiniteNumber(custom.westLng ?? settings.westLng ?? DEFAULT_CUSTOM_BOUNDS.westLng);
    const southLat = toFiniteNumber(custom.southLat ?? settings.southLat ?? DEFAULT_CUSTOM_BOUNDS.southLat);
    const eastLng = toFiniteNumber(custom.eastLng ?? settings.eastLng ?? DEFAULT_CUSTOM_BOUNDS.eastLng);
    const northLat = toFiniteNumber(custom.northLat ?? settings.northLat ?? DEFAULT_CUSTOM_BOUNDS.northLat);

    const valid = [westLng, southLat, eastLng, northLat].every((value) => value !== null)
      && isValidLng(westLng)
      && isValidLng(eastLng)
      && isValidLat(southLat)
      && isValidLat(northLat)
      && westLng < eastLng
      && southLat < northLat;

    if (valid) return [[westLng, southLat], [eastLng, northLat]];
  }

  return TCAD_MAP_BOUNDS;
}

async function loadGeneralSettings() {
  if (cachedGeneralSettings) return cachedGeneralSettings;
  if (!inFlightSettingsRequest) {
    inFlightSettingsRequest = getSettings('general')
      .then((settings) => {
        cachedGeneralSettings = settings || {};
        return cachedGeneralSettings;
      })
      .catch((error) => {
        console.warn('[usePublicMapBounds] Failed to load general settings:', error);
        cachedGeneralSettings = {};
        return cachedGeneralSettings;
      })
      .finally(() => {
        inFlightSettingsRequest = null;
      });
  }

  return inFlightSettingsRequest;
}

export function invalidatePublicMapBoundsCache(nextSettings = null) {
  cachedGeneralSettings = nextSettings || null;
}

export default function usePublicMapBounds() {
  const [settings, setSettings] = useState(cachedGeneralSettings || {});

  useEffect(() => {
    let mounted = true;

    loadGeneralSettings().then((data) => {
      if (mounted) setSettings(data || {});
    });

    const handleSettingsUpdated = (event) => {
      if (event?.detail?.key !== 'general') return;
      const nextSettings = event.detail.value || {};
      invalidatePublicMapBoundsCache(nextSettings);
      setSettings(nextSettings);
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);

    return () => {
      mounted = false;
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
    };
  }, []);

  return useMemo(() => ({
    bounds: resolvePublicMapBounds(settings),
    label: getMapBoundsLabel(settings),
    settings,
  }), [settings]);
}
