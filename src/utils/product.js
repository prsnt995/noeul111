/** Pure helpers for product save: pre-flight validation + bilingual errors. */

const PRODUCT_ERROR_TEXT = {
  NAME_CATEGORY_PRICE_REQUIRED: {
    ko: '상품명, 카테고리, 판매가를 모두 입력하세요.',
    en: 'Enter the product name, category, and price.',
  },
  INVALID_PRICE: {
    ko: '판매가는 1원 이상의 정수로 입력하세요.',
    en: 'Price must be a positive whole number.',
  },
  INVALID_DISCOUNT: {
    ko: '할인가는 1원 이상, 판매가 미만의 정수로 입력하세요.',
    en: 'Sale price must be a whole number below the regular price.',
  },
  SKU_EXISTS: {
    ko: '이미 존재하는 SKU입니다. 상품 목록에서 확인하세요 — 이전 저장 시도가 성공했을 수 있습니다.',
    en: 'This SKU already exists. Check the product list — a previous save may have succeeded.',
  },
  SKU_RETRY: {
    ko: '다른 관리자가 동시에 등록 중입니다. 그대로 다시 저장하세요.',
    en: 'Another admin saved simultaneously. Save again unchanged.',
  },
  SKU_SEQUENCE_EXHAUSTED: {
    ko: '이 카테고리의 SKU 번호가 소진되었습니다 (99999). 새 접두사를 사용하세요.',
    en: 'SKU numbers exhausted for this category (99999). Use a new prefix.',
  },
  CATEGORY_INVALID: {
    ko: '선택한 카테고리가 존재하지 않습니다. 카테고리를 다시 선택하세요.',
    en: 'The selected category does not exist. Pick another category.',
  },
  SCHEMA_MISMATCH: {
    ko: '상품 테이블에 필요한 컬럼이 없습니다 (DB 마이그레이션 필요). 아래 안내를 호스트 담당자에게 전달하세요.',
    en: 'The products table is missing required columns (DB migration needed). Forward the details below to your host.',
  },
  DB_PERMISSION: {
    ko: 'DB 쓰기 권한이 없습니다. 서버 키 설정 또는 RLS 정책을 확인해야 합니다.',
    en: 'No database write permission. The server key or RLS policy needs checking.',
  },
  VARIANT_FAILED: {
    ko: '옵션(색상×사이즈) 저장에 실패했습니다. 상품이 생성되었을 수 있으니 목록을 먼저 확인하세요.',
    en: 'Failed to save options. The product may already exist — check the list first.',
  },
  MEDIA_FAILED: {
    ko: '이미지 저장에 실패했습니다. 상품이 생성되었을 수 있으니 목록을 확인한 뒤 수정에서 이미지를 다시 등록하세요.',
    en: 'Failed to save images. Check the list first, then re-add images via Edit.',
  },
  PRODUCT_CREATE_FAILED: {
    ko: '상품 등록에 실패했습니다. 목록에 상품이 생겼는지 확인한 뒤, 없으면 다시 시도하세요.',
    en: 'Failed to create the product. Check whether it appears in the list before retrying.',
  },
  INVALID_DETAIL_BLOCKS: {
    ko: '상세 콘텐츠 블록이 올바르지 않습니다. 제목/텍스트/이미지 블록의 길이와 개수를 확인하세요.',
    en: 'The detail content blocks are invalid. Check block types, lengths, and counts.',
  },
};

/** Friendly message for a save failure code (defaults to Korean). */
export function productErrorText(code, lang = 'ko', vars = {}) {
  const entry = PRODUCT_ERROR_TEXT[code] || PRODUCT_ERROR_TEXT.PRODUCT_CREATE_FAILED;
  let text = lang === 'en' ? entry.en : entry.ko;
  for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
  if (!PRODUCT_ERROR_TEXT[code] && code) text = `${text} (${code})`;
  return text;
}

export const CATEGORY_PREFIX_MAP = {
  tshirts: 'TS',
  tshirt: 'TS',
  't-shirts': 'TS',
  't-shirt': 'TS',
  tops: 'TS',
  top: 'TS',
  shirts: 'SH',
  shirt: 'SH',
  blouses: 'BL',
  blouse: 'BL',
  knitwear: 'KN',
  knit: 'KN',
  outerwear: 'OW',
  jackets: 'JK',
  jacket: 'JK',
  pants: 'PT',
  bottoms: 'PT',
  jeans: 'JN',
  denim: 'JN',
  skirts: 'SK',
  skirt: 'SK',
  dresses: 'DR',
  dress: 'DR',
  accessories: 'AC',
  accessory: 'AC',
  bags: 'BG',
  bag: 'BG',
  shoes: 'SO',
  shoe: 'SO',
  footwear: 'SO',
  socks: 'SC',
  sock: 'SC',
  hoodies: 'HD',
  hoodie: 'HD',
  sweatshirts: 'SW',
  sweatshirt: 'SW',
  cardigans: 'CD',
  cardigan: 'CD',
  underwear: 'UW',
};

export const KOREAN_CATEGORY_PREFIX_MAP = {
  '티셔츠': 'TS',
  '셔츠': 'SH',
  '셔츠/블라우스': 'SH',
  '블라우스': 'BL',
  '니트': 'KN',
  '니트웨어': 'KN',
  '아우터': 'OW',
  '자켓': 'JK',
  '재킷': 'JK',
  '팬츠': 'PT',
  '팬츠/데님': 'PT',
  '바지': 'PT',
  '데님': 'JN',
  '청바지': 'JN',
  '스커트': 'SK',
  '치마': 'SK',
  '원피스': 'DR',
  '드레스': 'DR',
  '상의': 'TS',
  '하의': 'PT',
  '악세사리': 'AC',
  '액세서리': 'AC',
  '악세사리/가방': 'AC',
  '가방': 'BG',
  '신발': 'SO',
  '양말': 'SC',
  '양말/삭스': 'SC',
  '후드': 'HD',
  '후드티': 'HD',
  '맨투맨': 'SW',
  '가디건': 'CD',
  '속옷': 'UW',
};

export const COMMON_SIZES = ['FREE', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
export const DEFAULT_SIZE_STOCK = 50;

/**
 * Derives a clean uppercase prefix (e.g., 'TS', 'SH', 'KN') from a category.
 * Supports known fashion categories and dynamically derives 2-letter prefixes
 * for admin-created custom categories.
 */
export function getCategoryPrefix(category) {
  if (!category) return 'NE';
  const slug = typeof category === 'string'
    ? category
    : (category.slug || '');
  const name_en = typeof category === 'object' ? (category.name_en || '') : '';
  const name_ko = typeof category === 'object' ? (category.name_ko || category.name || '') : '';

  const cleanSlug = String(slug).toLowerCase().trim();
  const cleanEn = String(name_en).toLowerCase().trim();
  const cleanKo = String(name_ko).trim();

  // 1. Direct slug match
  if (cleanSlug && CATEGORY_PREFIX_MAP[cleanSlug]) {
    return CATEGORY_PREFIX_MAP[cleanSlug];
  }

  // 2. Direct English name match
  const strippedEn = cleanEn.replace(/[^a-z0-9]/g, '');
  if (strippedEn && CATEGORY_PREFIX_MAP[strippedEn]) {
    return CATEGORY_PREFIX_MAP[strippedEn];
  }

  // 3. Korean name match
  if (cleanKo) {
    for (const [k, v] of Object.entries(KOREAN_CATEGORY_PREFIX_MAP)) {
      if (cleanKo === k || cleanKo.includes(k) || k.includes(cleanKo)) {
        return v;
      }
    }
  }

  // 4. Custom admin-created category
  // If slug has hyphens / underscores (e.g. "crop-top", "wide_pants")
  const words = cleanSlug.split(/[-_\s]+/).filter(Boolean);
  if (words.length >= 2) {
    const letters = words
      .map((w) => w.replace(/[^a-z]/g, '').charAt(0))
      .filter(Boolean)
      .slice(0, 3)
      .join('')
      .toUpperCase();
    if (letters.length >= 2) return letters;
  }

  // Single word custom slug or English name
  const candidate = cleanSlug || cleanEn;
  const lettersOnly = candidate.replace(/[^a-z]/gi, '').toUpperCase();
  if (lettersOnly.length >= 2) {
    return lettersOnly.slice(0, 2);
  }
  if (lettersOnly.length === 1) {
    return `${lettersOnly}X`;
  }

  return 'CT';
}

/**
 * Computes the next unique SKU for a given category (e.g., 'TS-001', 'SH-001').
 * Inspects all existing SKUs with the prefix, finds the highest numeric suffix,
 * and increments it to prevent duplicate SKUs.
 */
export function generateNextSku(category, existingProductsOrSkus = []) {
  const prefix = getCategoryPrefix(category);
  const skus = (existingProductsOrSkus || []).map((item) => {
    if (typeof item === 'string') return item.trim().toUpperCase();
    return String(item?.sku || '').trim().toUpperCase();
  });

  const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  let maxNum = 0;

  for (const s of skus) {
    const match = s.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let nextSku = `${prefix}-${String(nextNum).padStart(3, '0')}`;

  const set = new Set(skus);
  while (set.has(nextSku)) {
    nextNum += 1;
    nextSku = `${prefix}-${String(nextNum).padStart(3, '0')}`;
  }

  return nextSku;
}

/**
 * Client-side pre-flight mirroring the backend guards, so fixable input
 * mistakes never cost a network round trip. Returns { ok: true } or
 * { ok: false, code } with one of the NAME_/INVALID_* codes above.
 */
export function validateProductForm(formData = {}) {
  if (!String(formData.name_ko || '').trim() || !formData.category_id || formData.price === undefined || formData.price === '') {
    return { ok: false, code: 'NAME_CATEGORY_PRICE_REQUIRED' };
  }
  const price = Number(formData.price);
  if (!Number.isInteger(price) || price <= 0) {
    return { ok: false, code: 'INVALID_PRICE' };
  }
  if (formData.discount_price !== undefined && formData.discount_price !== null && formData.discount_price !== '') {
    const discount = Number(formData.discount_price);
    if (!Number.isInteger(discount) || discount <= 0 || discount >= price) {
      return { ok: false, code: 'INVALID_DISCOUNT' };
    }
  }
  return { ok: true };
}
