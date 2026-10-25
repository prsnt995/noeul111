const API_BASE = '/api/v1';
let csrfToken = '';
// In-memory GET cache for fast repeat navigation/reload. Entries expire after
// TTL; ETag-based conditional requests allow instant invalidation when the
// backend response changes.
const GET_CACHE_TTL = 30 * 1000;
const getCache = new Map();

function cacheKey(endpoint, scope) {
  return `${scope}::${endpoint}`;
}

export function setCsrfToken(value) { csrfToken = value || ''; }
export async function apiRequest(endpoint, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const { scope = 'customer', ...fetchOptions } = options;
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  // Finding #17: credentials are selected explicitly by API scope so a
  // simultaneous customer/admin session can never send the wrong identity.
  // Cookie sessions carry a single canonical identity; the scope header lets
  // the backend audit which surface issued the call.
  headers['X-API-Scope'] = scope;

  const key = cacheKey(endpoint, scope);
  const cached = method === 'GET' ? getCache.get(key) : null;
  const now = Date.now();
  // Serve fresh cached data immediately for speed.
  if (cached && cached.expires > now) {
    return cached.data;
  }
  // Conditional request when we have a stale entry.
  if (cached && cached.etag) {
    headers['If-None-Match'] = cached.etag;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...fetchOptions, method, headers, credentials: 'include' });

  // 304: backend unchanged -> reuse cached payload.
  if (response.status === 304 && cached) {
    cached.expires = now + GET_CACHE_TTL;
    return cached.data;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.code || 'API request failed');
  if (data.csrf) csrfToken = data.csrf;

  if (method === 'GET') {
    const etag = response.headers.get('etag') || '';
    getCache.set(key, { data, etag, expires: now + GET_CACHE_TTL });
  }
  // Invalidate cache on mutations for the affected scope.
  if (method !== 'GET') {
    for (const k of getCache.keys()) {
      if (k.startsWith(`${scope}::`)) getCache.delete(k);
    }
  }
  return data;
}
export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
// Scoped clients (finding #17): use adminApi for back-office calls and
// customerApi for storefront calls when both sessions may coexist.
export const customerApi = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, scope: 'customer' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', scope: 'customer', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', scope: 'customer', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', scope: 'customer', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE', scope: 'customer' }),
};
export const adminApi = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, scope: 'admin' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', scope: 'admin', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', scope: 'admin', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', scope: 'admin', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE', scope: 'admin' }),
};
