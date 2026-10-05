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
  CATEGORY_INVALID: {
    ko: '선택한 카테고리가 존재하지 않습니다. 카테고리를 다시 선택하세요.',
    en: 'The selected category does not exist. Pick another category.',
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
};

/** Friendly message for a save failure code (defaults to Korean). */
export function productErrorText(code, lang = 'ko', vars = {}) {
  const entry = PRODUCT_ERROR_TEXT[code] || PRODUCT_ERROR_TEXT.PRODUCT_CREATE_FAILED;
  let text = lang === 'en' ? entry.en : entry.ko;
  for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
  if (!PRODUCT_ERROR_TEXT[code] && code) text = `${text} (${code})`;
  return text;
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
