import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Link } from 'wouter';
import { POLICY_VERSION } from '../config/business.js';
import { CommercePolicyNotice } from '../components/common/CommercePolicyNotice.jsx';
import { api } from '../utils/api.js';
import { formatKoreanPhone } from '../utils/formatters.js';

const emptyForm = { recipient: '', phone: '', postal_code: '', address: '', detail_address: '' };
const toForm = addr => addr ? ({
  recipient: addr.recipient || '',
  phone: addr.phone || '',
  postal_code: addr.postal_code || '',
  address: addr.address || '',
  detail_address: addr.detail_address || '',
}) : { ...emptyForm };

export function CheckoutPage() {
  const { items: cartItems, buyNowItem, clearBuyNow, appliedCoupon, clearAppliedCoupon } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();
  // Buy Now checks out exactly one line and leaves the cart untouched.
  const isBuyNow = useMemo(() => new URLSearchParams(search || '').get('mode') === 'buynow', [search]);
  const items = useMemo(
    () => (isBuyNow ? (buyNowItem ? [buyNowItem] : []) : cartItems),
    [isBuyNow, buyNowItem, cartItems]
  );
  // Same option already in the cart is the exact case that used to inflate the
  // quantity (1→2→3). Explain that it is not part of this order.
  const duplicateInCart = useMemo(() => {
    if (!isBuyNow || !buyNowItem?.variant_id) return null;
    return cartItems.find(i => i.variant_id === buyNowItem.variant_id) || null;
  }, [isBuyNow, buyNowItem, cartItems]);
  const [form, setForm] = useState({ ...emptyForm });
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState('new');
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoteRetry, setQuoteRetry] = useState(0);
  const submission = useRef(false);
  // Tracks explicit user edits so a late address-book response can't overwrite
  // a form the customer has already started filling in.
  const touchedRef = useRef(false);
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

  // --- UTM Capture from referral URL ---
  const [utm_params, setUtm_params] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
  });
  useEffect(() => {
    const params = new URLSearchParams(search || '');
    const parsed = {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || '',
    };
    setUtm_params(parsed);
  }, [search]);
  const update = e => {
    const { name, value } = e.target;
    touchedRef.current = true;
    setForm(f => ({ ...f, [name]: value }));
    setFormTouched(true);
  };

  const pickAddress = id => {
    touchedRef.current = true;
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
    }
    checkPayments();
  }, []);

  // Keep recipient in sync with profile name until the user edits the form or
  // picks a saved address (which fills recipient itself).
  useEffect(() => {
    if (formTouched || !user?.name) return;
    setForm(f => (f.recipient ? f : { ...f, recipient: user.name }));
  }, [user, formTouched]);

  // Load the saved address book so the customer can pick an existing address.
  useEffect(() => {
    if (!isLoggedIn) { setAddresses([]); setSelectedId('new'); return; }
    let active = true;
    setLoadingAddresses(true);
    api.get('/me/addresses')
      .then(res => {
        if (!active) return;
        const list = res?.success ? (res.data || []) : [];
        setAddresses(list);
        const preferred = list.find(a => a.is_default) || list[0];
        if (preferred && !touchedRef.current) {
          setSelectedId(String(preferred.id));
          setForm(toForm(preferred));
          setFormTouched(false);
        }
      })
      .catch(err => { console.error('Fetch addresses failed:', err); })
      .finally(() => { if (active) setLoadingAddresses(false); });
    return () => { active = false; };
  }, [isLoggedIn]);

  useEffect(() => {
    let active = true;
    setQuote(null); setQuoteError('');
    if (isLoggedIn && items.length && items.every(i => i.variant_id)) {
      api.post('/checkout/quote', { items: items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })), coupon_code: appliedCoupon?.code || null })
        .then(r => {
          if (!active || !r.success) return;
          // A previously applied coupon can become invalid after cart changes;
          // surface that instead of silently charging the undiscounted total.
          if (appliedCoupon?.code && !(r.data?.discount > 0)) {
            clearAppliedCoupon();
            showToast('적용한 쿠폰을 사용할 수 없어 해제했습니다.', 'error');
          }
          setQuote(r.data);
        })
        .catch(() => { if (active) setQuoteError('주문금액을 확인할 수 없습니다. 상품 재고와 로그인 상태를 확인해주세요.'); });
    }
    return () => { active = false; };
  }, [items, isLoggedIn, quoteRetry, appliedCoupon?.code]);

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
    if (items.length === 0) {
      showToast(isBuyNow ? '바로 구매 정보를 찾을 수 없습니다. 상품 페이지에서 다시 시도해주세요.' : '장바구니가 비어 있습니다.', 'error');
      return;
    }
    const missing = ['recipient', 'phone', 'postal_code', 'address'].filter(k => !String(form[k] || '').trim());
    if (missing.length > 0) { showToast('배송지 정보를 모두 입력해주세요.', 'error'); return; }
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
      const quoteRes = await api.post('/checkout/quote', { items: items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })), coupon_code: appliedCoupon?.code || null, address: form, utm_params },);
      if (!quoteRes.success) throw new Error('Quote failed');
      // If a quote was already shown, make sure the amount still matches. When
      // no quote loaded yet (slow/failed initial request) just adopt this one.
      if (quote && quote.amount !== quoteRes.data.amount) { setQuote(quoteRes.data); showToast('주문금액이 변경되었습니다. 확인 후 다시 진행해주세요.', 'error'); return; }
      setQuote(quoteRes.data);
      const orderRes = await api.post('/orders', { ...quoteRes.data, coupon_code: appliedCoupon?.code || null, address: form, terms_agreed: true, terms_version: POLICY_VERSION, utm_params }, { headers: { 'Idempotency-Key': orderKey.current } });
      if (!orderRes.data?.order_number) throw new Error('주문을 확인할 수 없습니다.');
      // The success page has to know which piece of state to clear once the
      // payment is confirmed: buy-now must never wipe the customer's cart.
      try { sessionStorage.setItem('noeul_checkout_mode', isBuyNow ? 'buynow' : 'cart'); } catch { /* storage unavailable */ }
      if (isBuyNow) clearBuyNow();
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
  const selectedAddress = selectedId !== 'new' ? addresses.find(a => String(a.id) === String(selectedId)) : null;
  const addressEdited = !selectedAddress || ['recipient', 'phone', 'postal_code', 'address', 'detail_address'].some(k => (selectedAddress[k] || '') !== (form[k] || ''));

  return <main className="page-container" style={{ maxWidth: 820, margin: '3rem auto', padding: '1.5rem' }}>
    <h1>주문 및 결제</h1>
    <p>배송지를 입력한 뒤 결제수단을 선택해주세요.</p>
    {isBuyNow && (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
        <span style={{ background: '#18181b', color: '#ffffff', borderRadius: 999, padding: '3px 10px', fontWeight: 700, fontSize: 12 }}>바로 구매</span>
        <span style={{ color: '#334155' }}>선택한 상품 1건만 주문합니다. 장바구니에 담긴 상품은 포함되지 않습니다.</span>
        {cartItems.length > 0 && (
          <Link href="/cart" style={{ marginLeft: 'auto', fontWeight: 700, color: '#18181b' }}>
            장바구니 상품 {cartItems.reduce((n, i) => n + (i.quantity || 0), 0)}개 보기 →
          </Link>
        )}
      </div>
    )}
    {duplicateInCart && (
      <p style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '10px 12px', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
        장바구니에 같은 상품이 {duplicateInCart.quantity}개 담겨 있습니다. 이번 주문에는 포함되지 않으니, 함께 구매하시려면 장바구니에서 진행해주세요.
      </p>
    )}
    {isBuyNow && items.length === 0 && (
      <p style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', padding: '10px 12px', borderRadius: 6, fontSize: 13 }}>
        바로 구매할 상품 정보를 찾을 수 없습니다. 상품 페이지에서 다시 시도하거나 <Link href="/cart">장바구니로 이동</Link>해주세요.
      </p>
    )}
    {!isLoggedIn && <p><Link href="/auth">로그인 후 주문 계속하기</Link></p>}
    {missingVariant && <p style={{ color: '#b45309', background: '#fef3c7', padding: '10px 12px', borderRadius: 6, fontSize: 13 }}>일부 장바구니 항목이 이전 버전에서 저장되었습니다. 해당 상품을 제거 후 다시 담아주세요.</p>}
    <form onSubmit={submit} noValidate>
    <section className="checkout-panel"><h2>주문 상품과 결제금액</h2>
      {items.map(i => <p key={i.id}>{i.name_ko || i.name_en} · {i.size} / {i.color_ko || i.color_en} · {i.quantity}개</p>)}
      {quote ? <dl>
        <dt>상품금액</dt><dd>{quote.subtotal.toLocaleString('ko-KR')}원</dd>
        <dt>할인</dt><dd>−{quote.discount.toLocaleString('ko-KR')}원</dd>
        {appliedCoupon?.code && <><dt>쿠폰</dt><dd>{appliedCoupon.code}</dd></>}
        <dt>배송비</dt><dd>{quote.shipping === 0 ? '무료 (0원)' : `${quote.shipping.toLocaleString('ko-KR')}원`}</dd>
        <dt><strong>총 결제금액 (부가세 포함)</strong></dt><dd><strong>{quote.amount.toLocaleString('ko-KR')}원</strong></dd>
      </dl> : <p role="status">{quoteError || (isLoggedIn ? '주문금액 확인 중…' : '로그인 후 주문금액을 확인할 수 있습니다.')}</p>}
      {quoteError && <button type="button" onClick={() => setQuoteRetry(n => n + 1)}>주문금액 다시 확인</button>}
    </section>
    <section className="checkout-panel">
      <div className="checkout-panel-head">
        <h2>배송지</h2>
        {isLoggedIn && !loadingAddresses && addresses.length > 0 && (
          <span className="checkout-panel-hint">저장된 배송지 {addresses.length}개</span>
        )}
      </div>

      {isLoggedIn && loadingAddresses && (
        <div className="checkout-address-skeleton" role="status" aria-label="저장된 배송지 불러오는 중">
          <span /><span />
        </div>
      )}

      {isLoggedIn && !loadingAddresses && addresses.length > 0 && (
        <div className="checkout-address-list" role="radiogroup" aria-label="배송지 선택">
          {addresses.map(a => {
            const active = String(selectedId) === String(a.id);
            return (
              <label key={a.id} className={`checkout-address-option${active ? ' is-selected' : ''}`}>
                <input type="radio" name="savedAddress" value={a.id} checked={active} onChange={() => pickAddress(String(a.id))} />
                <span className="checkout-address-radio" aria-hidden="true" />
                <span className="checkout-address-body">
                  <span className="checkout-address-head">
                    <span className="checkout-address-name">{a.recipient}</span>
                    {a.label && <span className="checkout-address-label">{a.label}</span>}
                    {a.is_default && <span className="checkout-address-default">기본</span>}
                  </span>
                  <span className="checkout-address-phone">{formatKoreanPhone(a.phone)}</span>
                  <span className="checkout-address-lines">
                    <span className="checkout-address-postal">{a.postal_code}</span>
                    {a.address} {a.detail_address}
                  </span>
                </span>
              </label>
            );
          })}
          <label className={`checkout-address-option checkout-address-option--new${selectedId === 'new' ? ' is-selected' : ''}`}>
            <input type="radio" name="savedAddress" value="new" checked={selectedId === 'new'} onChange={() => pickAddress('new')} />
            <span className="checkout-address-radio" aria-hidden="true" />
            <span className="checkout-address-body">
              <span className="checkout-address-head">
                <span className="checkout-address-name">새 주소 입력</span>
              </span>
              <span className="checkout-address-lines">다른 곳으로 배송하려면 새 배송지를 입력하세요.</span>
            </span>
          </label>
        </div>
      )}

      {isLoggedIn && !loadingAddresses && addresses.length === 0 && (
        <p className="checkout-address-empty">저장된 배송지가 없습니다. 아래에 배송지 정보를 입력해주세요.</p>
      )}

      <div className="checkout-field-grid">
        <div className="checkout-field-row checkout-field-row--2">
          <div className="checkout-field">
            <label htmlFor="recipient">받는 분</label>
            <input id="recipient" name="recipient" type="text" value={form.recipient || ''} onChange={update} required autoComplete="name" maxLength={60} placeholder="홍길동" />
          </div>
          <div className="checkout-field">
            <label htmlFor="phone">연락처</label>
            <input id="phone" name="phone" type="text" inputMode="numeric" value={form.phone || ''} onChange={update} required autoComplete="tel" maxLength={30} placeholder="010-0000-0000" />
          </div>
        </div>
        <div className="checkout-field-row checkout-field-row--postal">
          <div className="checkout-field">
            <label htmlFor="postal_code">우편번호</label>
            <input id="postal_code" name="postal_code" type="text" inputMode="numeric" value={form.postal_code || ''} onChange={update} required autoComplete="postal-code" maxLength={20} placeholder="06001" />
          </div>
          <div className="checkout-field">
            <label htmlFor="address">주소</label>
            <input id="address" name="address" type="text" value={form.address || ''} onChange={update} required autoComplete="address-line1" maxLength={200} placeholder="서울특별시 강남구…" />
          </div>
        </div>
        <div className="checkout-field">
          <label htmlFor="detail_address">상세 주소 <span className="checkout-field-optional">(선택)</span></label>
          <input id="detail_address" name="detail_address" type="text" value={form.detail_address || ''} onChange={update} autoComplete="address-line2" maxLength={200} placeholder="102동 1405호" />
        </div>
      </div>

      {isLoggedIn && addressEdited && (
        <div className="checkout-save-address">
          <label className="checkout-save-toggle">
            <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} />
            <span>
              <strong>{selectedId === 'new' ? '이 배송지를 주소록에 저장' : '수정한 배송지를 새 주소로 저장'}</strong>
              <small>다음 주문 때 다시 입력하지 않아도 됩니다.</small>
            </span>
          </label>
          {saveAddress && (
            <input className="checkout-save-label" type="text" value={addressLabel} onChange={e => setAddressLabel(e.target.value)} placeholder="배송지 이름 (예: 집, 회사) — 선택" maxLength={40} />
          )}
        </div>
      )}
    </section>
    <section className="checkout-panel"><h2>주문 조건 확인</h2>
      <CommercePolicyNotice />
      <label className="checkout-terms">
        <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} required />
        <span>이용약관 및 주문 조건(배송·취소·반품 안내)을 확인했으며 이에 동의합니다.</span>
      </label>
    </section>
    <button type="submit" disabled={submitting || missingVariant || items.length === 0} style={{ width: '100%', padding: 10, marginTop: 16, backgroundColor: '#166534', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, opacity: submitting || missingVariant || items.length === 0 ? 0.6 : 1, cursor: submitting || missingVariant || items.length === 0 ? 'not-allowed' : 'pointer' }}>{submitting ? '처리 중…' : isBuyNow ? '바로 구매 확정하기' : '주문 확정하기'}</button>
    </form>
  </main>;
}