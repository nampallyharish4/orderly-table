import { API_BASE_URL } from '@/config';

export const apiFetch = (path: string, options?: RequestInit) => {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  return fetch(url, options);
};
