import { fetchWithAuth } from './auth';

// ╔══════════════════════════════════════════════════════╗
// ║               src/api/settings.api.js                ║
// ║  API helpers for site settings (admin + public)      ║
// ║                                                      ║
// ║  getSettings(page)   → GET  /api/settings/:page      ║
// ║  saveSettings(page, data) → PUT /api/settings/:page  ║
// ╚══════════════════════════════════════════════════════╝

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/settings`;

function buildSettingsErrorMessage(result, fallback) {
  const details = Array.isArray(result?.errors) ? result.errors.filter(Boolean) : [];
  if (details.length > 0) {
    return `${result.message || fallback}: ${details.join(' ')}`;
  }

  return result?.message || fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// getSettings(page)
// Used by PUBLIC pages (About, Contact, etc.) to read live content.
// Returns the flat settings data object, or {} if nothing saved yet.
//
// Usage:
//   const data = await getSettings('about');
// ─────────────────────────────────────────────────────────────────────────────
export const getSettings = async (page) => {
  if (!page) throw new Error('Missing page key when fetching settings');

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/${page}`, {
      method: 'GET',
      credentials: 'include', // send cookies (auth session)
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert('Session expired. Please log in again./');
        window.location.href = '/login';
        return;
      }

      const errorData = await response.json();
      console.error(`[ERROR] Failed to fetch settings for page "${page}":`, response.status, errorData);
      throw new Error(buildSettingsErrorMessage(errorData, 'Failed to fetch settings'));
    }

    return await response.json(); // flat settings object (doc.data from backend)
  } catch (error) {
    console.error(`[ERROR] Error in getSettings("${page}"):`, error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// saveSettings(page, data)
// Used by the ADMIN settings panel to persist changes to MongoDB.
// Sends the flat settings object — backend wraps it in { data: ... }.
//
// Usage:
//   const saved = await saveSettings('about', aboutData);
// ─────────────────────────────────────────────────────────────────────────────
export const saveSettings = async (page, data) => {
  if (!page) throw new Error('Missing page key when saving settings');
  if (!data || typeof data !== 'object') throw new Error('Invalid settings data');

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/${page}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // send cookies (auth session)
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(buildSettingsErrorMessage(result, 'Failed to save settings'));
    }

    return result; // returns saved doc.data from backend
  } catch (error) {
    console.error(`[ERROR] Failed to save settings for page "${page}":`, error.message);
    throw error;
  }
};
