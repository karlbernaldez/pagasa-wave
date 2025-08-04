import { length } from "@turf/length";
import { circle } from "@turf/circle";
const MapboxDraw = require('@mapbox/mapbox-gl-draw').default;

const { getDisplayMeasurements } = require('./util.js');

// Function to create a circle feature from two points
function circleFromTwoVertexLineString(geojson) {
  const center = geojson.geometry.coordinates[0]; // First point is the center
  const radiusInKm = length(geojson, { units: 'kilometers' }); // Calculate distance between points (radius)

  // Use Turf.js circle method to generate circle feature
  return circle(center, radiusInKm, { steps: 64 });
}

const CircleMode = {
  ...MapboxDraw.modes.draw_line_string, // Extending the default line string mode

  // Handle clicks to add coordinates to the line
  clickAnywhere: function (state, e) {
    if (state.currentVertexPosition === 1) {
      // Finish the line by adding the second point
      state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
      return this.changeMode('simple_select', { featureIds: [state.line.id] });
    }

    // Update the line with the new coordinates
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);

    // Update vertex position only if direction is 'forward'
    if (state.direction === 'forward') {
      state.currentVertexPosition += 1;
    }

    return null;
  },

  // Stop drawing and fire the created feature (circle)
  onStop: function (state) {
    this.activateUIButton();

    // Ensure the line feature exists
    if (this.getFeature(state.line.id) === undefined) return;

    // Remove the first coordinate (center of the circle)
    state.line.removeCoordinate('0');
    
    // If line is valid, create the circle feature
    if (state.line.isValid()) {
      const lineGeoJson = state.line.toGeoJSON();
      const circleFeature = circleFromTwoVertexLineString(lineGeoJson);

      // Fire the 'draw.create' event with the circle
      this.map.fire('draw.create', {
        features: [circleFeature]
      });
    } else {
      // If the line is invalid, clean up and return to select mode
      this.deleteFeature([state.line.id], { silent: true });
      this.changeMode('simple_select', {}, { silent: true });
    }
  },

  // Overriding `toDisplayFeatures` to render custom features
  toDisplayFeatures: function (state, geojson, display) {
    console.log('toDisplayFeatures geojson:', geojson); // Debugging line to inspect geojson data

    if (geojson.geometry.coordinates.length < 2) return; // No rendering if less than 2 coordinates

    // Render the first point (center of the circle)
    display({
      type: 'Feature',
      properties: {
        active: 'true'
      },
      geometry: {
        type: 'Point',
        coordinates: geojson.geometry.coordinates[0]
      }
    });

    geojson.properties.active = 'true';
    display(geojson); // Display the line geometry

    // Display the current drawing position (second point of the line)
    const displayMeasurements = getDisplayMeasurements(geojson);

    const currentVertex = {
      type: 'Feature',
      properties: {
        meta: 'currentPosition',
        radius: `${displayMeasurements.metric} ${displayMeasurements.standard}`,
        parent: state.line.id
      },
      geometry: {
        type: 'Point',
        coordinates: geojson.geometry.coordinates[1]
      }
    };

    display(currentVertex); // Display current vertex (second point)

    // Create and display the circle feature
    const circleFeature = circleFromTwoVertexLineString(geojson);
    circleFeature.properties = { active: 'true' };

    console.log('Displaying circle:', circleFeature); // Debugging circle feature

    display(circleFeature); // Display the circle geometry

    return;
  }
};

export default CircleMode;
