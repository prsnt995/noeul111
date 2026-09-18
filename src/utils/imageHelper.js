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

export function getOptimizedImageUrl(url, width = 800) {
  if (!url || typeof url !== 'string') return url;
  try {
    const parsed = new URL(url, window.location.origin);
    if (!parsed.pathname.includes('/storage/v1/object/')) return url;
    parsed.searchParams.set('width', String(width));
    parsed.searchParams.set('quality', width <= 480 ? '70' : '78');
    parsed.searchParams.set('resize', 'contain');
    return parsed.toString();
  } catch { return url; }
}
