import axios from 'axios';

// Dynamically resolve backend host based on current browser location hostname (supports localhost, LAN IP, or domain)
const defaultHost = typeof window !== 'undefined' && window.location && window.location.hostname ? window.location.hostname : 'localhost';

// Backend API Base URL (configured via Vite environment variable with safe dynamic fallback)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${defaultHost}:5000/api`;

// Socket.IO Server URL (configured via Vite env or derived dynamically from API_BASE_URL)
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
  import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
    : `http://${defaultHost}:5000`
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Access Token & Optional Tenant Header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dms_access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const selectedOrgId = localStorage.getItem('dms_selected_org_id');
  if (selectedOrgId) {
    config.headers['X-Organization-Id'] = selectedOrgId;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle Token Refresh & Authorization Failures
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('dms_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data.accessToken;

          localStorage.setItem('dms_access_token', newAccessToken);
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('dms_access_token');
          localStorage.removeItem('dms_refresh_token');
          localStorage.removeItem('dms_user');
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
