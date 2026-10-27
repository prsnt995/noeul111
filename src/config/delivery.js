/**
 * NOEUL Storefront Delivery Configuration
 *
 * Configurable fast delivery banner settings for the NOEUL storefront.
 * Cutoff time, courier service, headlines, and delivery policy claims
 * can be updated here or overridden via component props.
 *
 * Notice: Delivery claims are qualified with carrier terms and exceptions
 * to comply with Korean e-commerce shipping disclosures (CJ Logistics).
 */
export const DEFAULT_DELIVERY_CONFIG = Object.freeze({
  enabled: true,
  smallHeading: 'NOEUL FAST DELIVERY',
  mainHeading: '오늘 출발 내일 도착',
  supportingText: '평일 오후 4시 이전 주문 시',
  additionalText: '당일 출발 · 익일 도착',
  cutoffHour: 16, // 16:00 KST
  cutoffDisplay: '오후 4시',
  courierName: 'CJ대한통운',
  // Set to true only if contractually guaranteed with unconditional money-back terms:
  guaranteed: false,
  disclaimerText: '제주·도서산간 제외, 택배사(CJ대한통운) 및 물류 사정에 따라 1~2일 지연될 수 있습니다.',
  badgeText: '당일 출고',
});
