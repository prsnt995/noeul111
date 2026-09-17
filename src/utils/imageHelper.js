/**
 * Helper utility to extract and normalize product image URLs
 */
export function getProductImages(product) {
  if (!product) return ['/products/men/tshirts/classic-tshirt/1.jpg'];

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
    list = ['/products/men/tshirts/classic-tshirt/1.jpg'];
  }

  return list.map((url) => {
    if (!url || typeof url !== 'string') return '/products/men/tshirts/classic-tshirt/1.jpg';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed;
    }
    return `/${trimmed}`;
  });
}

export function getPrimaryProductImage(product) {
  const images = getProductImages(product);
  return images[0] || '/products/men/tshirts/classic-tshirt/1.jpg';
}
