function getIds(namespace) {
  return {
    source: `${namespace}-source`,
    fill: `${namespace}-fill`,
    line: `${namespace}-line`,
  };
}

function emptyCollection() {
  return { type: 'FeatureCollection', features: [] };
}

export function normalizePublishedDomainBoundary(settings = {}) {
  const source = settings?.publishedDomainBoundary || {};
  const geojson =
    source.geojson?.type === 'FeatureCollection' && Array.isArray(source.geojson.features)
      ? source.geojson
      : emptyCollection();

  return {
    enabled: source.enabled === true && geojson.features.length > 0,
    showLine: source.showLine !== false,
    showFill: source.showFill === true,
    clipAnnotations: source.clipAnnotations === true,
    lineColor: source.lineColor || '#0f172a',
    lineWidth: Number.isFinite(Number(source.lineWidth)) ? Number(source.lineWidth) : 2,
    lineOpacity: Number.isFinite(Number(source.lineOpacity))
      ? Number(source.lineOpacity)
      : 0.9,
    fillColor: source.fillColor || '#38bdf8',
    fillOpacity: Number.isFinite(Number(source.fillOpacity))
      ? Number(source.fillOpacity)
      : 0.08,
    geojson,
  };
}

export function getPublishedDomainBoundarySignature(settings = {}) {
  return JSON.stringify(normalizePublishedDomainBoundary(settings));
}

export function removePublishedDomainBoundary(map, namespace) {
  const ids = getIds(namespace);
  if (map.getLayer(ids.line)) map.removeLayer(ids.line);
  if (map.getLayer(ids.fill)) map.removeLayer(ids.fill);
  if (map.getSource(ids.source)) map.removeSource(ids.source);
}

export function syncPublishedDomainBoundary(map, settings, namespace) {
  const config = normalizePublishedDomainBoundary(settings);
  const ids = getIds(namespace);

  if (!config.enabled) {
    removePublishedDomainBoundary(map, namespace);
    return [];
  }

  if (map.getSource(ids.source)) {
    map.getSource(ids.source).setData(config.geojson);
  } else {
    map.addSource(ids.source, {
      type: 'geojson',
      data: config.geojson,
    });
  }

  if (config.showFill) {
    if (!map.getLayer(ids.fill)) {
      map.addLayer({
        id: ids.fill,
        type: 'fill',
        source: ids.source,
        paint: {
          'fill-color': config.fillColor,
          'fill-opacity': config.fillOpacity,
        },
      });
    } else {
      map.setPaintProperty(ids.fill, 'fill-color', config.fillColor);
      map.setPaintProperty(ids.fill, 'fill-opacity', config.fillOpacity);
      map.setLayoutProperty(ids.fill, 'visibility', 'visible');
    }
  } else if (map.getLayer(ids.fill)) {
    map.setLayoutProperty(ids.fill, 'visibility', 'none');
  }

  if (config.showLine) {
    if (!map.getLayer(ids.line)) {
      map.addLayer({
        id: ids.line,
        type: 'line',
        source: ids.source,
        paint: {
          'line-color': config.lineColor,
          'line-width': config.lineWidth,
          'line-opacity': config.lineOpacity,
        },
      });
    } else {
      map.setPaintProperty(ids.line, 'line-color', config.lineColor);
      map.setPaintProperty(ids.line, 'line-width', config.lineWidth);
      map.setPaintProperty(ids.line, 'line-opacity', config.lineOpacity);
      map.setLayoutProperty(ids.line, 'visibility', 'visible');
    }
  } else if (map.getLayer(ids.line)) {
    map.setLayoutProperty(ids.line, 'visibility', 'none');
  }

  return [ids.fill, ids.line];
}
