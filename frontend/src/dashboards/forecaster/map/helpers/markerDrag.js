/**
 * markerDrag.js
 * Adds drag-to-move behaviour to any Mapbox GL symbol layer.
 *
 * Usage:
 *   import { makeMarkerDraggable } from './markerDrag';
 *
 *   // Call once after adding the layer
 *   const cleanup = makeMarkerDraggable(map, layerId, sourceId, onDragEnd);
 *
 *   // Call when removing the layer to avoid memory leaks
 *   cleanup();
 */

/**
 * @param {mapboxgl.Map}  map        - The Mapbox GL map instance
 * @param {string}        layerId    - The symbol layer id to make draggable
 * @param {string}        sourceId   - The GeoJSON source id backing the layer
 * @param {Function}      onDragEnd  - Called with previous and next coordinates when drag ends
 * @returns {Function}               - Cleanup function
 */
export function makeMarkerDraggable(map, layerId, sourceId, onDragEnd) {
  let isDragging = false;
  let dragStartCoordinates = null;
  let dragFeatureCoords = null;

  const setCursor = (cursor) => {
    map.getCanvas().style.cursor = cursor;
  };

  const onMouseEnter = () => {
    if (!isDragging) setCursor('grab');
  };

  const onMouseLeave = () => {
    if (!isDragging) setCursor('');
  };

  const beginDrag = (coordinates) => {
    dragStartCoordinates = Array.isArray(coordinates) ? coordinates.slice() : null;
    dragFeatureCoords = dragStartCoordinates?.slice() || null;
    isDragging = true;
  };

  const finishDrag = () => {
    if (!dragFeatureCoords || !dragStartCoordinates) return;

    const coordinates = dragFeatureCoords.slice();
    const previousCoordinates = dragStartCoordinates.slice();
    dragStartCoordinates = null;
    dragFeatureCoords = null;

    if (coordinates[0] === previousCoordinates[0] && coordinates[1] === previousCoordinates[1]) {
      return;
    }

    onDragEnd?.({
      lng: coordinates[0],
      lat: coordinates[1],
      coordinates,
      previousCoordinates,
    });
  };

  const onMouseDown = (event) => {
    if (!event.features?.length) return;

    event.preventDefault();
    beginDrag(event.features[0].geometry.coordinates);
    setCursor('grabbing');

    map.on('mousemove', onMouseMove);
    map.once('mouseup', onMouseUp);
  };

  const onMouseMove = (event) => {
    if (!isDragging) return;

    const { lng, lat } = event.lngLat;
    dragFeatureCoords = [lng, lat];

    const source = map.getSource(sourceId);
    if (!source) return;

    source.setData({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: dragFeatureCoords },
      properties: source._data?.properties ?? {},
    });
  };

  const onMouseUp = () => {
    if (!isDragging) return;

    isDragging = false;
    setCursor('grab');
    map.off('mousemove', onMouseMove);
    finishDrag();
  };

  const onTouchStart = (event) => {
    if (!event.features?.length || event.points.length !== 1) return;

    event.preventDefault();
    beginDrag(event.features[0].geometry.coordinates);

    map.on('touchmove', onTouchMove);
    map.once('touchend', onTouchEnd);
  };

  const onTouchMove = (event) => {
    if (!isDragging || event.points.length !== 1) return;

    const touch = event.lngLat;
    dragFeatureCoords = [touch.lng, touch.lat];

    const source = map.getSource(sourceId);
    if (!source) return;

    source.setData({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: dragFeatureCoords },
      properties: source._data?.properties ?? {},
    });
  };

  const onTouchEnd = () => {
    if (!isDragging) return;

    isDragging = false;
    map.off('touchmove', onTouchMove);
    finishDrag();
  };

  map.on('mouseenter', layerId, onMouseEnter);
  map.on('mouseleave', layerId, onMouseLeave);
  map.on('mousedown', layerId, onMouseDown);
  map.on('touchstart', layerId, onTouchStart);

  const disableMapDrag = () => map.dragPan.disable();
  const enableMapDrag = () => map.dragPan.enable();
  map.on('mouseenter', layerId, disableMapDrag);
  map.on('mouseleave', layerId, enableMapDrag);

  return function cleanup() {
    map.off('mouseenter', layerId, onMouseEnter);
    map.off('mouseleave', layerId, onMouseLeave);
    map.off('mousedown', layerId, onMouseDown);
    map.off('touchstart', layerId, onTouchStart);
    map.off('mouseenter', layerId, disableMapDrag);
    map.off('mouseleave', layerId, enableMapDrag);
    map.off('mousemove', onMouseMove);
    map.off('touchmove', onTouchMove);
    map.dragPan.enable();
  };
}
