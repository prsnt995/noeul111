import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Buy Now isolation', () => {
  it('product page starts a buy-now intent instead of adding to the cart', () => {
    const page = read('src/pages/ProductDetailPage.jsx');
    expect(page.includes('startBuyNow(product')).toBe(true);
    expect(page.includes("setLocation('/checkout?mode=buynow')")).toBe(true);
    // handleBuyNow must not call addToCart — that was the 1→2→3 quantity bug.
    const handleBuyNow = page.slice(page.indexOf('const handleBuyNow'));
    expect(handleBuyNow.slice(0, 260).includes('addToCart')).toBe(false);
  });

  it('buy-now lines never merge into the cart', () => {
    const cart = read('src/context/CartContext.jsx');
    const startBuyNow = cart.slice(cart.indexOf('const startBuyNow'));
    expect(startBuyNow.slice(0, 400).includes('setItems')).toBe(false);
    expect(startBuyNow.slice(0, 400).includes('setBuyNowItem(line)')).toBe(true);
    expect(cart.includes('sessionStorage.setItem(BUYNOW_KEY')).toBe(true);
  });

  it('checkout reads the buy-now line and flags duplicates in the cart', () => {
    const page = read('src/pages/CheckoutPage.jsx');
    expect(page.includes("get('mode') === 'buynow'")).toBe(true);
    expect(page.includes('buyNowItem ? [buyNowItem] : []')).toBe(true);
    expect(page.includes('duplicateInCart')).toBe(true);
    expect(page.includes("sessionStorage.setItem('noeul_checkout_mode'")).toBe(true);
  });

  it('a confirmed buy-now payment does not clear the cart', () => {
    const page = read('src/pages/TossPaymentPage.jsx');
    expect(page.includes("mode === 'buynow'")).toBe(true);
    expect(page.includes('clearBuyNowRef.current()')).toBe(true);
    // Cart clearing stays inside the non-buy-now branch only.
    const branch = page.slice(page.indexOf("mode === 'buynow'"), page.indexOf("mode === 'buynow'") + 420);
    expect(branch.includes('clearBuyNowRef.current()')).toBe(true);
    expect(branch.indexOf('clearCartRef.current()')).toBeGreaterThan(branch.indexOf('} else {'));
  });
});

describe('Post-payment status UX', () => {
  it('no dead-end "확인 필요" screen after a successful redirect', () => {
    const page = read('src/pages/TossPaymentPage.jsx');
    expect(page.includes('결제 상태 확인이 필요합니다')).toBe(false);
    expect(page.includes("api.post('/payments/toss/recover'")).toBe(true);
    expect(page.includes('/order-success/')).toBe(true);
  });

  it('payment states are verbally and visually distinct', () => {
    const fmt = read('src/utils/formatters.js');
    expect(fmt.includes("ko: '결제 진행 중'")).toBe(true);
    expect(fmt.includes("ko: '결제 확인 중'")).toBe(true);
    expect(fmt.includes("ko: '결제 완료'")).toBe(true);
    // pending_payment (amber) and confirming (indigo) must not share a colour.
    expect(fmt.includes("bg: '#fff7ed'")).toBe(true);
    expect(fmt.includes("bg: '#eef2ff'")).toBe(true);
  });

  it('order tracking hides the stepper until payment is confirmed', () => {
    const fmt = read('src/utils/formatters.js');
    const page = read('src/pages/CustomerAccountPage.jsx');
    expect(fmt.includes('customerStepIndex')).toBe(true);
    expect(page.includes('getCustomerStatus')).toBe(true);
    expect(page.includes('CUSTOMER_ORDER_STEPS')).toBe(true);
    // The old red "카드 결제가 필요합니다" copy is gone.
    expect(page.includes('카드 결제가 필요합니다')).toBe(false);
    expect(page.includes('결제 진행 중')).toBe(true);
    expect(page.includes('결제 확인 중')).toBe(true);
  });

  it('Meta Purchase only fires for a paid order, once', () => {
    const page = read('src/pages/OrderSuccessPage.jsx');
    expect(page.includes("order.status !== 'paid'")).toBe(true);
    expect(page.includes('noeul_purchase_fired:')).toBe(true);
  });

  it('order status page polls while the payment is verifying', () => {
    const page = read('src/pages/OrderSuccessPage.jsx');
    expect(page.includes("order?.status !== 'confirming'")).toBe(true);
    expect(page.includes('POLL_INTERVAL_MS')).toBe(true);
  });
});

describe('Business disclosure', () => {
  it('publishes the mail-order registration number everywhere it is shown', () => {
    const cfg = read('src/config/business.js');
    expect(cfg.includes("ecommerceNumber: '제2026-인천남동구-1275호'")).toBe(true);
    expect(cfg.includes("ecommerceNumber: '확인 중'")).toBe(false);
    // Footer and /business-info both read the single config value.
    expect(read('src/components/common/Footer.jsx').includes('verifiedBusiness.ecommerceNumber')).toBe(true);
    expect(read('src/pages/policy/BusinessInfoPage.jsx').includes('business.ecommerceNumber')).toBe(true);
  });

  it('leaves no placeholder in the admin business defaults', () => {
    expect(read('server/db/seed.js').includes('[수정 가능 / 확인 필요]')).toBe(false);
    expect(read('src/pages/admin/AdminSettingsPage.jsx').includes('[수정 가능 / 확인 필요]')).toBe(false);
  });
});
