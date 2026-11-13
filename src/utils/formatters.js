/**
 * Format number into Korean Won (KRW) string e.g. ₩120,000
 */
export function formatKRW(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₩0';
  }
  return '₩' + Number(amount).toLocaleString('ko-KR');
}

/**
 * Format Korean mobile phone number into 010-1234-5678 pattern
 */
export function formatKoreanPhone(value) {
  if (!value) return '';
  const clean = value.replace(/[^0-9]/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
}

/**
 * Format date into localized display string
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Status mapping for order fulfillment
 */
export const ORDER_STATUS_MAP = {
  pending_payment: { ko: '결제대기', en: 'Pending Payment', bg: '#fef3c7', text: '#92400e', color: '#b45309' },
  confirming: { ko: '결제확인중', en: 'Confirming', bg: '#fef3c7', text: '#92400e', color: '#b45309' },
  paid: { ko: '결제완료', en: 'Paid', bg: '#e0f2fe', text: '#0369a1', color: '#0284c7' },
  canceled: { ko: '주문취소', en: 'Cancelled', bg: '#fee2e2', text: '#991b1b', color: '#dc2626' },
  expired: { ko: '주문만료', en: 'Expired', bg: '#fee2e2', text: '#991b1b', color: '#dc2626' },
  refund_pending: { ko: '환불진행중', en: 'Refund Pending', bg: '#f1f5f9', text: '#475569', color: '#64748b' },
  pending_verification: { ko: '결제대기(검수중)', en: 'Pending Verification', bg: '#fef3c7', text: '#92400e', color: '#b45309' },
  pending: { ko: '결제대기', en: 'Pending Payment', bg: '#fef3c7', text: '#92400e', color: '#b45309' },
  confirmed: { ko: '주문확정', en: 'Confirmed', bg: '#e0f2fe', text: '#0369a1', color: '#0284c7' },
  processing: { ko: '상품준비중', en: 'Processing', bg: '#ede9fe', text: '#5b21b6', color: '#7c3aed' },
  shipped: { ko: '배송중', en: 'Shipped', bg: '#d1fae5', text: '#065f46', color: '#059669' },
  delivered: { ko: '배송완료', en: 'Delivered', bg: '#dcfce7', text: '#166534', color: '#16a34a' },
  cancelled: { ko: '주문취소', en: 'Cancelled', bg: '#fee2e2', text: '#991b1b', color: '#dc2626' },
  refunded: { ko: '반품/환불', en: 'Refunded', bg: '#f1f5f9', text: '#475569', color: '#64748b' },
};

/**
 * Customer-facing status map.
 *
 * The fulfillment map above is shared with the admin console, so customer copy
 * lives here instead of being changed in place. The key difference is that the
 * two pre-payment states are visually and verbally distinct:
 *   - pending_payment : money NOT taken yet  → amber, actionable ("결제 진행 중")
 *   - confirming      : money may be taken   → indigo, informational ("결제 확인 중")
 * They used to share the same yellow badge, which made them indistinguishable.
 */
export const CUSTOMER_STATUS_MAP = {
  ...ORDER_STATUS_MAP,
  pending_payment: { ko: '결제 진행 중', en: 'Payment in Progress', bg: '#fff7ed', text: '#c2410c', color: '#ea580c', border: '#fed7aa' },
  pending: { ko: '결제 진행 중', en: 'Payment in Progress', bg: '#fff7ed', text: '#c2410c', color: '#ea580c', border: '#fed7aa' },
  pending_verification: { ko: '결제 확인 중', en: 'Verifying Payment', bg: '#eef2ff', text: '#3730a3', color: '#4f46e5', border: '#c7d2fe' },
  confirming: { ko: '결제 확인 중', en: 'Verifying Payment', bg: '#eef2ff', text: '#3730a3', color: '#4f46e5', border: '#c7d2fe' },
  paid: { ko: '결제 완료', en: 'Paid', bg: '#ecfdf5', text: '#047857', color: '#059669', border: '#a7f3d0' },
  confirmed: { ko: '주문 접수', en: 'Order Accepted', bg: '#ecfdf5', text: '#047857', color: '#059669', border: '#a7f3d0' },
};

export function getCustomerStatus(status) {
  return CUSTOMER_STATUS_MAP[status] || ORDER_STATUS_MAP[status] || ORDER_STATUS_MAP.pending;
}

/**
 * Post-payment fulfillment steps. Shown only once the payment is confirmed —
 * before that, "결제대기" as step 1 implied progress that had not happened.
 */
export const CUSTOMER_ORDER_STEPS = [
  { key: 'paid', ko: '판매자 확인 중', en: 'Verifying by Seller' },
  { key: 'processing', ko: '상품 준비 중', en: 'Preparing' },
  { key: 'shipped', ko: '배송 중', en: 'Shipping' },
  { key: 'delivered', ko: '배송 완료', en: 'Delivered' },
];

export function customerStepIndex(status) {
  const map = { paid: 0, confirmed: 0, processing: 1, shipped: 2, delivered: 3 };
  return map[status] ?? -1;
}

export function isTerminalOrderStatus(status) {
  return ['canceled', 'cancelled', 'expired', 'refunded', 'refund_pending'].includes(status);
}
