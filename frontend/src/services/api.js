import axios from 'axios';

/**
 * Shared Axios instance.
 * - Sends the JWT as a Bearer token (and the CSRF token for cookie sessions).
 * - Unwraps responses so callers receive the JSON body directly.
 * - Announces expired sessions so the app can sign the user out cleanly.
 */
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// Origin of the API, used to turn "/api/media/<id>" paths into absolute image URLs.
const API_ORIGIN = /^https?:\/\//.test(API_URL) ? new URL(API_URL).origin : '';

export const SESSION_EXPIRED_EVENT = 'auth:expired';

const api = axios.create({ baseURL: API_URL, withCredentials: true, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const csrfToken = localStorage.getItem('csrfToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/login') || error.config?.url?.startsWith('/auth/register');
    if (error.response?.status === 401 && !isAuthCall && localStorage.getItem('token')) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

/** Resolves an image path returned by the API into something an <img> can load. */
export const mediaUrl = (path) => {
  if (!path) return '';
  return path.startsWith('/api/') ? `${API_ORIGIN}${path}` : path;
};

/** Human readable message for any failed request. */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data instanceof Blob) return fallback;
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message;
  // A reply without our message format means something other than the salon API answered.
  if (error?.response && (error.response.status === 404 || error.response.status >= 500)) return 'The salon server is not responding. Please try again shortly.';
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Please check your connection.';
  if (error?.code === 'ECONNABORTED') return 'The request took too long. Please try again.';
  return fallback;
};

/**
 * Builds a multipart body: all fields travel as one JSON string under "data"
 * (so nested values keep their types) alongside an optional image file.
 */
export const toFormData = (data, fileField, file) => {
  const form = new FormData();
  form.append('data', JSON.stringify(data));
  if (file) form.append(fileField, file);
  return form;
};

export default api;
