import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { getAuthToken } from '@/contexts/AuthContext';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every outgoing request
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear stored auth and redirect to login
      localStorage.removeItem('pos_auth_user');
      localStorage.removeItem('pos_auth_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError(error)) {
    const details = (error.response?.data as any)?.details;
    const message = (error.response?.data as any)?.error;
    return details || message || error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const apiFetch = (path: string, options?: RequestInit) => {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  // Attach JWT token to fetch calls too
  const token = getAuthToken();
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
};
