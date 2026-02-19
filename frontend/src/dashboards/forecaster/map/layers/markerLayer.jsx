export const saveMarker = (selectedPoint, mapRef, setShowTitleModal, type) => (title) => {
  if (!selectedPoint) return;

  const { lng, lat } = selectedPoint;

  const iconMap = {
    typhoon: 'typhoon',
    low_pressure: 'low_pressure',
    high_pressure: 'high_pressure',
    less_1: 'less_1'
  };

  const defaultTitles = {
    typhoon: 'Typhoon',
    low_pressure: 'LPA',
  };

  const markerType = type;
  const iconName = iconMap[markerType];
  const feature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    properties: {
      title: title || defaultTitles[markerType],
      markerType,
      icon: iconName,
    },
  };

  const map = mapRef.current;
  if (!map) return;

  const sourceId = `${markerType}_${title}`;
  const layerId = `${markerType}_${title}`;

  // ✅ Add source only if not exists
  if (!map.getSource(sourceId)) {
    try {
      map.addSource(sourceId, {
        type: 'geojson',
        data: feature,
      });
    } catch (error) {
      console.error(`❌ Failed to add source "${sourceId}":`, error);
    }
  }

  // 🔧 Layout
  const layout = {
    'icon-image': ['get', 'icon'],
    'icon-size': [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'], 0.015,
      ['==', ['get', 'markerType'], 'high_pressure'], 0.028,
      ['==', ['get', 'markerType'], 'less_1'], 0.28,
      0.03
    ],
    'icon-allow-overlap': true,
  };

  if (markerType !== 'less_1') {
    layout['text-field'] = ['get', 'title'];
    layout['text-font'] = ['Open Sans Semibold', 'Arial Unicode MS Bold'];
    layout['text-offset'] = [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'],
      [0, 1.0],
      [0, 1.25],
    ];
    layout['text-anchor'] = 'top';
    layout['text-allow-overlap'] = true;

    layout['text-size'] = [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'], 12,
      ['==', ['get', 'markerType'], 'high_pressure'], 12,
      10   // default size for typhoon or others
    ];
  }

  // 🎨 Paint
  const paint = {};
  if (markerType !== 'less_1') {
    paint['text-color'] = [
      'case',
      ['==', ['get', 'markerType'], 'low_pressure'], 'red',
      ['==', ['get', 'markerType'], 'high_pressure'], 'blue',
      'purple'
    ];
    paint['text-halo-color'] = '#FFFFFF';
    paint['text-halo-width'] = 1;
    paint['text-opacity'] = [
      'case',
      ['any',
        ['==', ['get', 'markerType'], 'low_pressure'],
        ['==', ['get', 'markerType'], 'high_pressure']
      ],
      0,   // fully transparent
      1    // visible for others (like typhoon, etc.)
    ];
  }

  // ✅ Add layer only if not exists
  if (!map.getLayer(layerId)) {
    try {
      map.addLayer({
        id: layerId,
        type: 'symbol',
        source: sourceId,
        slot: 'top',
        layout,
        paint,
      });
    } catch (error) {
      console.error(`❌ Failed to add layer "${layerId}":`, error);
    }
  }

  setShowTitleModal(false);
};