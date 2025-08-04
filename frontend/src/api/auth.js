const AUTH_API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/api/auth`;

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
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }

    return response.json(); // Contains token or user data
  } catch (error) {
    console.error(error); // Log the error for debugging
    throw new Error(error.message || 'Something went wrong during login.');
  }
};

const refreshAccessToken = async () => {
  try {
    const response = await fetch('/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensure cookies are sent with the request
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token.');
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
    // Clear access token from localStorage
    localStorage.removeItem('authToken');

    // Send request to invalidate refresh token
    const response = await fetch(`${AUTH_API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include', // Ensure cookies are included in the request
    });

    if (!response.ok) {
      throw new Error('Failed to logout on server');
    }

    // Clear refresh token from cookies on the client-side
    document.cookie = 'refreshToken=; Max-Age=0; path=/;'; // Expire the refresh token cookie immediately

    // Optionally, log out on client side
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    // Redirect to login page
    window.location.href = '/login';  // Or navigate using react-router, if needed
  } catch (error) {
    console.error("Error during logout:", error);
    // Handle the error (e.g., show a toast or alert)
  }
};