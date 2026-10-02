import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Link } from 'wouter';
import { POLICY_VERSION, business } from '../config/business.js';
import { CommercePolicyNotice } from '../components/common/CommercePolicyNotice.jsx';
import { api } from '../utils/api.js';

const emptyForm = { recipient: '', phone: '', postal_code: '', address: '', detail_address: '' };
const toForm = addr => addr ? ({
  recipient: addr.recipient || '',
  phone: addr.phone || '',
  postal_code: addr.postal_code || '',
  address: addr.address || '',
  detail_address: addr.detail_address || '',
}) : { ...emptyForm };

export function CheckoutPage() {
  const { items } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ ...emptyForm });
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState('new');
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoteRetry, setQuoteRetry] = useState(0);
  const submission = useRef(false);
  // Idempotency keys must match /^[A-Za-z0-9._:-]{8,200}$/ (backend).
  // crypto.randomUUID throws on non-secure contexts / old browsers — fall back.
  const newIdempotencyKey = () => {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch { /* fall through to Math.random fallback */ }
    const rand = Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
    return `${Date.now().toString(36)}-${rand}`.slice(0, 64);
  };
  const orderKey = useRef(newIdempotencyKey());
  const update = e => { setForm({ ...form, [e.target.name]: e.target.value }); setFormTouched(true); };

  const pickAddress = id => {
    setSelectedId(id);
    setFormTouched(false);
    if (id === 'new') {
      setForm({ ...emptyForm, recipient: user?.name || form.recipient || '' });
      return;
    }
    const found = addresses.find(a => String(a.id) === String(id));
    if (found) setForm(toForm(found));
  };

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

  // Load saved addresses once logged in; prefill from default/latest.
  useEffect(() => {
    let active = true;
    if (!isLoggedIn) { setAddresses([]); setSelectedId('new'); return () => { active = false; }; }
    setLoadingAddresses(true);
    api.get('/me/addresses')
      .then(res => {
        if (!active) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setAddresses(list);
        if (list.length > 0 && !formTouched) {
          const preferred = list.find(a => a.is_default) || list[0];
          setSelectedId(String(preferred.id));
          setForm(toForm(preferred));
        } else if (list.length === 0 && !formTouched) {
          setForm(f => ({ ...f, recipient: f.recipient || user?.name || '' }));
        }
      })
      .catch(() => { if (active) setAddresses([]); })
      .finally(() => { if (active) setLoadingAddresses(false); });
    return () => { active = false; };
  }, [isLoggedIn]);

  // Keep recipient in sync with profile name until user edits the form.
  useEffect(() => {
    if (!formTouched && user?.name) setForm(f => (f.recipient ? f : { ...f, recipient: user.name }));
  }, [user, formTouched]);

  useEffect(() => {
    let active = true;
    setQuote(null); setQuoteError('');
    if (isLoggedIn && items.length && items.every(i => i.variant_id)) {
      api.post('/checkout/quote', { items: items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })) })
        .then(r => { if (active && r.success) setQuote(r.data); })
        .catch(() => { if (active) setQuoteError('주문금액을 확인할 수 없습니다. 상품 재고와 로그인 상태를 확인해주세요.'); });
    }
    return () => { active = false; };
  }, [items, isLoggedIn, quoteRetry]);

  const submit = async e => {
    e.preventDefault();
    if (submission.current) return;
    if (!paymentsEnabled) { showToast('현재 결제를 준비 중입니다.', 'error'); return; }
    if (!isLoggedIn) { setLocation('/auth'); return; }
    if (!termsAgreed) { showToast('이용약관과 주문 조건을 확인해주세요.', 'error'); return; }
    const unresolved = items.filter(i => !i.variant_id);
    if (unresolved.length > 0) {
      showToast('장바구니에 카탈로그 동기화가 필요한 상품이 있습니다. 상품을 다시 담아주세요.', 'error');
      return;
    }
    if (items.length === 0) { showToast('장바구니가 비어 있습니다.', 'error'); return; }
    submission.current = true; setSubmitting(true);
    try {
      // Persist to address book when requested: new entry, or edited saved entry saved as new.
      let addressId = selectedId !== 'new' ? selectedId : null;
      const selected = addressId ? addresses.find(a => String(a.id) === String(addressId)) : null;
      const differs = !selected || ['recipient', 'phone', 'postal_code', 'address', 'detail_address'].some(k => (selected[k] || '') !== (form[k] || ''));
      if (saveAddress && (selectedId === 'new' || differs)) {
        try {
          const saved = await api.post('/me/addresses', { ...form, label: addressLabel, is_default: addresses.length === 0 });
          if (saved?.data?.id) addressId = saved.data.id;
        } catch (err) {
          // Saving is convenience only; a full address form still creates the order snapshot.
          console.error('Save address failed:', err);
        }
      }
      const quoteRes = await api.post('/checkout/quote', { items: items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })), address: form });
      if (!quoteRes.success) throw new Error('Quote failed');
      if (!quote || quote.amount !== quoteRes.data.amount) { setQuote(quoteRes.data); showToast('주문금액이 변경되었습니다. 확인 후 다시 진행해주세요.', 'error'); return; }
      const orderRes = await api.post('/orders', { ...quoteRes.data, address: form, terms_agreed: true, terms_version: POLICY_VERSION }, { headers: { 'Idempotency-Key': orderKey.current } });
      if (!orderRes.data?.order_number) throw new Error('주문을 확인할 수 없습니다.');
      // Keep cart contents until an authoritative paid result; a redirect or
      // order creation is not proof of payment. Do not lose later cart changes.
      setLocation(`/checkout/toss?order=${encodeURIComponent(orderRes.data.order_number)}`);
    } catch (err) {
      // Cart changed since the last attempt reuses the key with a different
      // body (backend: IDEMPOTENCY_KEY_REUSE) — rotate so retry can proceed.
      if (err?.message === 'IDEMPOTENCY_KEY_REUSE') {
        orderKey.current = newIdempotencyKey();
        showToast('장바구니가 변경되어 주문번호를 새로 발급했습니다. 다시 진행해주세요.', 'error');
      } else {
        showToast(err.message, 'error');
      }
    }
    finally { submission.current = false; setSubmitting(false); }
  };

  const missingVariant = items.some(i => !i.variant_id);

  return <main className="page-container" style={{ maxWidth: 820, margin: '3rem auto', padding: '1.5rem' }}>
    <h1>주문 및 결제</h1>
    <p>배송지를 입력한 뒤 결제수단을 선택해주세요.</p>
    {!isLoggedIn && <p><Link href="/auth">로그인 후 주문 계속하기</Link></p>}
    {missingVariant && <p style={{ color: '#b45309', background: '#fef3c7', padding: '10px 12px', borderRadius: 6, fontSize: 13 }}>일부 장바구니 항목이 이전 버전에서 저장되었습니다. 해당 상품을 제거 후 다시 담아주세요.</p>}
    <form onSubmit={submit} style={{ display: 'grid', gap: '1.25rem' }}>
      <section className="checkout-panel"><h2>주문 상품과 결제금액</h2>
        {items.map(i => <p key={i.id}>{i.name_ko || i.name_en} · {i.size} / {i.color_ko || i.color_en} · {i.quantity}개</p>)}
        {quote ? <dl>
          <dt>상품금액</dt><dd>{quote.subtotal.toLocaleString('ko-KR')}원</dd>
          <dt>할인</dt><dd>−{quote.discount.toLocaleString('ko-KR')}원</dd>
          <dt>배송비</dt><dd>{quote.shipping.toLocaleString('ko-KR')}원</dd>
          <dt><strong>총 결제금액 (부가세 포함)</strong></dt><dd><strong>{quote.amount.toLocaleString('ko-KR')}원</strong></dd>
        </dl> : <p role="status">{quoteError || (isLoggedIn ? '주문금액 확인 중…' : '로그인 후 주문금액을 확인할 수 있습니다.')}</p>}
        {quoteError && <button type="button" onClick={() => setQuoteRetry(n => n + 1)}>주문금액 다시 확인</button>}
      </section>
      <section className="checkout-panel"><h2>배송지</h2>
        {isLoggedIn && (loadingAddresses ? <p role="status">저장된 배송지 불러오는 중…</p> : addresses.length > 0 && (
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {addresses.map(a => (
              <label key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}>
                <input type="radio" name="savedAddress" checked={String(selectedId) === String(a.id)} onChange={() => pickAddress(String(a.id))} />
                <span style={{ fontSize: 13 }}>
                  <strong>{a.label ? `${a.label} · ` : ''}{a.recipient}</strong> ({a.phone}){a.is_default && ' · 기본'}
                  <br />[{a.postal_code}] {a.address} {a.detail_address}
                </span>
              </label>
            ))}
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <input type="radio" name="savedAddress" checked={selectedId === 'new'} onChange={() => pickAddress('new')} />
              새 주소 입력
            </label>
          </div>
        ))}
        {[
          ['recipient', '받는 분'],
          ['phone', '연락처'],
          ['postal_code', '우편번호'],
          ['address', '주소'],
          ['detail_address', '상세주소'],
        ].map(([name, label]) =>
          <label key={name} style={{ display: 'grid', gap: 4 }}>{label}<input required={name !== 'detail_address'} name={name} value={form[name] || ''} onChange={update} className="form-input" /></label>
        )}
        {isLoggedIn && (
          <>
            <label style={{ display: 'grid', gap: 4 }}>주소 별칭 (선택)<input name="addressLabel" value={addressLabel} onChange={e => setAddressLabel(e.target.value)} placeholder="예: 집, 회사" className="form-input" maxLength={40} /></label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} />
              이 주소를 주소록에 저장
            </label>
          </>
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
      <section className="checkout-panel"><h2>주문 조건 확인</h2>
        <p>판매자: {business.companyName} · 고객센터 {business.phoneFormatted}</p>
        <CommercePolicyNotice />
        <p>주문·배송을 위해 수령인 이름·전화번호·주소를 처리하며, 거래기록은 법령에 따라 5년 보관합니다. <Link href="/privacy">개인정보처리방침</Link></p>
        <label style={{ display: 'flex', gap: 10, alignItems: 'start' }}>
          <input type="checkbox" checked={termsAgreed} required onChange={e => setTermsAgreed(e.target.checked)} />
          <span>[필수] <Link href="/terms">이용약관</Link>에 동의하고 주문 상품·금액과 <Link href="/refund-exchange">취소·환불 조건</Link>을 확인했습니다.</span>
        </label>
      </section>
      <button type="submit" disabled={!ready || !paymentsEnabled || submitting || !termsAgreed || (isLoggedIn && !quote)} className="checkout-pay-button">
        {submitting ? '주문 확인 중…' : '결제수단 선택하기'}
      </button>
    </form>
  </main>;
}
