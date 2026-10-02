// Shared order-source definitions for the legacy SQLite backend.
// Mirrors api/orderSources.js — keep the two files in sync.
export const ORDER_SOURCES = ['website', 'instagram', 'whatsapp', 'phone', 'other'];

export const ORDER_SOURCE_LABELS = {
  website: { ko: '웹사이트', en: 'Website' },
  instagram: { ko: '인스타그램', en: 'Instagram' },
  whatsapp: { ko: '왓츠앱', en: 'WhatsApp' },
  phone: { ko: '전화', en: 'Phone' },
  other: { ko: '기타', en: 'Other' },
};

export function normalizeOrderSource(value) {
  const v = String(value || '').toLowerCase().trim();
  return ORDER_SOURCES.includes(v) ? v : 'website';
}

export function isValidOrderSource(value) {
  return ORDER_SOURCES.includes(String(value || '').toLowerCase().trim());
}
