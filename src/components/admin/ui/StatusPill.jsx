import React from 'react';

const STATUS_CLASS = {
  pending: 'adm-badge-pending', pending_payment: 'adm-badge-pending', confirming: 'adm-badge-pending', under_review: 'adm-badge-pending',
  paid: 'adm-badge-paid', confirmed: 'adm-badge-confirmed',
  processing: 'adm-badge-processing',
  shipped: 'adm-badge-shipped', delivered: 'adm-badge-delivered',
  canceled: 'adm-badge-canceled', cancelled: 'adm-badge-cancelled', refunded: 'adm-badge-refunded', refund_pending: 'adm-badge-refunded',
  active: 'adm-badge-delivered', hidden: 'adm-badge-neutral', draft: 'adm-badge-neutral',
};

/** Status pill with dot + bilingual text (never color-only). */
export function StatusPill({ status, label }) {
  const key = String(status || 'neutral').toLowerCase();
  const cls = STATUS_CLASS[key] || 'adm-badge-neutral';
  return <span className={`adm-badge ${cls}`}>{label || String(status || '—')}</span>;
}
