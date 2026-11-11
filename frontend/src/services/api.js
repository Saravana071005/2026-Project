import axios from 'axios';

/**
 * Determine and normalize the API base URL.
 * Supports:
 * - Empty or undefined: defaults to '/api' (for local Vite dev proxy)
 * - Domain without path: 'https://backend.onrender.com' -> automatically appends '/api'
 * - Complete path with trailing slash: 'https://backend.onrender.com/api/' -> 'https://backend.onrender.com/api'
 */
const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '/api';
  }
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('food_allergy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('food_allergy_token');
        localStorage.removeItem('food_allergy_user');
        window.location.href = '/login?sessionExpired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
