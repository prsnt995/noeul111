const API_BASE = '/api/v1';
let csrfToken = '';
export function setCsrfToken(value) { csrfToken = value || ''; }
export async function apiRequest(endpoint, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, method, headers, credentials: 'include' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.code || 'API request failed');
  if (data.csrf) csrfToken = data.csrf;
  return data;
}
export const api = {
  get: endpoint => apiRequest(endpoint),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: endpoint => apiRequest(endpoint, { method: 'DELETE' }),
};
