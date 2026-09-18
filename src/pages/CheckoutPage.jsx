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
        const res = await api.get('/api/v1/store/settings/public');
        setPaymentsEnabled(res.data?.shipping_policy ? true : false);
      } catch { setPaymentsEnabled(false); }
      setReady(true);
    }
    checkPayments();
  }, []);

  const submit = async e => {
    e.preventDefault();
    if (!isLoggedIn) { setLocation('/auth'); return; }
    if (!items.every(i => i.variant_id)) { showToast('상품 카탈로그가 준비되지 않았습니다.', 'error'); return; }
    try {
      const quoteRes = await api.post('/api/v1/checkout/quote', { items: items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })), address: form });
      if (!quoteRes.success) throw new Error('Quote failed');
      const orderRes = await api.post('/api/v1/orders', { ...quoteRes.data, address: form }, { headers: { 'Idempotency-Key': `order-${Date.now()}` } });
      clearCart();
      if (orderRes.data?.order_number && paymentsEnabled) {
        setLocation(`/checkout/toss?order=${orderRes.data.order_number}`);
      } else {
        showToast('주문이 생성되었습니다.', 'success');
        setLocation('/order-success');
      }
    } catch (err) { showToast(err.message, 'error'); }
  };

  return <main className="page-container" style={{ maxWidth: 820, margin: '3rem auto', padding: '1.5rem' }}>
    <h1>Toss 카드 결제</h1>
    <p>Google 로그인 후 배송지와 카드 정보를 확인합니다.</p>
    <form onSubmit={submit} style={{ display: 'grid', gap: '1.25rem' }}>
      <section className="checkout-panel"><h2>배송지</h2>
        {['recipient', 'phone', 'postal_code', 'address', 'detail_address'].map(([name, label]) =>
          <label key={name}>{label}<input required={name !== 'detail_address'} name={name} value={form[name]} onChange={update} /></label>
        )}
      </section>
      <section className="checkout-panel checkout-card-panel">
        <div className="checkout-card-brand">TOSS <span>SECURE CARD</span></div>
        <h2>카드 정보</h2>
        {paymentsEnabled ?
          <div id="toss-widget" /> :
          <p className="checkout-payment-note">결제 설정이 완료되면 Toss 위젯이 표시됩니다.</p>
        }
      </section>
      <button type="submit" disabled={!ready || !paymentsEnabled} className="checkout-pay-button">
        {paymentsEnabled ? 'Toss 카드로 결제하기' : '결제 준비 중...'}
      </button>
    </form>
  </main>;
}
