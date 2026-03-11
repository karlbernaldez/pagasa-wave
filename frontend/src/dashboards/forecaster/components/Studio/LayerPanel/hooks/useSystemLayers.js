import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { readBoolStorage } from '../utils/layerPanelUtils';

/**
 * Manages domain, utility, and satellite layer state.
 * Reads initial values from localStorage, then applies them to the map once loaded.
 */
export const useSystemLayers = ({ mapRef, isDarkMode }) => {
  const [domainLayers, setDomainLayers] = useState({
    PAR: false, TCID: false, TCAD: false,
  });

  const [utilitiesLayers, setUtilitiesLayers] = useState({
    GRATICULES: false, SHIPPING_ZONE: false,
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

  // ── Hydrate from localStorage + apply to map ────────────────────────────────
  useEffect(() => {
    const saved = {
      domains: {
        PAR:  readBoolStorage('PAR'),
        TCID: readBoolStorage('TCID'),
        TCAD: readBoolStorage('TCAD'),
      },
      utilities: {
        GRATICULES:    readBoolStorage('GRATICULES'),
        SHIPPING_ZONE: readBoolStorage('SHIPPING_ZONE'),
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
      const vis = (v) => (v ? 'visible' : 'none');
      map.setLayoutProperty('PAR',      'visibility', vis(saved.domains.PAR));
      map.setLayoutProperty('PAR_dash', 'visibility', vis(saved.domains.PAR));
      map.setLayoutProperty('TCID',     'visibility', vis(saved.domains.TCID));
      map.setLayoutProperty('TCAD',     'visibility', vis(saved.domains.TCAD));

      // Utilities
      map.setLayoutProperty('graticules',        'visibility', vis(saved.utilities.GRATICULES));
      map.setLayoutProperty('graticules_blur',   'visibility', vis(saved.utilities.GRATICULES));
      map.setLayoutProperty('SHIPPING_ZONE_LABELS',  'visibility', vis(saved.utilities.SHIPPING_ZONE));
      map.setLayoutProperty('SHIPPING_ZONE_OUTLINE', 'visibility', vis(saved.utilities.SHIPPING_ZONE));

      // Satellite
      map.setLayoutProperty('Satellite', 'visibility', vis(saved.satellite));
    };

    map.isStyleLoaded() ? apply() : map.once('load', apply);
  }, [mapRef]);

  // ── Toggle handlers ─────────────────────────────────────────────────────────
  const toggleDomainLayer = (layerId) => {
    if (!checkProjectId()) return;
    setDomainLayers((prev) => {
      const next = { ...prev, [layerId]: !prev[layerId] };
      localStorage.setItem(layerId, String(next[layerId]));

      const map = mapRef.current;
      if (!map) return next;
      const vis = next[layerId] ? 'visible' : 'none';
      if (layerId === 'PAR') {
        map.setLayoutProperty('PAR',      'visibility', vis);
        map.setLayoutProperty('PAR_dash', 'visibility', vis);
      } else {
        map.setLayoutProperty(layerId, 'visibility', vis);
      }
      return next;
    });
  };

  const toggleUtilityLayer = (layerId) => {
    if (!checkProjectId()) return;
    setUtilitiesLayers((prev) => {
      const next = { ...prev, [layerId]: !prev[layerId] };
      localStorage.setItem(layerId, String(next[layerId]));

      const map = mapRef.current;
      if (!map) return next;
      const vis = next[layerId] ? 'visible' : 'none';
      if (layerId === 'GRATICULES') {
        map.setLayoutProperty('graticules',      'visibility', vis);
        map.setLayoutProperty('graticules_blur', 'visibility', vis);
      } else if (layerId === 'SHIPPING_ZONE') {
        map.setLayoutProperty('SHIPPING_ZONE_LABELS',  'visibility', vis);
        map.setLayoutProperty('SHIPPING_ZONE_OUTLINE', 'visibility', vis);
      }
      return next;
    });
  };

  const toggleSatelliteLayer = () => {
    if (!checkProjectId()) return;
    setSatelliteLayer((prev) => {
      const next = !prev;
      localStorage.setItem('SATELLITE', String(next));
      mapRef.current?.setLayoutProperty('Satellite', 'visibility', next ? 'visible' : 'none');
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