// simple_select.js
import MapboxDraw from '@mapbox/mapbox-gl-draw';

const SimpleSelect = {
  ...MapboxDraw.modes.simple_select,

  onDrag(state, e) {
    const selectedFeatures = this.getSelected();
    const soloPointSelected =
      selectedFeatures.length === 1 && selectedFeatures[0].type === 'Point';

    // If the selected feature is a single point, allow dragging it without holding shift
    // Shift is required for multiple features, or single linestrings and polygons
    if (state.canDragMove && (e.originalEvent.shiftKey || soloPointSelected)) {
      return this.dragMove(state, e);
    }
    if (this.drawConfig.boxSelect && state.canBoxSelect) {
      return this.whileBoxSelect(state, e);
    }
  },

  toDisplayFeatures(state, geojson, display) {
    // Default rendering behavior for features
    geojson.properties.active =
      this.getSelectedIds().indexOf(geojson.id) !== -1 ? 'true' : 'false';
    display(geojson);
  }
};

export default SimpleSelect;
