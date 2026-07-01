export function getLatestMapInstance(mapRef) {
  try {
    // 1. Direct Mapbox map instance
    if (mapRef && typeof mapRef.getStyle === 'function') {
      return mapRef;
    }

    // 2. React ref object: mapRef.current
    if (mapRef && typeof mapRef === 'object' && mapRef.current) {
      const currentMap = mapRef.current;
      if (currentMap && typeof currentMap.getStyle === 'function') {
        return currentMap;
      }
    }

    // 3. If a function was passed, for example a getter
    if (typeof mapRef === 'function') {
      const currentMap = mapRef();
      if (currentMap && typeof currentMap.getStyle === 'function') {
        return currentMap;
      }
    }

    // 4. Global cache fallback
    if (typeof window !== 'undefined' && window.__latestMap && typeof window.__latestMap.getStyle === 'function') {
      return window.__latestMap;
    }

    return null;
  } catch (err) {
    console.error('Error fetching latest map instance:', err);
    return null;
  }
}

export function registerMapInstance(map) {
  if (typeof window !== 'undefined' && map && typeof map.getStyle === 'function') {
    window.__latestMap = map;
  }
}
