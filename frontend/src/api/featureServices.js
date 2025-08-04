import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/api/features`; // Adjust if using a different port

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
export const deleteFeature = async (sourceId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${sourceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
export const saveFeature = async (feature, token) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(feature),
    });

    if (!response.ok) throw new Error('Failed to save feature');

    return response.json();
  } catch (error) {
    console.error('[ERROR] Failed to save feature:', error);
    throw error;
  }
};

// Function to fetch features with token validation and refresh logic
export const fetchFeatures = async (token) => {
  // Check if the token is valid
  if (!isTokenValid(token)) {
    console.log('[ERROR] Invalid or expired token. Attempting to refresh token.');

    // Attempt to refresh the token
    const refreshedToken = await refreshAccessToken();
    localStorage.removeItem('authToken');

    console.log('[INFO] Refreshed token:', refreshedToken);
    if (refreshedToken) {
      // Save the new token to localStorage
      localStorage.setItem('authToken', refreshedToken);

      // Retry fetching features with the new token
      return fetchFeatures(refreshedToken);
    } else {
      // If refreshing the token fails, redirect to login
      alert('Session expired. Please log in again.');
      localStorage.removeItem('projectId');
      localStorage.removeItem('projectName');
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      return;
    }
  }

  const projectId = localStorage.getItem('projectId');
  if (!projectId) throw new Error('Missing projectId.');

  const queryParams = new URLSearchParams({ projectId });

  try {
    const response = await fetch(`${API_BASE_URL}/my-projects?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Ensure cookies are sent with the request
    });

    if (!response.ok) {
      // Log the error response for debugging
      const errorData = await response.json();
      console.error('[ERROR] Failed to fetch features:', response.status, errorData);
      throw new Error('Failed to fetch features');
    }

    return response.json();
  } catch (error) {
    console.error('[ERROR] Error in fetchFeatures:', error);
    throw error;
  }
};

export async function updateFeatureNameAPI(layerId, newName) {
  try {
    const token = localStorage.getItem('authToken');

    if (!token) {
      alert('No token found. Please log in again.');
      return;
    }

    const response = await axios.patch(
      `${API_BASE_URL}/${encodeURIComponent(layerId)}`,
      { newName },
      {
        headers: {
          'Authorization': `Bearer ${token}`, // Ensure the token is passed correctly
        },
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