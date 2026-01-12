const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
const TOKEN_KEY = 'bazi_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  // Handle 204 No Content
  if (response.status === 204) return null;

  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.message || '请求失败');
    error.code = data.code;
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  get: (url) => request(url),
  post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
};
