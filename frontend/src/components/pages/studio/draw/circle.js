import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { length } from '@turf/length';
import { circle } from '@turf/circle';
import { getDisplayMeasurements } from './util.js';

// Function to create a circle feature from two points
function circleFromTwoVertexLineString(geojson) {
  const center = geojson.geometry.coordinates[0]; // First point is the center
  const radiusInKm = length(geojson, { units: 'kilometers' });

  return circle(center, radiusInKm, { steps: 64 });
}

const CircleMode = {
  ...MapboxDraw.modes.draw_line_string,

  clickAnywhere: function (state, e) {
    if (state.currentVertexPosition === 1) {
      state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
      return this.changeMode('simple_select', { featureIds: [state.line.id] });
    }

    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);

    if (state.direction === 'forward') {
      state.currentVertexPosition += 1;
    }

    return null;
  },

  onStop: function (state) {
    this.activateUIButton();

    if (!this.getFeature(state.line.id)) return;

    state.line.removeCoordinate(0);

    if (state.line.isValid()) {
      const lineGeoJson = state.line.toGeoJSON();
      const circleFeature = circleFromTwoVertexLineString(lineGeoJson);

      this.map.fire('draw.create', { features: [circleFeature] });
    } else {
      this.deleteFeature([state.line.id], { silent: true });
      this.changeMode('simple_select', {}, { silent: true });
    }
  },

  toDisplayFeatures: function (state, geojson, display) {
    if (geojson.geometry.coordinates.length < 2) return;

    // Render first point
    display({
      type: 'Feature',
      properties: { active: 'true' },
      geometry: { type: 'Point', coordinates: geojson.geometry.coordinates[0] }
    });

    geojson.properties.active = 'true';
    display(geojson);

    // Render second point as current vertex
    const displayMeasurements = getDisplayMeasurements(geojson);
    display({
      type: 'Feature',
      properties: {
        meta: 'currentPosition',
        radius: `${displayMeasurements.metric} ${displayMeasurements.standard}`,
        parent: state.line.id
      },
      geometry: { type: 'Point', coordinates: geojson.geometry.coordinates[1] }
    });

    // Render circle
    const circleFeature = circleFromTwoVertexLineString(geojson);
    circleFeature.properties = { active: 'true' };
    display(circleFeature);
  }
};

export default CircleMode;
