import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../utils/api.js';

export function CheckoutPage() {
  const { items } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ recipient: user?.name || '', phone: user?.phone || '', postal_code: user?.postal_code || '', address: user?.address || '', detail_address: user?.detail_address || '' });
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submission = useRef(false);
  const orderKey = useRef(crypto.randomUUID());
  const update = e => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    async function checkPayments() {
      try {
        const res = await api.get('/payments/toss/config');
        setPaymentsEnabled(res.data?.enabled === true);
      } catch { setPaymentsEnabled(false); }
      setReady(true);
    }
    checkPayments();
  }, []);

  const submit = async e => {
    e.preventDefault();
    if (submission.current) return;
    if (!paymentsEnabled) { showToast('현재 결제를 준비 중입니다.', 'error'); return; }
    if (!isLoggedIn) { setLocation('/auth'); return; }
    const unresolved = items.filter(i => !i.variant_id);
    if (unresolved.length > 0) {
      showToast('장바구니에 카탈로그 동기화가 필요한 상품이 있습니다. 상품을 다시 담아주세요.', 'error');
      return;
    }
    if (items.length === 0) { showToast('장바구니가 비어 있습니다.', 'error'); return; }
    submission.current = true; setSubmitting(true);
    try {
      const quoteRes = await api.post('/checkout/quote', { items: items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })), address: form });
      if (!quoteRes.success) throw new Error('Quote failed');
      const orderRes = await api.post('/orders', { ...quoteRes.data, address: form }, { headers: { 'Idempotency-Key': orderKey.current } });
      if (!orderRes.data?.order_number) throw new Error('주문을 확인할 수 없습니다.');
      // Keep cart contents until an authoritative paid result; a redirect or
      // order creation is not proof of payment. Do not lose later cart changes.
      setLocation(`/checkout/toss?order=${encodeURIComponent(orderRes.data.order_number)}`);
    } catch (err) { showToast(err.message, 'error'); }
    finally { submission.current = false; setSubmitting(false); }
  };

  const missingVariant = items.some(i => !i.variant_id);

  return <main className="page-container" style={{ maxWidth: 820, margin: '3rem auto', padding: '1.5rem' }}>
    <h1>주문 및 결제</h1>
    <p>배송지를 입력한 뒤 결제수단을 선택해주세요.</p>
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
        <h2>결제 안내</h2>
        {paymentsEnabled ?
          <p>다음 화면에서 카드 또는 간편결제로 결제할 수 있습니다.</p> :
          <p className="checkout-payment-note">현재 결제를 준비 중입니다. 잠시 후 다시 이용해주세요.</p>
        }
      </section>
      <button type="submit" disabled={!ready || !paymentsEnabled || submitting} className="checkout-pay-button">
        {submitting ? '주문 확인 중…' : '결제수단 선택하기'}
      </button>
    </form>
  </main>;
}
