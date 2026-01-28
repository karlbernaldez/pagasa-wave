import { loadImage, loadCustomImages } from '@/components/pages/studio/map/helpers/imageLoader';
import { initDrawControl } from '@/components/pages/studio/map/controls/drawControl';
import { initTyphoonLayer } from '@/components/pages/studio/map/layers/typhoonLayer';
import { saveMarker } from '@/components/pages/studio/map/layers/markerLayer';
import { addHimawariLayer } from '@/components/pages/studio/map/layers/satelliteLayer';
import { addWindSource, addWindLayer } from '@/components/pages/studio/map/layers/windLayer';
import { addWaveSource, addWaveLayer } from '@/components/pages/studio/map/layers/waveLayer';

// === Constants ===
const MARKER_IMAGES = ['typhoon', 'low_pressure', 'high_pressure', 'less_1'];
const WIND_BARB_IMAGES = ['0kts', '5kts', '10kts', '15kts', '20kts', '25kts', '30kts'];
const WAVE_HEIGHT_THRESHOLD = 2;

const LAYER_VISIBILITY_CONFIG = [
  { key: 'PAR', ids: ['PAR', 'PAR_dash'] },
  { key: 'SATELLITE', ids: ['Satellite'] },
  { key: 'TCID', ids: ['TCID'] },
  { key: 'TCAD', ids: ['TCAD'] },
  {
    key: 'SHIPPING_ZONE',
    ids: [
      'SHIPPING_ZONE_OUTLINE',
      'SHIPPING_ZONE_LABELS',
    ]
  },
  {
    key: 'GRATICULES',
    ids: [
      'graticules',
      'graticules_blur',
    ]
  },
];

// === Geometry Helpers ===
const fixMalformedLineString = (coordinates) => {
  if (!Array.isArray(coordinates)) return coordinates;

  // Unwrap nested arrays: [[[coords]]] → [[coords]]
  if (
    coordinates.length === 1 &&
    Array.isArray(coordinates[0]) &&
    Array.isArray(coordinates[0][0])
  ) {
    return coordinates[0];
  }

  return coordinates;
};

const getValidCoordinates = (geometry) => {
  if (!geometry?.coordinates) return null;

  const coords = geometry.coordinates;
  if (!Array.isArray(coords) || coords.length === 0) return null;

  return coords;
};

// === Layer Visibility Manager ===
class LayerVisibilityManager {
  constructor(map) {
    this.map = map;
  }

  applyFromLocalStorage(config = LAYER_VISIBILITY_CONFIG) {
    config.forEach(({ key, ids }) => {
      const isVisible = localStorage.getItem(key) === 'true';
      const visibility = isVisible ? 'visible' : 'none';

      // console.log(
      //   `[LayerVisibilityManager] key="${key}", value=${isVisible}, visibility=${visibility}`
      // );

      ids.forEach(id => {
        if (this.map.getLayer(id)) {
          this.map.setLayoutProperty(id, 'visibility', visibility);
        }
      });
    });
  }
}

// === Feature Classification ===
class FeatureClassifier {
  constructor() {
    this.markerPoints = [];
    this.frontLines = [];
    this.nonFrontLines = [];
    this.totalLineCount = 0;
  }

  classify(featuresArray) {
    featuresArray.forEach(feature => this.processFeature(feature));
    return {
      markerPoints: this.markerPoints,
      frontLines: this.frontLines,
      nonFrontLines: this.nonFrontLines,
      totalLineCount: this.totalLineCount,
    };
  }

  processFeature(feature) {
    const type = feature.geometry?.type;

    switch (type) {
      case 'Point':
        this.markerPoints.push(feature);
        break;

      case 'Polygon':
        // Handle polygon directly via draw control
        this.addPolygonToDraw(feature);
        break;

      case 'LineString':
        this.processLineString(feature);
        break;

      default:
        console.warn('Unknown geometry type:', type);
    }
  }

  addPolygonToDraw(feature) {
    if (window.drawInstance) {
      window.drawInstance.add({
        type: 'Feature',
        geometry: feature.geometry,
        properties: feature.properties || {},
      });
    }
  }

  processLineString(feature) {
    this.totalLineCount++;

    // Fix malformed coordinates
    if (feature.geometry?.coordinates) {
      feature.geometry.coordinates = fixMalformedLineString(feature.geometry.coordinates);
    }

    // Classify as front or non-front
    if (feature.properties?.isFront) {
      this.frontLines.push(feature);
    } else {
      this.nonFrontLines.push(feature);
    }
  }
}

// === Marker Renderer ===
class MarkerRenderer {
  constructor(mapRef) {
    this.mapRef = mapRef;
  }

  renderAll(markerPoints) {
    markerPoints.forEach(point => this.renderPoint(point));
  }

  renderPoint(point) {
    const coords = getValidCoordinates(point.geometry);
    if (!coords) return;

    // Handle nested Point structure
    const [points] = coords;
    if (!Array.isArray(points) || points.length === 0) return;

    const [coordinates] = points;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return;

    const [lng, lat] = coordinates;
    const title = point.name || '';
    const markerType = point.properties?.type;

    if (lng !== undefined && lat !== undefined) {
      saveMarker({ lat, lng }, this.mapRef, () => { }, markerType)(title);
    }
  }
}

// === Line Renderer ===
class LineRenderer {
  constructor(map, theme) {
    this.map = map;
    this.lineColor = theme.lineColor;
    this.textColor = theme.textColor;
    this.isDarkMode = theme.isDarkMode;
  }

  renderNonFrontLines(nonFrontLines) {
    // Batch source/layer additions for better performance
    const batch = nonFrontLines.map(feature =>
      this.prepareNonFrontLine(feature)
    );

    batch.forEach(({ sources, layers }) => {
      sources.forEach(({ id, data }) => {
        if (!this.map.getSource(id)) {
          this.map.addSource(id, data);
        }
      });

      layers.forEach(layer => {
        if (!this.map.getLayer(layer.id)) {
          this.map.addLayer(layer);
        }
      });
    });
  }

  prepareNonFrontLine(feature) {
    const sourceId = feature.sourceId || `non-front-${feature._id || Date.now()}`;
    const sources = [];
    const layers = [];

    // Prepare main line
    const geojsonFeature = {
      type: 'Feature',
      geometry: feature.geometry,
      properties: feature.properties || {},
      id: feature._id,
    };

    const waveHeight = feature.properties?.labelValue || 0;
    const isDashed = waveHeight < WAVE_HEIGHT_THRESHOLD;

    sources.push({
      id: sourceId,
      data: { type: 'geojson', data: geojsonFeature },
    });

    layers.push({
      id: sourceId,
      type: 'line',
      source: sourceId,
      slot: 'top',
      paint: {
        'line-color': this.lineColor,
        'line-opacity': 0.5,
        'line-width': 3,
        'line-dasharray': isDashed ? [0.5, 0.5] : [],
      },
      filter: ['==', '$type', 'LineString'],
    });

    // Prepare labels
    const labelData = this.prepareLabelData(feature, sourceId);
    sources.push(...labelData.sources);
    layers.push(...labelData.layers);

    return { sources, layers };
  }

  prepareLabelData(feature, sourceId) {
    const coords = feature.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
      return { sources: [], layers: [] };
    }

    const props = feature.properties || {};
    const labelValue = String(props.labelValue || feature.name || 'Label');
    const closedMode = props.closedMode;

    const points = closedMode
      ? [coords[0]]
      : [coords[0], coords[coords.length - 1]];

    const sources = [];
    const layers = [];

    points.forEach((coord, i) => {
      const labelSourceId = `${sourceId}-${i}`;
      const labelLayerId = `${sourceId}-${i}`;

      sources.push({
        id: labelSourceId,
        data: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              id: `${feature._id}-${i}`,
              geometry: { type: 'Point', coordinates: coord },
              properties: { text: labelValue },
            }],
          },
        },
      });

      layers.push({
        id: labelLayerId,
        type: 'symbol',
        source: labelSourceId,
        slot: 'top',
        layout: {
          'text-field': ['get', 'text'],
          'text-size': 18,
          'text-anchor': 'bottom',
          'text-offset': [0, 0.5],
        },
        paint: {
          'text-color': this.textColor,
          'text-halo-width': 2,
          'text-halo-color': this.isDarkMode ? '#19b8b7' : '#ffffff',
        },
      });
    });

    return { sources, layers };
  }

  renderFrontLines(frontLines) {
    frontLines.forEach(feature => {
      const sourceId = feature.sourceId || `front-${feature._id || Date.now()}`;
      const bgLayerId = `${sourceId}_bg`;
      const dashLayerId = `${sourceId}_dash`;

      if (!this.map.getSource(sourceId)) {
        this.map.addSource(sourceId, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [feature] },
        });
      }

      if (!this.map.getLayer(bgLayerId)) {
        this.map.addLayer({
          id: bgLayerId,
          type: 'line',
          source: sourceId,
          slot: 'top',
          paint: {
            'line-color': '#0000FF',
            'line-width': 6,
            'line-opacity': 0.8,
          },
        });
      }

      if (!this.map.getLayer(dashLayerId)) {
        this.map.addLayer({
          id: dashLayerId,
          type: 'line',
          source: sourceId,
          slot: 'top',
          paint: {
            'line-color': '#FF0000',
            'line-width': 6,
            'line-dasharray': [0, 4, 3],
          },
        });
      }
    });
  }
}

// === Image Loader ===
class ImageLoader {
  constructor(map) {
    this.map = map;
    this.loadedImages = new Set();
  }

  async loadAll() {
    const imagePromises = [
      ...MARKER_IMAGES.map(id =>
        this.loadSingle(id, `/${id.replace('_', '')}.png`)
      ),
      ...WIND_BARB_IMAGES.map(id =>
        this.loadSingle(id, `/barbs/${id}.svg`)
      ),
    ];

    await Promise.allSettled(imagePromises);
  }

  async loadSingle(id, url) {
    if (this.loadedImages.has(id)) return;

    try {
      await loadImage(this.map, id, url);
      this.loadedImages.add(id);
    } catch (error) {
      console.warn(`Failed to load image ${id}:`, error);
    }
  }
}

// === Main Setup Function ===
export async function setupMap({
  mapRef,
  setDrawInstance,
  setMapLoaded,
  setSelectedPoint,
  setShowTitleModal,
  setLineCount,
  initialFeatures = [],
  logger,
  setLoading,
  selectedToolRef,
  setCapturedImages,
  isDarkMode,
}) {
  if (!map) {
    console.warn('No map instance provided');
    return () => { };
  }

  setLoading?.(true);

  // Initialize theme
  const theme = {
    lineColor: isDarkMode ? '#ffffff' : '#000000',
    textColor: isDarkMode ? '#ffffff' : '#000000',
    isDarkMode,
  };

  // Initialize draw control
  const draw = initDrawControl(map);
  window.drawInstance = draw; // Store globally for classifier
  setDrawInstance(draw);

  // Setup base layers
  addHimawariLayer(map);
  loadCustomImages(map);
  initTyphoonLayer(map);
  await addWindSource(map, isDarkMode);
  addWindLayer(map, isDarkMode);
  await addWaveSource(map, isDarkMode);
  addWaveLayer(map, isDarkMode);

  // Load images asynchronously
  const imageLoader = new ImageLoader(map);
  imageLoader.loadAll();

  // Process features
  const featuresArray = Array.isArray(initialFeatures)
    ? initialFeatures
    : initialFeatures?.features || [];

  const classifier = new FeatureClassifier();
  const { markerPoints, frontLines, nonFrontLines, totalLineCount } =
    classifier.classify(featuresArray);

  setLineCount?.(totalLineCount);

  // Render features
  const markerRenderer = new MarkerRenderer(mapRef);
  markerRenderer.renderAll(markerPoints);

  const lineRenderer = new LineRenderer(map, theme);
  lineRenderer.renderNonFrontLines(nonFrontLines);
  lineRenderer.renderFrontLines(frontLines);

  // Apply layer visibility
  const visibilityManager = new LayerVisibilityManager(map);
  visibilityManager.applyFromLocalStorage();

  // Setup draw event handler
  const handleDrawCreate = (e) => {
    const feature = e.features[0];

    if (feature?.geometry.type === 'Point') {
      const [lng, lat] = feature.geometry.coordinates;
      setSelectedPoint({ lng, lat });

      const selectedType = selectedToolRef?.current || '';

      if (selectedType.toLowerCase() !== 'less_1') {
        setShowTitleModal(true);
      }

      draw.delete(feature.id);
    }
  };

  map.on('draw.create', handleDrawCreate);

  // Handle map ready
  map.once('render', () => {
    setLoading?.(false);
    setMapLoaded(true);
    logger?.info('Map setup complete with initial features.');
  });

  // Return cleanup function
  return function cleanup() {
    map.off('draw.create', handleDrawCreate);
    delete window.drawInstance;
  };
}