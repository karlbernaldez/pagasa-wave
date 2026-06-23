import { loadImage, loadCustomImages } from '@dashboards/forecaster/map/helpers/imageLoader';
import { initDrawControl } from '@dashboards/forecaster/map/controls/drawControl';
import { initTyphoonLayer } from '@dashboards/forecaster//map/layers/typhoonLayer';
import { saveMarker, removeMarkerDrag } from '@dashboards/forecaster/map/layers/markerLayer';
import { addHimawariLayer } from '@dashboards/forecaster/map/layers/satelliteLayer';
import { addWindSource, addWindLayer } from '@dashboards/forecaster/map/layers/windLayer';
import { setGlobalMapLoaded, setGlobalSourceIds } from '@dashboards/forecaster/map/helpers/mapGlobalState';

const MARKER_IMAGES = ['typhoon', 'low_pressure', 'high_pressure', 'less_1'];
const MARKER_TYPES = ['typhoon', 'low_pressure', 'high_pressure', 'less_1', 'text_note'];
const WIND_BARB_IMAGES = ['0kts', '5kts', '10kts', '15kts', '20kts', '25kts', '30kts'];
const WAVE_HEIGHT_THRESHOLD = 2;
const renderedAnnotationIds = new Set();
const LAYER_VISIBILITY_CONFIG = [{ key: 'PAR', ids: ['PAR', 'PAR_dash'] }, { key: 'SATELLITE', ids: ['Satellite'] }, { key: 'TCID', ids: ['TCID'] }, { key: 'TCAD', ids: ['TCAD'] }, { key: 'SHIPPING_ZONE', ids: ['SHIPPING_ZONE_OUTLINE', 'SHIPPING_ZONE_LABELS'] }, { key: 'GRATICULES', ids: ['graticules', 'graticules_blur'] }];

const FRONT_STYLES = {
  cold: { color: '#1d4ed8', lineWidth: 3.5, imageId: 'surface-front-cold' },
  warm: { color: '#ef4444', lineWidth: 3.5, imageId: 'surface-front-warm' },
  stationary: { color: '#64748b', lineWidth: 2.5, imageId: 'surface-front-stationary' },
  occluded: { color: '#7c3aed', lineWidth: 3.5, imageId: 'surface-front-occluded' },
};

function getFeatureFrontType(feature) {
  const props = feature?.properties || {};
  const rawType = String(props.frontType || props.front_type || feature?.frontType || '').toLowerCase();
  if (FRONT_STYLES[rawType]) return rawType;
  const name = `${feature?.name || ''} ${props.name || ''} ${props.title || ''}`.toLowerCase();
  if (name.includes('warm')) return 'warm';
  if (name.includes('stationary')) return 'stationary';
  if (name.includes('occluded')) return 'occluded';
  if (name.includes('cold')) return 'cold';
  return 'cold';
}

const drawTriangle = (ctx, x, y, size, color, side = -1) => {
  ctx.beginPath();
  ctx.moveTo(x - size / 2, y);
  ctx.lineTo(x + size / 2, y);
  ctx.lineTo(x, y + side * size);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
};
const drawSemiCircle = (ctx, x, y, radius, color, side = -1) => {
  ctx.beginPath();
  ctx.moveTo(x - radius, y);
  ctx.arc(x, y, radius, Math.PI, 0, side > 0);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
};
const createFrontIconCanvas = (frontType) => {
  const pixelRatio = 2;
  const width = 72;
  const height = 34;
  const canvas = document.createElement('canvas');
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(pixelRatio, pixelRatio);
  const baseline = height / 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (frontType === 'cold') drawTriangle(ctx, 36, baseline, 14, '#1d4ed8', -1);
  else if (frontType === 'warm') drawSemiCircle(ctx, 36, baseline, 10, '#ef4444', -1);
  else if (frontType === 'stationary') { drawSemiCircle(ctx, 24, baseline, 9, '#ef4444', -1); drawTriangle(ctx, 50, baseline, 13, '#1d4ed8', 1); }
  else if (frontType === 'occluded') { drawSemiCircle(ctx, 24, baseline, 9, '#7c3aed', -1); drawTriangle(ctx, 50, baseline, 13, '#7c3aed', -1); }
  return canvas;
};
function ensureSurfaceFrontImages(map) {
  if (typeof document === 'undefined' || !map?.addImage) return;
  Object.entries(FRONT_STYLES).forEach(([frontType, style]) => {
    if (map.hasImage?.(style.imageId)) return;
    map.addImage(style.imageId, createFrontIconCanvas(frontType), { pixelRatio: 2 });
  });
}

const fixMalformedLineString = (coordinates) => { if (!Array.isArray(coordinates)) return coordinates; if (coordinates.length === 1 && Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) return coordinates[0]; return coordinates; };
const getValidCoordinates = (geometry) => { const coords = geometry?.coordinates; if (!Array.isArray(coords) || coords.length === 0) return null; return coords; };
const markerLayerId = (feature) => { const props = feature?.properties || {}; const markerType = props.markerType || props.type; const name = feature?.name || props.name || props.title || props.labelValue; if (!MARKER_TYPES.includes(markerType) || !name) return null; return props.mapLayerId || `${markerType}_${name}`; };
const getAnnotationArtifactIds = (feature) => { const props = feature?.properties || {}; return Array.from(new Set([feature?.sourceId, props.sourceId, props.stableId, props.annotationId, props.mapLayerId, markerLayerId(feature)].filter(Boolean))); };
const waitForMapStyle = (map) => new Promise((resolve) => { if (!map || map.isStyleLoaded?.()) return resolve(); const done = () => resolve(); map.once?.('style.load', done); map.once?.('load', done); window.setTimeout(done, 750); });
function safeRemoveLayer(map, id) { if (id && map.getLayer(id)) map.removeLayer(id); }
function safeRemoveSource(map, id) { if (id && map.getSource(id)) map.removeSource(id); }
function removeAnnotationArtifacts(map, id) { ['', '-0', '-1', '_bg', '_dash', '_secondary', '_triangles', '_circles', '_frontSymbols'].forEach((suffix) => safeRemoveLayer(map, `${id}${suffix}`)); ['', '-0', '-1'].forEach((suffix) => safeRemoveSource(map, `${id}${suffix}`)); removeMarkerDrag(id); }
function pruneStaleAnnotationArtifacts(map, currentFeatures) { const currentIds = new Set(currentFeatures.flatMap(getAnnotationArtifactIds)); Array.from(renderedAnnotationIds).forEach((id) => { if (!currentIds.has(id)) { removeAnnotationArtifacts(map, id); renderedAnnotationIds.delete(id); } }); currentIds.forEach((id) => renderedAnnotationIds.add(id)); }
function finishMapSetup({ setLoading, setMapLoaded, logger }) { setLoading?.(false); setMapLoaded?.(true); setGlobalMapLoaded(true); logger?.info('Map setup complete with initial features.'); }
class LayerVisibilityManager { constructor(map) { this.map = map; } applyFromLocalStorage(config = LAYER_VISIBILITY_CONFIG) { config.forEach(({ key, ids }) => { const visibility = localStorage.getItem(key) === 'true' ? 'visible' : 'none'; ids.forEach(id => { if (this.map.getLayer(id)) this.map.setLayoutProperty(id, 'visibility', visibility); }); }); } }
class FeatureClassifier { constructor() { this.markerPoints = []; this.frontLines = []; this.nonFrontLines = []; this.totalLineCount = 0; } classify(featuresArray) { featuresArray.forEach(feature => this.processFeature(feature)); return { markerPoints: this.markerPoints, frontLines: this.frontLines, nonFrontLines: this.nonFrontLines, totalLineCount: this.totalLineCount }; } processFeature(feature) { const type = feature.geometry?.type; if (type === 'Point') this.markerPoints.push(feature); else if (type === 'Polygon') this.addPolygonToDraw(feature); else if (type === 'LineString') this.processLineString(feature); else console.warn('Unknown geometry type:', type); } addPolygonToDraw(feature) { if (window.drawInstance) window.drawInstance.add({ type: 'Feature', geometry: feature.geometry, properties: feature.properties || {} }); } processLineString(feature) { this.totalLineCount++; if (feature.geometry?.coordinates) feature.geometry.coordinates = fixMalformedLineString(feature.geometry.coordinates); if (feature.properties?.isFront) this.frontLines.push(feature); else this.nonFrontLines.push(feature); } }
class MarkerRenderer { constructor(mapRef) { this.mapRef = mapRef; } renderAll(markerPoints) { markerPoints.forEach(point => this.renderPoint(point)); } renderPoint(point) { const coords = getValidCoordinates(point.geometry); if (!coords) return; let lng, lat; if (typeof coords[0] === 'number') [lng, lat] = coords; else if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') [lng, lat] = coords[0]; else if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) [lng, lat] = coords[0][0]; if (lng === undefined || lat === undefined) return; const props = point.properties || {}; saveMarker({ lat, lng }, this.mapRef, () => { }, props.markerType || props.type)(point.name || props.name || props.title || ''); } }
class LineRenderer {
  constructor(map, theme) { this.map = map; this.lineColor = theme.lineColor; this.textColor = theme.textColor; this.isDarkMode = theme.isDarkMode; }
  upsertSource(id, data) { if (this.map.getSource(id)) this.map.getSource(id).setData(data.data || data); else this.map.addSource(id, data); }
  upsertLayer(layer) { if (!this.map.getLayer(layer.id)) this.map.addLayer(layer); if (this.map.getLayer(layer.id)) this.map.setLayoutProperty(layer.id, 'visibility', 'visible'); }
  renderNonFrontLines(nonFrontLines) { nonFrontLines.map(feature => this.prepareNonFrontLine(feature)).forEach(({ sources, layers }) => { sources.forEach(({ id, data }) => this.upsertSource(id, data)); layers.forEach(layer => this.upsertLayer(layer)); }); }
  prepareNonFrontLine(feature) { const sourceId = feature.sourceId || feature.properties?.sourceId || `non-front-${feature._id || Date.now()}`; const geojsonFeature = { type: 'Feature', geometry: feature.geometry, properties: feature.properties || {}, id: feature._id }; const waveHeight = Number(feature.properties?.labelValue || 0); const linePaint = { 'line-color': this.lineColor, 'line-opacity': 0.6, 'line-width': 3, 'line-blur': 0.3 }; if (waveHeight < WAVE_HEIGHT_THRESHOLD) linePaint['line-dasharray'] = [0.5, 0.5]; const sources = [{ id: sourceId, data: { type: 'geojson', data: geojsonFeature } }]; const layers = [{ id: sourceId, type: 'line', source: sourceId, slot: 'top', layout: { 'line-join': 'round', 'line-cap': 'round', visibility: 'visible' }, paint: linePaint, filter: ['==', '$type', 'LineString'] }]; const labelData = this.prepareLabelData(feature, sourceId); return { sources: [...sources, ...labelData.sources], layers: [...layers, ...labelData.layers] }; }
  prepareLabelData(feature, sourceId) { const coords = feature.geometry?.coordinates; if (!Array.isArray(coords) || coords.length < 2) return { sources: [], layers: [] }; const props = feature.properties || {}; const labelValue = String(props.labelValue || feature.name || 'Label'); const points = props.closedMode ? [coords[0]] : [coords[0], coords[coords.length - 1]]; const sources = []; const layers = []; points.forEach((coord, i) => { sources.push({ id: `${sourceId}-${i}`, data: { type: 'geojson', data: { type: 'FeatureCollection', features: [{ type: 'Feature', id: `${feature._id}-${i}`, geometry: { type: 'Point', coordinates: coord }, properties: { text: labelValue } }] } } }); layers.push({ id: `${sourceId}-${i}`, type: 'symbol', source: `${sourceId}-${i}`, slot: 'top', layout: { 'text-field': ['get', 'text'], 'text-size': 18, 'text-anchor': 'bottom', 'text-offset': [0, 0.5], visibility: 'visible' }, paint: { 'text-color': this.textColor, 'text-halo-width': 2, 'text-halo-color': this.isDarkMode ? '#19b8b7' : '#ffffff' } }); }); return { sources, layers }; }
  renderFrontLines(frontLines) { ensureSurfaceFrontImages(this.map); frontLines.forEach(feature => { const props = feature.properties || {}; const sourceId = feature.sourceId || props.sourceId || `front-${feature._id || Date.now()}`; const data = { type: 'FeatureCollection', features: [feature] }; const frontType = getFeatureFrontType(feature); const style = FRONT_STYLES[frontType] || FRONT_STYLES.cold; this.upsertSource(sourceId, { type: 'geojson', data }); ['_bg', '_dash', '_secondary', '_triangles', '_circles', '_frontSymbols'].forEach((suffix) => safeRemoveLayer(this.map, `${sourceId}${suffix}`)); this.upsertLayer({ id: `${sourceId}_bg`, type: 'line', source: sourceId, slot: 'top', layout: { 'line-join': 'round', 'line-cap': 'round', visibility: 'visible' }, paint: { 'line-color': style.color, 'line-width': style.lineWidth, 'line-opacity': 0.86 } }); this.upsertLayer({ id: `${sourceId}_frontSymbols`, type: 'symbol', source: sourceId, slot: 'top', layout: { 'symbol-placement': 'line', 'symbol-spacing': 34, 'icon-image': style.imageId, 'icon-size': 0.92, 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'icon-keep-upright': false, 'icon-rotation-alignment': 'map', 'icon-pitch-alignment': 'map', visibility: 'visible' } }); }); }
}
export async function syncAnnotationFeaturesToMap(map, features = [], { mapRef, isDarkMode = false } = {}) { if (!map) return; await waitForMapStyle(map); const featuresArray = Array.isArray(features) ? features : features?.features || []; pruneStaleAnnotationArtifacts(map, featuresArray); if (!featuresArray.length) return; const theme = { lineColor: isDarkMode ? '#ffffff' : '#000000', textColor: isDarkMode ? '#ffffff' : '#000000', isDarkMode }; const classifier = new FeatureClassifier(); const { markerPoints, frontLines, nonFrontLines } = classifier.classify(featuresArray); if (mapRef) new MarkerRenderer(mapRef).renderAll(markerPoints); const lineRenderer = new LineRenderer(map, theme); lineRenderer.renderNonFrontLines(nonFrontLines); lineRenderer.renderFrontLines(frontLines); }
class ImageLoader { constructor(map) { this.map = map; this.loadedImages = new Set(); } async loadAll() { await Promise.allSettled([...MARKER_IMAGES.map(id => this.loadSingle(id, `/${id.replace('_', '')}.png`)), ...WIND_BARB_IMAGES.map(id => this.loadSingle(id, `/barbs/${id}.svg`))]); } async loadSingle(id, url) { if (this.loadedImages.has(id)) return; try { await loadImage(this.map, id, url); this.loadedImages.add(id); } catch (error) { console.warn(`Failed to load image ${id}:`, error); } } }
export async function setupMap({ map, mapRef, setDrawInstance, setMapLoaded, setSelectedPoint, setShowTitleModal, setLineCount, initialFeatures = [], logger, setLoading, selectedToolRef, setCapturedImages, isDarkMode }) { if (!map) { console.warn('No map instance provided'); setLoading?.(false); return () => { }; } setLoading?.(true); let setupFinished = false; const completeSetupOnce = () => { if (setupFinished) return; setupFinished = true; finishMapSetup({ setLoading, setMapLoaded, logger }); }; try { const draw = initDrawControl(map); window.drawInstance = draw; setDrawInstance(draw); addHimawariLayer(map); loadCustomImages(map); initTyphoonLayer(map); await addWindSource(map, isDarkMode); await addWindLayer(map, isDarkMode); new ImageLoader(map).loadAll(); const featuresArray = Array.isArray(initialFeatures) ? initialFeatures : initialFeatures?.features || []; setGlobalSourceIds(featuresArray.map(f => f.sourceId || f.properties?.sourceId).filter(Boolean)); const { totalLineCount } = new FeatureClassifier().classify(featuresArray); setLineCount?.(totalLineCount); await syncAnnotationFeaturesToMap(map, featuresArray, { mapRef, isDarkMode }); new LayerVisibilityManager(map).applyFromLocalStorage(); const handleDrawCreate = (e) => { const feature = e.features[0]; if (feature?.geometry.type === 'Point') { const [lng, lat] = feature.geometry.coordinates; setSelectedPoint({ lng, lat }); const selectedType = selectedToolRef?.current || ''; if (!['less_1', 'text_note'].includes(selectedType.toLowerCase())) setShowTitleModal(true); draw.delete(feature.id); } }; map.on('draw.create', handleDrawCreate); map.once('render', completeSetupOnce); window.setTimeout(completeSetupOnce, 250); return function cleanup() { map.off('draw.create', handleDrawCreate); delete window.drawInstance; }; } catch (error) { console.error('[mapSetup] Failed to setup map:', error); completeSetupOnce(); return () => { }; } }
