const SATELLITE_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/satellite`;

// 📌 Get all satellite images (returns JSON with base64 images)
export const fetchAllSatelliteImages = async () => {
  const response = await fetch(`${SATELLITE_API_BASE_URL}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch satellite images');
  }

  return response.json(); // ✅ JSON [{ id, image(base64) }]
};

// 📌 Get a satellite image by ID (returns raw image, not JSON)
export const fetchSatelliteImageById = async (id) => {
  const response = await fetch(`${SATELLITE_API_BASE_URL}/${id}`, {
    method: 'GET',
    credentials: 'include', // remove this if not needed
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch satellite image');
  }

  // Use arrayBuffer and set explicit MIME type
  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: 'image/png' }); // force PNG type
  return URL.createObjectURL(blob);
};

// 📌 Refresh satellite image by ID (cache-busting URL)
export const refreshSatelliteImage = (id) => {
  return `${SATELLITE_API_BASE_URL}/${id}?t=${Date.now()}`;
};
