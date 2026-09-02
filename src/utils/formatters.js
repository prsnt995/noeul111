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
export function formatDate(dateString, lang = 'ko') {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  if (lang === 'ko') {
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Status mapping for order fulfillment
 */
export const ORDER_STATUS_MAP = {
  pending: { ko: '결제대기', en: 'Pending Payment', bg: '#fef3c7', text: '#92400e', color: '#b45309' },
  confirmed: { ko: '주문접수', en: 'Confirmed', bg: '#e0f2fe', text: '#0369a1', color: '#0284c7' },
  processing: { ko: '상품준비중', en: 'Processing', bg: '#ede9fe', text: '#5b21b6', color: '#7c3aed' },
  shipped: { ko: '배송중', en: 'Shipped', bg: '#d1fae5', text: '#065f46', color: '#059669' },
  delivered: { ko: '배송완료', en: 'Delivered', bg: '#dcfce7', text: '#166534', color: '#16a34a' },
  cancelled: { ko: '주문취소', en: 'Cancelled', bg: '#fee2e2', text: '#991b1b', color: '#dc2626' },
  refunded: { ko: '반품/환불', en: 'Refunded', bg: '#f1f5f9', text: '#475569', color: '#64748b' },
};
