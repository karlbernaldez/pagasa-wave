import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/features`; // Adjust if using a different port

const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const decodedToken = jwtDecode(token);  // Decode the JWT
    const currentTime = Date.now() / 1000; // Current time in seconds

    // Check if token has expired
    if (decodedToken.exp < currentTime) {
      console.error('[ERROR] Token has expired');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ERROR] Invalid token:', error);
    return false;
  }
};

// Function to refresh the access token using the refresh token
const refreshAccessToken = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // This ensures cookies are sent with the request
    });

    if (!response.ok) {
      console.error('[ERROR] Failed to refresh token.');
      return null;
    }

    const data = await response.json();
    return data.accessToken; // Return the new access token
  } catch (error) {
    console.error('[ERROR] Error while refreshing token:', error);
    return null;
  }
};

// Function to delete a feature
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

// Function to save feature
export const saveFeature = async (feature) => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // keeps cookies/session
      body: JSON.stringify(feature),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save feature');
    }

    return data; // return API response (success or duplicate info)
  } catch (error) {
    console.error('[ERROR] Failed to save feature:', error.message);
    throw error;
  }
};

// Function to fetch features with token validation and refresh logic
export const fetchFeatures = async (projectId) => {
  if (!projectId) {
    throw new Error('Missing projectId when fetching features');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/my-projects/${projectId}`, {
      method: 'GET',
      credentials: 'include', // send cookies (e.g., accessToken)
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert('Session expired. Please log in again.');
        window.location.href = '/login';
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

export async function updateFeatureNameAPI(layerId, newName) {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/${encodeURIComponent(layerId)}`,
      { newName },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // ✅ send cookies
      }
    );

    return response.data;
  } catch (err) {
    // Log specific errors
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