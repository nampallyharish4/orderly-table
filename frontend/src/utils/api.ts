import axios from 'axios';
import { API_BASE_URL } from '@/config';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  return fetch(url, options);
};
