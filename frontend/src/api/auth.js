const AUTH_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/auth`;
const AUTH_CACHE_TTL_MS = 1500;

let refreshInFlight = null;
let authCheckInFlight = null;
let authCache = {
  value: null,
  ts: 0,
};

const clearAuthCache = () => {
  authCache = { value: null, ts: 0 };
};

const clearLegacyClientAuthStorage = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

const setAuthCache = (value) => {
  authCache = {
    value,
    ts: Date.now(),
  };
  return value;
};

const getCachedAuth = () => {
  if (!authCache.value) return null;
  if (Date.now() - authCache.ts > AUTH_CACHE_TTL_MS) return null;
  return authCache.value;
};

const unavailableAuthState = () => ({
  authenticated: false,
  user: null,
  unavailable: true,
});

const fetchAuthCheck = async () => {
  const res = await fetch(`${AUTH_API_BASE_URL}/check`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    return { ok: false, status: res.status, data: null };
  }

  const data = await res.json();
  return { ok: true, status: res.status, data };
};

const isTransientAuthStatus = (status) => status === 429 || status >= 500;

export const sendOtp = async ({ email }) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to send OTP.');
  }

  return response.json();
};

export const verifyOtp = async ({ email, otp }) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Invalid or expired OTP.');
  }

  clearAuthCache();
  clearLegacyClientAuthStorage();
  return response.json();
};

export const verifyEmail = async (token) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/verify-email?token=${token}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { message: error.message || 'Verification failed.', expired: false };
  }

  return response.json();
};

export const resendVerificationEmail = async (email) => {
  let response;

  try {
    response = await fetch(`${AUTH_API_BASE_URL}/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include',
    });
  } catch {
    throw new Error('Network error. Please check your connection and try again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}.`);
  }

  return data;
};

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
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }

    clearAuthCache();
    clearLegacyClientAuthStorage();
    return await response.json();
  } catch (error) {
    console.error('Login Error:', error);
    throw new Error(error.message || 'Something went wrong during login.', { cause: error });
  }
};

export const refreshAccessToken = async () => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (isTransientAuthStatus(response.status)) {
        throw new Error('Unable to verify your session right now.');
      }

      if (!response.ok) {
        clearAuthCache();
        return false;
      }

      await response.json().catch(() => ({}));
      clearAuthCache();
      return true;
    } catch (error) {
      throw new Error('Unable to verify your session right now.', { cause: error });
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
};

export const checkAuthSession = async ({ force = false } = {}) => {
  if (!force) {
    const cached = getCachedAuth();
    if (cached) return cached;
    if (authCheckInFlight) return authCheckInFlight;
  }

  authCheckInFlight = (async () => {
    try {
      const initial = await fetchAuthCheck();

      if (initial.ok) {
        return setAuthCache({
          authenticated: true,
          user: initial.data?.user || null,
          unavailable: false,
        });
      }

      if (isTransientAuthStatus(initial.status)) {
        return unavailableAuthState();
      }

      if (initial.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const retried = await fetchAuthCheck();
          if (retried.ok) {
            return setAuthCache({
              authenticated: true,
              user: retried.data?.user || null,
              unavailable: false,
            });
          }
          if (isTransientAuthStatus(retried.status)) {
            return unavailableAuthState();
          }
        }
      }

      return setAuthCache({ authenticated: false, user: null, unavailable: false });
    } catch {
      return unavailableAuthState();
    }
  })();

  try {
    return await authCheckInFlight;
  } finally {
    authCheckInFlight = null;
  }
};

export const fetchWithAuth = async (url, options = {}) => {
  const request = () =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
      credentials: 'include',
    });

  let response = await request();

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw new Error('Your session has expired. Please log in again.');
    }

    response = await request();
  }

  return response;
};

export const logoutUser = async () => {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    clearLegacyClientAuthStorage();
    clearAuthCache();

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
