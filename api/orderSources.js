// Shared order-source definitions for manual / external orders.
// Single source of truth for allowed channels (website + Instagram/TikTok).
// Used by api/admin.js (Supabase) and tested in test/manual-orders.test.js.
// Keep in sync with server/lib/orderSources.js and src/utils/orderSources.js.

export const ORDER_SOURCES = ['website', 'instagram', 'tiktok', 'other'];

export const ORDER_SOURCE_LABELS = {
  website: { ko: '웹사이트', en: 'Website' },
  instagram: { ko: '인스타그램', en: 'Instagram' },
  tiktok: { ko: '틱톡', en: 'TikTok' },
  other: { ko: '기타', en: 'Other' },
};

export function normalizeOrderSource(value) {
  const v = String(value || '').toLowerCase().trim();
  return ORDER_SOURCES.includes(v) ? v : 'website';
}

export function isValidOrderSource(value) {
  return ORDER_SOURCES.includes(String(value || '').toLowerCase().trim());
}

export function sourceLabel(source, lang = 'ko') {
  const entry = ORDER_SOURCE_LABELS[normalizeOrderSource(source)];
  return lang === 'en' ? entry.en : entry.ko;
}

const PAID_STATUSES = new Set(['paid', 'processing', 'shipped', 'delivered']);
const UNPAID_STATUSES = new Set(['pending_payment', 'confirming', 'pending_verification', 'under_review', 'pending']);

export function isPaidStatus(status) {
  return PAID_STATUSES.has(String(status || ''));
}

export function isUnpaidStatus(status) {
  return UNPAID_STATUSES.has(String(status || ''));
}

// Aggregate orders into per-source totals. Pure function — no DB access.
// Each order: { order_source?, status, amount|total_amount, refunded_amount? }
export function buildSalesBySource(orders) {
  const bySource = {};
  for (const s of ORDER_SOURCES) {
    bySource[s] = {
      source: s,
      order_count: 0,
      paid_count: 0,
      unpaid_count: 0,
      revenue_paid: 0,
      refunded_amount: 0,
    };
  }
  for (const o of orders || []) {
    const src = normalizeOrderSource(o.order_source);
    const row = bySource[src];
    const amount = Number(o.amount ?? o.total_amount ?? 0) || 0;
    const status = String(o.status ?? o.order_status ?? '');
    row.order_count += 1;
    if (isPaidStatus(status)) {
      row.paid_count += 1;
      row.revenue_paid += amount;
    } else if (status === 'refunded' || status === 'refund_pending') {
      row.refunded_amount += Number(o.refunded_amount ?? amount ?? 0) || 0;
    } else {
      row.unpaid_count += 1;
    }
    if (Number(o.refunded_amount || 0) > 0 && status !== 'refunded' && status !== 'refund_pending') {
      row.refunded_amount += Number(o.refunded_amount) || 0;
    }
  }
  return Object.values(bySource);
}

export function salesBySourceToCsv(rows) {
  const header = 'source,order_count,paid_count,unpaid_count,revenue_paid,refunded_amount';
  const lines = (rows || []).map((r) =>
    [r.source, r.order_count, r.paid_count, r.unpaid_count, r.revenue_paid, r.refunded_amount].join(',')
  );
  return [header, ...lines].join('\n');
}
