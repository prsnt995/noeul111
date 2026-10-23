/**
 * Helper utility to extract and normalize product image URLs
 */
export function getProductPlaceholder(product) {
  const label = String(product?.name_en || product?.name_ko || product?.slug || 'NOEUL').slice(0, 28);
  const hue = [...label].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="hsl(${hue} 12% 94%)"/><text x="400" y="470" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" fill="#6b625b">${label.replace(/[<&>]/g, '')}</text><text x="400" y="525" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" letter-spacing="4" fill="#9a918a">NOEUL</text></svg>`)} `;
}

export function getProductImages(product) {
  if (!product) return [];

  let list = [];
  if (Array.isArray(product.images)) {
    list = product.images.filter(Boolean);
  } else if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) list = parsed.filter(Boolean);
      else if (typeof parsed === 'string' && parsed) list = [parsed];
    } catch {
      if (product.images) list = [product.images];
    }
  }

  if (list.length === 0 && product.image_url) {
    list = [product.image_url];
  }

  if (list.length === 0) {
    list = [getProductPlaceholder(product)];
  }

  return list.map((url) => {
    if (!url || typeof url !== 'string') return getProductPlaceholder(product);
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed;
    }
    return `/${trimmed}`;
  });
}

export function getPrimaryProductImage(product) {
  const images = getProductImages(product);
  return images[0] || getProductPlaceholder(product);
}

// Render guard for CMS/admin-controlled URLs: only http(s) absolute or
// site-relative paths pass, everything else (javascript:, data:, etc.)
// becomes null so the caller can fall back or skip rendering.
export function safeHttpUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      if (u.protocol === 'http:' || u.protocol === 'https:') return t;
    } catch { /* fall through */ }
    return null;
  }
  if (t.startsWith('/')) return t;
  return null;
}

const PRECONNECTED_HOSTS = new Set();

// One-time <link rel="preconnect"> per cross-origin image host so the
// first remote image doesn't pay DNS + TLS setup. Zero-config: the host
// is derived from the URL being rendered (no env var needed).
function ensureImagePreconnect(origin) {
  if (typeof document === 'undefined' || !origin || PRECONNECTED_HOSTS.has(origin)) return;
  PRECONNECTED_HOSTS.add(origin);
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  document.head.appendChild(link);
}

// Supabase serves FULL ORIGINALS from /storage/v1/object/* — width/quality
// params appended there are silently ignored (only /render/image/* applies
// transformations). Rewrite public object URLs to the render endpoint
// before setting params; signed/object-sign URLs are left untouched.
export function getOptimizedImageUrl(url, width = 800) {
  if (!url || typeof url !== 'string') return url;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) ensureImagePreconnect(parsed.origin);
    if (!parsed.pathname.startsWith('/storage/v1/object/public/')) return url;
    parsed.pathname = parsed.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const w = Math.min(2500, Math.max(1, Math.round(Number(width) || 800)));
    parsed.searchParams.set('width', String(w));
    parsed.searchParams.set('quality', w <= 480 ? '70' : '78');
    parsed.searchParams.set('resize', 'contain');
    return parsed.toString();
  } catch { return url; }
}

/**
 * srcset for transformable (Supabase-renderable) images only — local
 * paths and non-storage URLs return undefined so the plain src is used.
 */
export function getSrcSet(url, widths = [320, 480, 800]) {
  if (!url || typeof url !== 'string') return undefined;
  try {
    const parsed = new URL(url, window.location.origin);
    const transformable = parsed.origin !== window.location.origin
      && parsed.pathname.startsWith('/storage/v1/object/public/');
    if (!transformable) return undefined;
    return widths.map((w) => `${getOptimizedImageUrl(url, w)} ${w}w`).join(', ');
  } catch { return undefined; }
}
