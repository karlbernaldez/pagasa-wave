const MapboxDraw = require('@mapbox/mapbox-gl-draw').default;

const SimpleSelect = {
  ...MapboxDraw.modes.simple_select,

  onDrag: function (state, e) {
    const selectedFeatures = this.getSelected();
    const soloPointSelected =
      selectedFeatures.length === 1 && selectedFeatures[0].type === 'Point';

    // if the selected feature is a single point, allow dragging it without holding shift
    // shift is required for multiple features, or single linestrings and polygons
    if (state.canDragMove && (e.originalEvent.shiftKey || soloPointSelected))
      return this.dragMove(state, e);
    if (this.drawConfig.boxSelect && state.canBoxSelect)
      return this.whileBoxSelect(state, e);
  },

  toDisplayFeatures: function (state, geojson, display) {
    // Default rendering behavior for features
    geojson.properties.active = (this.getSelectedIds().indexOf(geojson.id) !== -1) ? 'true' : 'false';
    display(geojson);
  }
};

module.exports = SimpleSelect;
