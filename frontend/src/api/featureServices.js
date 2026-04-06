import axios from 'axios';
import { showSessionModal } from '@/components/ui/modals/SessionModal';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/features`;

// ── Shared session-expired handler ────────────────────────────────────────────

async function handleSessionExpired() {
  await showSessionModal({
    variant:      'warning',
    title:        'Session Expired',
    message:      'Your session has timed out. Please log in again to continue.',
    confirmLabel: 'Go to Login',
  });
  window.location.href = '/login';
}

// ── Feature API ───────────────────────────────────────────────────────────────

export const deleteFeature = async (sourceId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${sourceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete feature');
    }

    return response.json();
  } catch (error) {
    console.error('[ERROR] Failed to delete feature:', error);
    throw error;
  }
};

export const createFeature = async (feature) => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(feature),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save feature');
    }

    return data;
  } catch (error) {
    console.error('[ERROR] Failed to save feature:', error.message);
    throw error;
  }
};

export const fetchFeatures = async (projectId) => {
  if (!projectId) {
    throw new Error('Missing projectId when fetching features');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/my-projects/${projectId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await handleSessionExpired(); // ← styled modal, then redirect
        return;
      }

      const errorData = await response.json();
      console.error('[ERROR] Failed to fetch features:', response.status, errorData);
      throw new Error('Failed to fetch features');
    }

    return await response.json();
  } catch (error) {
    console.error('[ERROR] Error in fetchFeatures:', error);
    throw error;
  }
};

export const fetchProjectFeatureCollection = async (projectId) => {
  if (!projectId) {
    throw new Error('Missing projectId when fetching project FeatureCollection');
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/project/${projectId}/features`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await handleSessionExpired(); // ← styled modal, then redirect
        return;
      }

      const errorData = await response.json();
      console.error(
        '[ERROR] Failed to fetch project FeatureCollection:',
        response.status,
        errorData
      );
      throw new Error(errorData.error || 'Failed to fetch project features');
    }

    return await response.json();
  } catch (error) {
    console.error('[ERROR] Error in fetchProjectFeatureCollection:', error);
    throw error;
  }
};

export async function updateFeatureNameAPI(layerId, newName) {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/${encodeURIComponent(layerId)}`,
      { newName },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.data);
    } else if (err.request) {
      console.error('Request Error:', err.request);
    } else {
      console.error('Error:', err.message);
    }
    throw new Error('Failed to update feature name');
  }
}

export async function updateFeatureCoordinates(sourceId, coordinates) {
  const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(sourceId)}/coordinates`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ coordinates }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update coordinates');
  }

  return response.json();
}