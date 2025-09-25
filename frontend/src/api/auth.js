const AUTH_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

export const registerUser = async (userData) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include', // Ensure cookies are included in the request
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }

    return await response.json(); // Contains token or user data
  } catch (error) {
    console.error('Login Error:', error); // Log for debugging
    throw new Error(error.message || 'Something went wrong during login.');
  }
};

export const refreshAccessToken = async () => {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.error(`Failed to refresh access token. Status: ${response.status}`);
      const errorData = await response.json();
      console.error('Error details:', errorData);
      throw new Error(`Failed to refresh access token. ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return data.accessToken;
  } catch (err) {
    console.error('Error refreshing access token:', err);
    return null;
  }
};

export const fetchWithAuth = async (url, options = {}) => {
  let accessToken = localStorage.getItem('authToken');
  if (!accessToken) {
    throw new Error('No access token found.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include', // Ensure cookies are included
  });

  // If the token is expired (401), refresh it
  if (response.status === 401) {
    try {
      accessToken = await refreshAccessToken();
      return fetchWithAuth(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      throw new Error('Unable to refresh token. Please log in again.');
    }
  }

  return response;
};

export const logoutUser = async () => {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    // Clear local storage (optional, depending on what you're storing)
    localStorage.clear();

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || 'Failed to logout on server');
    }

    window.location.href = '/login';
  } catch (error) {
    console.error('Error during logout:', error.message || error);
    alert('Logout failed. Please try again.');
  }
};
