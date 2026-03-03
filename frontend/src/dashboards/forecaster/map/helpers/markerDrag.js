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
 * @param {Function}      onDragEnd  - Called with { lng, lat } when drag ends
 * @returns {Function}               - Cleanup function
 */
export function makeMarkerDraggable(map, layerId, sourceId, onDragEnd) {
  let isDragging = false;
  let dragFeatureCoords = null;

  // ── Cursor helpers ────────────────────────────────────────
  const setCursor = (cursor) => {
    map.getCanvas().style.cursor = cursor;
  };

  // ── Mouse enter / leave ───────────────────────────────────
  const onMouseEnter = () => {
    if (!isDragging) setCursor('grab');
  };

  const onMouseLeave = () => {
    if (!isDragging) setCursor('');
  };

  // ── Drag start ────────────────────────────────────────────
  const onMouseDown = (e) => {
    if (!e.features?.length) return;

    e.preventDefault();                      // prevent map pan
    isDragging = true;
    dragFeatureCoords = e.features[0].geometry.coordinates.slice();

    setCursor('grabbing');

    map.on('mousemove', onMouseMove);
    map.once('mouseup', onMouseUp);
  };

  // ── Dragging ──────────────────────────────────────────────
  const onMouseMove = (e) => {
    if (!isDragging) return;

    const { lng, lat } = e.lngLat;
    dragFeatureCoords = [lng, lat];

    // Live-update the source so the icon follows the cursor
    const source = map.getSource(sourceId);
    if (!source) return;

    source.setData({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: dragFeatureCoords },
      properties: source._data?.properties ?? {},
    });
  };

  // ── Drag end ──────────────────────────────────────────────
  const onMouseUp = () => {
    if (!isDragging) return;

    isDragging = false;
    setCursor('grab');

    map.off('mousemove', onMouseMove);

    if (dragFeatureCoords) {
      const [lng, lat] = dragFeatureCoords;
      onDragEnd?.({ lng, lat });
    }
  };

  // ── Touch support ─────────────────────────────────────────
  const onTouchStart = (e) => {
    if (!e.features?.length || e.points.length !== 1) return;

    e.preventDefault();
    isDragging = true;

    map.on('touchmove', onTouchMove);
    map.once('touchend', onTouchEnd);
  };

  const onTouchMove = (e) => {
    if (!isDragging || e.points.length !== 1) return;

    const touch = e.lngLat;
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
    isDragging = false;
    map.off('touchmove', onTouchMove);

    if (dragFeatureCoords) {
      const [lng, lat] = dragFeatureCoords;
      onDragEnd?.({ lng, lat });
    }
  };

  // ── Register listeners ────────────────────────────────────
  map.on('mouseenter', layerId, onMouseEnter);
  map.on('mouseleave', layerId, onMouseLeave);
  map.on('mousedown', layerId, onMouseDown);
  map.on('touchstart', layerId, onTouchStart);

  // Disable map drag while hovering the marker
  map.on('mouseenter', layerId, () => map.dragPan.disable());
  map.on('mouseleave', layerId, () => map.dragPan.enable());

  // ── Return cleanup ────────────────────────────────────────
  return function cleanup() {
    map.off('mouseenter', layerId, onMouseEnter);
    map.off('mouseleave', layerId, onMouseLeave);
    map.off('mousedown', layerId, onMouseDown);
    map.off('touchstart', layerId, onTouchStart);
    map.off('mousemove', onMouseMove);
    map.off('touchmove', onTouchMove);
    map.dragPan.enable();
  };
}
