/** Pure SKU helpers: category-based auto codes like TSH-00001. No DOM, unit-testable. */

export const SKU_SEQ_PAD = 5;
export const SKU_SEQ_MAX = 99999;
export const SKU_PREFIX_RE = /^[A-Z0-9]{2,6}$/;

/** Uppercase alphanumeric normalization for a typed prefix. */
export function normalizePrefix(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

/** Slug-derived suggestion: first 3 letters, e.g. tshirts -> TSH. */
export function suggestPrefix(slug) {
  const letters = String(slug || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  return letters;
}

/** TSH + 42 -> TSH-00042. Throws on out-of-range sequences (never wrap). */
export function nextSku(prefix, seq) {
  const clean = normalizePrefix(prefix);
  const n = Number(seq);
  if (!clean || !SKU_PREFIX_RE.test(clean)) throw new Error('INVALID_PREFIX');
  if (!Number.isInteger(n) || n < 1 || n > SKU_SEQ_MAX) throw new Error('SKU_SEQUENCE_EXHAUSTED');
  return `${clean}-${String(n).padStart(SKU_SEQ_PAD, '0')}`;
}

/** Validate a prefix against format + taken list. */
export function validatePrefix(prefix, takenPrefixes = []) {
  const clean = normalizePrefix(prefix);
  if (!SKU_PREFIX_RE.test(clean)) return { ok: false, code: 'INVALID_PREFIX' };
  const taken = new Set((takenPrefixes || []).map((p) => normalizePrefix(p)).filter(Boolean));
  if (taken.has(clean)) return { ok: false, code: 'PREFIX_EXISTS' };
  return { ok: true, prefix: clean };
}

const PREFIX_ERROR_TEXT = {
  INVALID_PREFIX: {
    ko: 'SKU 접두사는 영문 대문자/숫자 2~6자로 입력하세요. (예: TSH)',
    en: 'SKU prefix must be 2–6 uppercase letters/digits. (e.g. TSH)',
  },
  PREFIX_EXISTS: {
    ko: '이미 사용 중인 접두사입니다. 다른 접두사를 입력하세요.',
    en: 'This prefix is already taken. Choose another one.',
  },
  SKU_RETRY: {
    ko: '다른 관리자가 동시에 등록 중입니다. 다시 시도하세요.',
    en: 'Another admin saved at the same time. Please retry.',
  },
  SKU_SEQUENCE_EXHAUSTED: {
    ko: '이 카테고리의 SKU 번호가 소진되었습니다 (99999). 새 접두사를 사용하세요.',
    en: 'SKU numbers exhausted for this category (99999). Use a new prefix.',
  },
};

export function prefixErrorText(code, lang = 'ko') {
  const entry = PREFIX_ERROR_TEXT[code];
  if (!entry) return lang === 'en' ? `Save failed (${code || 'UNKNOWN'}).` : `저장 실패 (${code || 'UNKNOWN'}).`;
  return lang === 'en' ? entry.en : entry.ko;
}
