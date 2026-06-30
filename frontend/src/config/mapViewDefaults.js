export const DEFAULT_MAP_STYLE_URL = 'mapbox://styles/votewave/cmie07p43007j01svdwmmg89n';

export const DEFAULT_STUDIO_MAP_VIEW = Object.freeze({
  center: Object.freeze({
    longitude: 120.0,
    latitude: 15.5,
  }),
  zoom: Object.freeze({
    default: 5.5,
    min: 4,
    max: 16,
  }),
  maxBounds: Object.freeze({
    west: 80,
    south: -10,
    east: 170,
    north: 40,
  }),
  fitBounds: Object.freeze({
    west: 93,
    south: 5,
    east: 153.8595159535438,
    north: 25,
  }),
  padding: Object.freeze({
    top: 50,
    bottom: 50,
    left: 200,
    right: 200,
  }),
  fitBoundsMaxZoom: 8,
});

export function lngLatPair(point = {}) {
  return [Number(point.longitude), Number(point.latitude)];
}

export function boundsPair(bounds = {}) {
  return [
    [Number(bounds.west), Number(bounds.south)],
    [Number(bounds.east), Number(bounds.north)],
  ];
}
