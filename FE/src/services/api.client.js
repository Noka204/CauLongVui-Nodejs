import axios from 'axios';

/**
 * Centralized Axios instance for CauLongVui API.
 * Base URL can be configured via VITE_API_URL.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const API_PUBLIC_KEY = import.meta.env.VITE_API_PUBLIC_KEY || 'local_public_key';
const API_SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY || 'local_secret_key';

console.log('🔧 API Configuration:', {
  API_BASE_URL,
  API_PUBLIC_KEY,
  env: import.meta.env.VITE_API_URL
});

export const getApiBaseUrl = () => API_BASE_URL;

export const getApiOrigin = () => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:5000';
  }
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request Interceptor
 * - Attach API keys for gateway validation
 * - Attach Bearer token for authenticated endpoints (bookings, profile, etc.)
 */
apiClient.interceptors.request.use(
  (config) => {
    config.headers['x-api-public-key'] = API_PUBLIC_KEY;

    if (API_SECRET_KEY) {
      config.headers['x-api-secret-key'] = API_SECRET_KEY;
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * - If backend returns success: false => normalize to a rejected custom error
 * - If network/server throws => normalize error shape for FE forms
 */
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      return Promise.reject({
        message: response.data.message || 'THAO TAC THAT BAI',
        details: response.data.error?.details || [],
        code: response.data.error?.code || 'UNKNOWN',
        status: response.status,
      });
    }
    return response;
  },
  (error) => {
    const customError = {
      message: error.response?.data?.message || 'LOI KET NOI SERVER',
      details: error.response?.data?.error?.details || [],
      code: error.response?.data?.error?.code || 'NETWORK_ERROR',
      status: error.response?.status || 500,
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
