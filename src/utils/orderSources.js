// Frontend order-source labels (KR/EN). Mirrors api/orderSources.js.
export const ORDER_SOURCES = ['website', 'instagram', 'tiktok', 'other'];

export const ORDER_SOURCE_LABELS = {
  website: { ko: '웹사이트', en: 'Website' },
  instagram: { ko: '인스타그램', en: 'Instagram' },
  tiktok: { ko: '틱톡', en: 'TikTok' },
  other: { ko: '기타', en: 'Other' },
};

export function sourceLabel(source, lang = 'ko') {
  const key = ORDER_SOURCES.includes(String(source || '').toLowerCase())
    ? String(source).toLowerCase()
    : 'website';
  const entry = ORDER_SOURCE_LABELS[key];
  return lang === 'en' ? entry.en : entry.ko;
}
