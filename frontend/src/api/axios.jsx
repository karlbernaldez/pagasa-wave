// src/api/axios.js
import axios from 'axios';

import { withCsrfHeader } from './auth';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`, // change to your production URL later
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrfHeaders = withCsrfHeader({}, config.method);

  Object.entries(csrfHeaders).forEach(([name, value]) => {
    if (typeof config.headers?.set === 'function') {
      config.headers.set(name, value);
      return;
    }

    config.headers = {
      ...(config.headers || {}),
      [name]: value,
    };
  });

  return config;
});

export default api;
