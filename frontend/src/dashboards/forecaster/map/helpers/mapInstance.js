const mapInstanceListeners = new Set();

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
    if (
      typeof window !== 'undefined' &&
      window.__latestMap &&
      typeof window.__latestMap.getStyle === 'function'
    ) {
      return window.__latestMap;
    }

    return null;
  } catch (err) {
    console.error('Error fetching latest map instance:', err);
    return null;
  }
}

export function subscribeToMapInstance(listener) {
  if (typeof listener !== 'function') return () => {};

  mapInstanceListeners.add(listener);
  listener(getLatestMapInstance());

  return () => {
    mapInstanceListeners.delete(listener);
  };
}

export function registerMapInstance(map) {
  let registeredMap = null;

  if (typeof window !== 'undefined') {
    if (map && typeof map.getStyle === 'function') {
      window.__latestMap = map;
      registeredMap = map;
    } else {
      delete window.__latestMap;
    }
  } else if (map && typeof map.getStyle === 'function') {
    registeredMap = map;
  }

  mapInstanceListeners.forEach((listener) => {
    try {
      listener(registeredMap);
    } catch (error) {
      console.error('Error notifying map instance listener:', error);
    }
  });
}
