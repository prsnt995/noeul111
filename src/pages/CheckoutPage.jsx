import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../utils/api.js';

export function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ recipient: user?.name || '', phone: user?.phone || '', postal_code: user?.postal_code || '', address: user?.address || '', detail_address: user?.detail_address || '' });
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const update = e => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    async function checkPayments() {
      try {
        const res = await api.get('/store/settings/public');
        // Only enable Toss widget when backend explicitly exposes a live client key
        const hasToss = Boolean(res.data?.toss_client_key || res.data?.tossClientKey || res.toss_client_key);
        setPaymentsEnabled(hasToss);
      } catch { setPaymentsEnabled(false); }
      setReady(true);
    }
    checkPayments();
  }, []);

  const submit = async e => {
    e.preventDefault();
    if (!isLoggedIn) { setLocation('/auth'); return; }
    const unresolved = items.filter(i => !i.variant_id);
    if (unresolved.length > 0) {
      showToast('장바구니에 카탈로그 동기화가 필요한 상품이 있습니다. 상품을 다시 담아주세요.', 'error');
      return;
    }
    if (items.length === 0) { showToast('장바구니가 비어 있습니다.', 'error'); return; }
    try {
      const quoteRes = await api.post('/checkout/quote', { items: items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })), address: form });
      if (!quoteRes.success) throw new Error('Quote failed');
      const orderRes = await api.post('/orders', { ...quoteRes.data, address: form }, { headers: { 'Idempotency-Key': crypto.randomUUID() } });
      clearCart();
      if (orderRes.data?.order_number && paymentsEnabled) {
        setLocation(`/checkout/toss?order=${orderRes.data.order_number}`);
      } else {
        showToast('주문이 생성되었습니다.', 'success');
        setLocation(`/order-success/${orderRes.data?.order_number || ''}`);
      }
    } catch (err) { showToast(err.message, 'error'); }
  };

  const missingVariant = items.some(i => !i.variant_id);

  return <main className="page-container" style={{ maxWidth: 820, margin: '3rem auto', padding: '1.5rem' }}>
    <h1>Toss 카드 결제</h1>
    <p>Google 로그인 후 배송지와 카드 정보를 확인합니다.</p>
    {missingVariant && <p style={{ color: '#b45309', background: '#fef3c7', padding: '10px 12px', borderRadius: 6, fontSize: 13 }}>일부 장바구니 항목이 이전 버전에서 저장되었습니다. 해당 상품을 제거 후 다시 담아주세요.</p>}
    <form onSubmit={submit} style={{ display: 'grid', gap: '1.25rem' }}>
      <section className="checkout-panel"><h2>배송지</h2>
        {[
          ['recipient', '받는 분'],
          ['phone', '연락처'],
          ['postal_code', '우편번호'],
          ['address', '주소'],
          ['detail_address', '상세주소'],
        ].map(([name, label]) =>
          <label key={name} style={{ display: 'grid', gap: 4 }}>{label}<input required={name !== 'detail_address'} name={name} value={form[name] || ''} onChange={update} className="form-input" /></label>
        )}
      </section>
      <section className="checkout-panel checkout-card-panel">
        <div className="checkout-card-brand">TOSS <span>SECURE CARD</span></div>
        <h2>카드 정보</h2>
        {paymentsEnabled ?
          <div id="toss-widget" /> :
          <p className="checkout-payment-note">결제는 Toss 카드 위젯으로 진행됩니다. 현재 테스트 키가 설정되지 않아 주문 생성 후 성공 페이지로 이동합니다.</p>
        }
      </section>
      <button type="submit" disabled={!ready} className="checkout-pay-button">
        {paymentsEnabled ? 'Toss 카드로 결제하기' : '주문하기'}
      </button>
    </form>
  </main>;
}
