/**
 * Sanitise and validate a coordinates payload from the client.
 * @param {object|null} raw
 * @returns {{ lat: number, lng: number, accuracyM: number|null } | null}
 */
export const parseCoordinates = (raw) => {
  if (!raw) return null;

  const { latitude: lat, longitude: lng, accuracy } = raw;

  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return {
    lat:       parseFloat(lat.toFixed(6)),
    lng:       parseFloat(lng.toFixed(6)),
    accuracyM: typeof accuracy === 'number' ? Math.round(accuracy) : null,
  };
};