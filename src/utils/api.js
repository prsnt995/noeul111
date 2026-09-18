const API_BASE = '/api/v1';
let csrfToken = '';
export function setCsrfToken(value) { csrfToken = value || ''; }
export async function apiRequest(endpoint, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const scope = options.scope || 'customer';
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  // Finding #17: credentials are selected explicitly by API scope so a
  // simultaneous customer/admin session can never send the wrong identity.
  // Cookie sessions carry a single canonical identity; the scope header lets
  // the backend audit which surface issued the call.
  headers['X-API-Scope'] = scope;
  const { scope: _omit, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE}${endpoint}`, { ...fetchOptions, method, headers, credentials: 'include' });
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
// Scoped clients (finding #17): use adminApi for back-office calls and
// customerApi for storefront calls when both sessions may coexist.
export const customerApi = {
  get: endpoint => apiRequest(endpoint, { scope: 'customer' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', scope: 'customer', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', scope: 'customer', body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', scope: 'customer', body: JSON.stringify(body) }),
  delete: endpoint => apiRequest(endpoint, { method: 'DELETE', scope: 'customer' }),
};
export const adminApi = {
  get: endpoint => apiRequest(endpoint, { scope: 'admin' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', scope: 'admin', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', scope: 'admin', body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', scope: 'admin', body: JSON.stringify(body) }),
  delete: endpoint => apiRequest(endpoint, { method: 'DELETE', scope: 'admin' }),
};
