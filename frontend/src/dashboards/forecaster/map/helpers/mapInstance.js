export function getLatestMapInstance() {
  const mapRef = map
  try {
    // 1️⃣ Direct Mapbox map instance
    if (mapRef && typeof mapRef.getStyle === 'function') {
      return mapRef;
    }

    // 2️⃣ React ref object: mapRef.current
    if (mapRef && typeof mapRef === 'object' && mapRef.current) {
      const map = mapRef.current;
      if (map && typeof map.getStyle === 'function') {
        return map;
      }
    }

    // 3️⃣ If a function was passed (e.g. a getter)
    if (typeof mapRef === 'function') {
      const map = mapRef();
      if (map && typeof map.getStyle === 'function') {
        return map;
      }
    }

    // 4️⃣ Try global cache fallback (optional safety net)
    if (window.__latestMap && typeof window.__latestMap.getStyle === 'function') {
      return window.__latestMap;
    }

    console.warn('⚠️ No valid map instance found');
    return null;
  } catch (err) {
    console.error('❌ Error fetching latest map instance:', err);
    return null;
  }
}

export function registerMapInstance(map) {
  if (map && typeof map.getStyle === 'function') {
    window.__latestMap = map;
  }
}