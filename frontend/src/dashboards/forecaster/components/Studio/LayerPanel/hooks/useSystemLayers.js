import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { readBoolStorage } from '../utils/layerPanelUtils';
import {
  CYCLONE_TRACK_STORAGE_KEY,
  ensureCycloneTrackLayer,
  setCycloneTrackVisibility,
} from '@dashboards/forecaster/utils/layers/cycloneTrackLayer';
import {
  PAGASA_NWP_RASTER_STORAGE_KEY,
  ensurePagasaPanahonNwpRasterLayer,
  setPagasaPanahonNwpRasterVisibility,
  updatePagasaPanahonNwpRasterImage,
} from '@dashboards/forecaster/utils/layers/pagasaPanahonNwpRasterLayer';
import {
  ensureHimawariSatelliteLayer,
  setHimawariSatelliteVisibility,
} from '@dashboards/forecaster/map/layers/satelliteLayer';

const safeSetLayoutVisibility = (map, layerId, visible) => {
  if (map?.getLayer?.(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
};

/**
 * Manages domain, utility, and satellite layer state.
 * Reads initial values from localStorage, then applies them to the map once loaded.
 */
export const useSystemLayers = ({ mapRef, isDarkMode, forecastDate }) => {
  const [domainLayers, setDomainLayers] = useState({
    PAR: false, TCID: false, TCAD: false,
  });

  const [utilitiesLayers, setUtilitiesLayers] = useState({
    GRATICULES: false,
    SHIPPING_ZONE: false,
    PAGASA_NWP_RASTER: false,
    CYCLONE_TRACK: false,
  });

  const [satelliteLayer, setSatelliteLayer] = useState(false);

  // ── Project guard ───────────────────────────────────────────────────────────
  const checkProjectId = () => {
    if (localStorage.getItem('projectId')) return true;
    Swal.fire({
      toast: true, position: 'top-end', icon: 'warning',
      title: 'Please select or create a project first.',
      showConfirmButton: false, timer: 2000, timerProgressBar: true,
      background: isDarkMode ? '#374151' : '#fff',
      color: isDarkMode ? '#f3f4f6' : '#111827',
    });
    return false;
  };

  const showCycloneTrackError = (message = 'Unable to load PAGASA cyclone track.') => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 2600,
      timerProgressBar: true,
      background: isDarkMode ? '#374151' : '#fff',
      color: isDarkMode ? '#f3f4f6' : '#111827',
    });
  };

  const showPagasaNwpRasterError = (message = 'Unable to load PAGASA NWP raster.') => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 2600,
      timerProgressBar: true,
      background: isDarkMode ? '#374151' : '#fff',
      color: isDarkMode ? '#f3f4f6' : '#111827',
    });
  };

  const showSatelliteError = (message = 'Unable to load Himawari satellite.') => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 2600,
      timerProgressBar: true,
      background: isDarkMode ? '#374151' : '#fff',
      color: isDarkMode ? '#f3f4f6' : '#111827',
    });
  };

  // ── Hydrate from localStorage + apply to map ────────────────────────────────
  useEffect(() => {
    const saved = {
      domains: {
        PAR:  readBoolStorage('PAR'),
        TCID: readBoolStorage('TCID'),
        TCAD: readBoolStorage('TCAD'),
      },
      utilities: {
        GRATICULES:         readBoolStorage('GRATICULES'),
        SHIPPING_ZONE:      readBoolStorage('SHIPPING_ZONE'),
        PAGASA_NWP_RASTER:  readBoolStorage(PAGASA_NWP_RASTER_STORAGE_KEY),
        CYCLONE_TRACK:      readBoolStorage(CYCLONE_TRACK_STORAGE_KEY),
      },
      satellite: readBoolStorage('SATELLITE'),
    };

    setDomainLayers(saved.domains);
    setUtilitiesLayers(saved.utilities);
    setSatelliteLayer(saved.satellite);

    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      // Domains
      safeSetLayoutVisibility(map, 'PAR', saved.domains.PAR);
      safeSetLayoutVisibility(map, 'PAR_dash', saved.domains.PAR);
      safeSetLayoutVisibility(map, 'TCID', saved.domains.TCID);
      safeSetLayoutVisibility(map, 'TCAD', saved.domains.TCAD);

      // Utilities
      safeSetLayoutVisibility(map, 'graticules', saved.utilities.GRATICULES);
      safeSetLayoutVisibility(map, 'graticules_blur', saved.utilities.GRATICULES);
      safeSetLayoutVisibility(map, 'SHIPPING_ZONE_LABELS', saved.utilities.SHIPPING_ZONE);
      safeSetLayoutVisibility(map, 'SHIPPING_ZONE_OUTLINE', saved.utilities.SHIPPING_ZONE);

      if (saved.utilities.PAGASA_NWP_RASTER) {
        try {
          ensurePagasaPanahonNwpRasterLayer(map, { visible: true, forecastDate });
        } catch (error) {
          console.error('[pagasa-nwp-raster-layer-error]', error);
          localStorage.setItem(PAGASA_NWP_RASTER_STORAGE_KEY, 'false');
          setUtilitiesLayers((prev) => ({ ...prev, PAGASA_NWP_RASTER: false }));
          setPagasaPanahonNwpRasterVisibility(map, false);
        }
      } else {
        setPagasaPanahonNwpRasterVisibility(map, false);
      }

      if (saved.utilities.CYCLONE_TRACK) {
        ensureCycloneTrackLayer(map, true).catch(() => {
          localStorage.setItem(CYCLONE_TRACK_STORAGE_KEY, 'false');
          setUtilitiesLayers((prev) => ({ ...prev, CYCLONE_TRACK: false }));
        });
      } else {
        setCycloneTrackVisibility(map, false);
      }

      // Satellite
      try {
        ensureHimawariSatelliteLayer(map, { visible: saved.satellite });
      } catch (error) {
        console.error('[himawari-satellite-layer-error]', error);
        localStorage.setItem('SATELLITE', 'false');
        setSatelliteLayer(false);
        setHimawariSatelliteVisibility(map, false);
      }
    };

    map.isStyleLoaded() ? apply() : map.once('load', apply);
  }, [mapRef]);

  useEffect(() => {
    if (!utilitiesLayers.PAGASA_NWP_RASTER) return;
    const map = mapRef.current;
    if (!map) return;

    try {
      updatePagasaPanahonNwpRasterImage(map, forecastDate);
    } catch (error) {
      console.error('[pagasa-nwp-raster-update-error]', error);
      showPagasaNwpRasterError(error?.message || 'Unable to update PAGASA NWP raster.');
    }
  }, [forecastDate, mapRef, utilitiesLayers.PAGASA_NWP_RASTER]);

  // ── Toggle handlers ─────────────────────────────────────────────────────────
  const toggleDomainLayer = (layerId) => {
    if (!checkProjectId()) return;
    setDomainLayers((prev) => {
      const next = { ...prev, [layerId]: !prev[layerId] };
      localStorage.setItem(layerId, String(next[layerId]));

      const map = mapRef.current;
      if (!map) return next;
      if (layerId === 'PAR') {
        safeSetLayoutVisibility(map, 'PAR', next[layerId]);
        safeSetLayoutVisibility(map, 'PAR_dash', next[layerId]);
      } else {
        safeSetLayoutVisibility(map, layerId, next[layerId]);
      }
      return next;
    });
  };

  const toggleCycloneTrackLayer = async () => {
    const nextEnabled = !utilitiesLayers.CYCLONE_TRACK;
    localStorage.setItem(CYCLONE_TRACK_STORAGE_KEY, String(nextEnabled));
    setUtilitiesLayers((prev) => ({ ...prev, CYCLONE_TRACK: nextEnabled }));

    const map = mapRef.current;
    if (!map) return;

    try {
      if (nextEnabled) {
        await ensureCycloneTrackLayer(map, true);
      } else {
        setCycloneTrackVisibility(map, false);
      }
    } catch (error) {
      console.error('[cyclone-track-layer-error]', error);
      localStorage.setItem(CYCLONE_TRACK_STORAGE_KEY, 'false');
      setUtilitiesLayers((prev) => ({ ...prev, CYCLONE_TRACK: false }));
      setCycloneTrackVisibility(map, false);
      showCycloneTrackError(error?.message || 'Unable to load PAGASA cyclone track.');
    }
  };

  const togglePagasaNwpRasterLayer = () => {
    const nextEnabled = !utilitiesLayers.PAGASA_NWP_RASTER;
    localStorage.setItem(PAGASA_NWP_RASTER_STORAGE_KEY, String(nextEnabled));
    setUtilitiesLayers((prev) => ({ ...prev, PAGASA_NWP_RASTER: nextEnabled }));

    const map = mapRef.current;
    if (!map) return;

    try {
      if (nextEnabled) {
        ensurePagasaPanahonNwpRasterLayer(map, { visible: true, forecastDate });
      } else {
        setPagasaPanahonNwpRasterVisibility(map, false);
      }
    } catch (error) {
      console.error('[pagasa-nwp-raster-layer-error]', error);
      localStorage.setItem(PAGASA_NWP_RASTER_STORAGE_KEY, 'false');
      setUtilitiesLayers((prev) => ({ ...prev, PAGASA_NWP_RASTER: false }));
      setPagasaPanahonNwpRasterVisibility(map, false);
      showPagasaNwpRasterError(error?.message || 'Unable to load PAGASA NWP raster.');
    }
  };

  const toggleUtilityLayer = (layerId) => {
    if (!checkProjectId()) return;
    if (layerId === PAGASA_NWP_RASTER_STORAGE_KEY) {
      togglePagasaNwpRasterLayer();
      return;
    }
    if (layerId === CYCLONE_TRACK_STORAGE_KEY) {
      toggleCycloneTrackLayer();
      return;
    }

    setUtilitiesLayers((prev) => {
      const next = { ...prev, [layerId]: !prev[layerId] };
      localStorage.setItem(layerId, String(next[layerId]));

      const map = mapRef.current;
      if (!map) return next;
      if (layerId === 'GRATICULES') {
        safeSetLayoutVisibility(map, 'graticules', next[layerId]);
        safeSetLayoutVisibility(map, 'graticules_blur', next[layerId]);
      } else if (layerId === 'SHIPPING_ZONE') {
        safeSetLayoutVisibility(map, 'SHIPPING_ZONE_LABELS', next[layerId]);
        safeSetLayoutVisibility(map, 'SHIPPING_ZONE_OUTLINE', next[layerId]);
      }
      return next;
    });
  };

  const toggleSatelliteLayer = () => {
    if (!checkProjectId()) return;
    setSatelliteLayer((prev) => {
      const next = !prev;
      localStorage.setItem('SATELLITE', String(next));
      const map = mapRef.current;
      if (!map) return next;

      try {
        if (next) {
          ensureHimawariSatelliteLayer(map, { visible: true });
        } else {
          setHimawariSatelliteVisibility(map, false);
        }
      } catch (error) {
        console.error('[himawari-satellite-layer-error]', error);
        localStorage.setItem('SATELLITE', 'false');
        setHimawariSatelliteVisibility(map, false);
        showSatelliteError(error?.message || 'Unable to load Himawari satellite.');
        return false;
      }

      return next;
    });
  };

  // ── Derived count ───────────────────────────────────────────────────────────
  const activeCount =
    Object.values(domainLayers).filter(Boolean).length +
    Object.values(utilitiesLayers).filter(Boolean).length +
    (satelliteLayer ? 1 : 0);

  return {
    domainLayers,
    utilitiesLayers,
    satelliteLayer,
    activeCount,
    toggleDomainLayer,
    toggleUtilityLayer,
    toggleSatelliteLayer,
  };
};
