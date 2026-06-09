import axios from 'axios';

const DEFAULT_API_ORIGIN = 'http://localhost:5000';

function normalizeApiBaseUrl(value) {
  const origin = (value || DEFAULT_API_ORIGIN).replace(/\/+$/, '');
  return origin.endsWith('/api') ? origin : `${origin}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getResponseMessage(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((error) => error?.message || error?.msg || error)
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

export function createApiError(error) {
  if (axios.isCancel(error)) {
    const abortError = new Error('Request aborted');
    abortError.name = 'AbortError';
    return abortError;
  }

  const status = error?.response?.status;
  const data = error?.response?.data;
  const responseMessage = getResponseMessage(data);

  const messages = {
    400: responseMessage || 'Validation error.',
    401: responseMessage || 'Authentication required.',
    403: 'access denied',
    404: responseMessage || 'not found',
    409: responseMessage || 'Conflict. Please try again.',
    500: 'Something went wrong. Please try again later.',
  };

  const apiError = new Error(messages[status] || responseMessage || error?.message || 'Request failed.');
  apiError.name = 'ApiError';
  apiError.status = status;
  apiError.data = data;
  apiError.originalError = error;
  return apiError;
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    if (axios.isCancel(error)) {
      throw createApiError(error);
    }

    if (error?.response?.status !== 401 || originalRequest._retry) {
      throw createApiError(error);
    }

    originalRequest._retry = true;

    try {
      await refreshClient.post('/auth/refresh-token');
      return api(originalRequest);
    } catch (refreshError) {
      redirectToLogin();
      throw createApiError(refreshError);
    }
  },
);

export default api;
