import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { api } from '../utils/api.js';
import { useCart } from '../context/CartContext.jsx';

// https://docs.tosspayments.com/guides/v2/payment-widget/integration
// 위젯 전용 키 쌍으로 즉시 결제 수단을 렌더링합니다.
// 가상계좌는 별도 입금·만료 처리 구현 전 사용할 수 없습니다.
export function TossPaymentPage() {
  const orderId = new URLSearchParams(window.location.search).get('order') || '';
  const [order, setOrder] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const widgetsRef = useRef(null);
  const lock = useRef(false);

  useEffect(() => {
    setReady(false); setOrder(null); setMessage('');
    let disposed = false;
    const handles = [];

    async function setup() {
      try {
        if (!orderId) throw new Error('주문번호가 없습니다. 주문 내역을 확인해주세요.');
        // 리다이렉트 후 세션/CSRF를 갱신합니다.
        await api.get('/me');
        const { data: status } = await api.post('/payments/toss/recover', { orderId });
        if (!status.canResume) {
          if (!disposed) {
            setMessage(status.status === 'paid' ? '이미 결제 완료된 주문입니다.' : '결제 상태 확인 중이거나 재결제할 수 없는 주문입니다.');
          }
          return;
        }

        const { data } = await api.post('/payments/toss/prepare', { orderId });
        if (disposed) return;
        setOrder(data);

        const toss = await loadTossPayments(data.clientKey);
        if (disposed) return;

        const widgets = toss.widgets({ customerKey: data.customerKey });
        await widgets.setAmount({ currency: 'KRW', value: data.amount });
        if (disposed) return;

        // Clear containers before rendering to avoid duplicate widget errors (React StrictMode)
        const methodsEl = document.getElementById('toss-methods');
        const agreementEl = document.getElementById('toss-agreement');
        if (methodsEl) methodsEl.innerHTML = '';
        if (agreementEl) agreementEl.innerHTML = '';

        let methods;
        try {
          methods = await widgets.renderPaymentMethods({
            selector: '#toss-methods',
            ...(data.variantKey ? { variantKey: data.variantKey } : {})
          });
        } catch (vErr) {
          console.warn('[TossPayment] renderPaymentMethods variantKey fallback:', vErr);
          methods = await widgets.renderPaymentMethods({ selector: '#toss-methods' });
        }
        if (disposed) { await methods.destroy(); return; }
        handles.push(methods);

        let agreement;
        try {
          agreement = await widgets.renderAgreement({
            selector: '#toss-agreement',
            ...(data.agreementVariantKey ? { variantKey: data.agreementVariantKey } : {})
          });
        } catch (vErr) {
          console.warn('[TossPayment] renderAgreement variantKey fallback:', vErr);
          agreement = await widgets.renderAgreement({ selector: '#toss-agreement' });
        }
        if (disposed) { await agreement.destroy(); return; }
        handles.push(agreement);

        widgetsRef.current = widgets;
        setReady(true);
      } catch (err) {
        console.error('[TossPayment] setup failed:', err);
        if (!disposed) {
          setMessage(err?.message || '결제를 준비할 수 없습니다. 로그인 상태와 주문 내역을 확인해주세요.');
        }
      }
    }

    setup();
    return () => {
      disposed = true;
      widgetsRef.current = null;
      handles.forEach(handle => { handle.destroy().catch(() => {}); });
    };
  }, [orderId]);

  async function pay() {
    if (lock.current || !ready) return;
    lock.current = true; setBusy(true); setMessage('');
    try {
      await widgetsRef.current.requestPayment({
        orderId: order.orderId,
        orderName: order.orderName,
        successUrl: `${window.location.origin}/checkout/toss/success`,
        failUrl: `${window.location.origin}/checkout/toss/fail?order=${encodeURIComponent(orderId)}`
      });
    } catch (err) {
      console.warn('[TossPayment] requestPayment error:', err);
      if (!['USER_CANCEL', 'PAY_PROCESS_CANCELED'].includes(err?.code)) setReady(false);
      setMessage(err?.code === 'USER_CANCEL' || err?.code === 'PAY_PROCESS_CANCELED'
        ? '결제를 취소했습니다. 다시 시도할 수 있어요.'
        : (err?.message || '결제 결과를 확인하지 못했습니다. 결제가 승인되었을 수 있으니 다시 결제하지 말고 주문 내역을 확인해주세요.'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="page-container" style={{ maxWidth: 760, margin: '3rem auto', padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>주문 결제</h1>
        {order ? (
          <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>
            주문번호: <strong>{order.orderId}</strong> · 결제금액: <strong style={{ color: '#111827' }}>{order.amount.toLocaleString('ko-KR')}원</strong>
          </p>
        ) : (
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>주문 정보를 불러오는 중입니다...</p>
        )}
      </div>

      {message && (
        <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          <p style={{ margin: 0, fontWeight: 500 }}>{message}</p>
          {message.includes('완료') && (
            <p style={{ margin: '0.5rem 0 0' }}>
              <Link href={`/order-success/${encodeURIComponent(orderId)}`} style={{ textDecoration: 'underline', fontWeight: 600 }}>
                주문 상세 페이지로 이동하기
              </Link>
            </p>
          )}
        </div>
      )}

      {!ready && !message && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#6b7280' }}>
          <p style={{ fontSize: '0.95rem' }}>안전한 토스 결제창을 불러오는 중입니다...</p>
        </div>
      )}

      <div id="toss-methods" />
      <div id="toss-agreement" />

      {ready && (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            className="checkout-pay-button"
            disabled={!ready || busy}
            onClick={pay}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.05rem',
              fontWeight: 600,
              background: '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? '결제 진행 중…' : `${order?.amount?.toLocaleString('ko-KR')}원 결제하기`}
          </button>
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <Link href="/account" style={{ color: '#6b7280', fontSize: '0.9rem', textDecoration: 'underline' }}>
              주문 내역 보기
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export function TossPaymentSuccessPage() {
  const { clearCart } = useCart();
  const { clearBuyNow } = useCart();
  const clearCartRef = useRef(clearCart);
  clearCartRef.current = clearCart;
  const clearBuyNowRef = useRef(clearBuyNow);
  clearBuyNowRef.current = clearBuyNow;
  const [, setLocation] = useLocation();
  // phase: 'verifying' | 'paid' | 'failed' | 'unknown'
  const [state, setState] = useState({ phase: 'verifying', orderId: '', message: '' });
  // StrictMode 중복 실행 방지입니다. 새로고침/다중 탭 중복 방지는 서버 DB가 담당합니다.
  const attempt = useRef(null);

  useEffect(() => {
    let active = true;
    const timers = [];
    const finish = (phase, orderId, message = '') => {
      if (!active) return;
      setState({ phase, orderId, message });
      if (phase === 'paid' || phase === 'verifying') {
        // Always land on the order status page. Never leave the customer on a
        // dead-end "확인이 필요합니다" screen after their card was charged.
        timers.push(setTimeout(() => {
          if (active) setLocation(`/order-success/${encodeURIComponent(orderId)}`);
        }, phase === 'paid' ? 1200 : 2400));
      }
    };

    if (!attempt.current) attempt.current = (async () => {
      const query = new URLSearchParams(window.location.search);
      const orderId = query.get('orderId');
      const paymentKey = query.get('paymentKey');
      const amount = Number(query.get('amount'));
      if (!orderId || !paymentKey || !Number.isSafeInteger(amount) || amount <= 0) {
        finish('unknown', '');
        return;
      }
      // Refresh the session/CSRF cookie after the cross-site redirect. A failure
      // here must not hide a successful charge, so it is best-effort.
      try { await api.get('/me'); } catch { /* continue with confirm */ }

      let last = null;
      let paid = false;
      try {
        const { data } = await api.post('/payments/toss/confirm', { orderId, paymentKey, amount });
        last = data;
        paid = data?.status === 'paid' && data?.orderId === orderId;
      } catch { /* 결제는 승인됐을 수 있습니다 — 재결제가 아니라 조회로 확인합니다. */ }

      if (!paid) {
        // One automatic reconciliation. The recovery worker keeps retrying in
        // the background, and the order page polls, so no manual step is needed.
        try {
          const { data } = await api.post('/payments/toss/recover', { orderId });
          last = data || last;
          paid = data?.status === 'paid' && !data?.recoveryRequired;
        } catch { /* keep the ambiguous state */ }
      }

      if (paid) {
        let mode = 'cart';
        try { mode = sessionStorage.getItem('noeul_checkout_mode') || 'cart'; } catch { /* storage unavailable */ }
        if (mode === 'buynow') {
          // Buy Now must not wipe the cart the customer never checked out.
          clearBuyNowRef.current();
        } else {
          // Clear the React cart too, not just localStorage: otherwise the header
          // badge and cart page keep showing items already bought.
          clearCartRef.current();
          try { localStorage.removeItem('noeul_cart'); } catch {}
        }
        try { sessionStorage.removeItem('noeul_checkout_mode'); } catch {}
        finish('paid', orderId);
      } else if (last?.status && ['canceled', 'cancelled', 'aborted', 'expired', 'failed'].includes(last.status)) {
        finish('failed', orderId);
      } else {
        // Money may already be captured: show "확인 중" and hand over to the
        // order page, which polls until the state resolves.
        finish('verifying', orderId);
      }
    })();

    attempt.current.catch(() => finish('unknown', ''));
    return () => { active = false; timers.forEach(clearTimeout); };
  }, [setLocation]);

  const orderHref = state.orderId ? `/order-success/${encodeURIComponent(state.orderId)}` : '/account';

  return <main className="page-container" style={{ maxWidth: 720, margin: '3rem auto', padding: '1.5rem' }}>
    {state.phase === 'paid' && <>
      <h1>결제가 완료되었습니다</h1>
      <p>주문번호: <strong>{state.orderId}</strong></p>
      <p style={{ color: '#047857' }}>주문 상태 페이지로 이동합니다…</p>
      <p><Link href={orderHref}>주문 상태 바로 보기</Link></p>
    </>}

    {state.phase === 'verifying' && <>
      <h1>결제를 확인하고 있어요</h1>
      <p>결제는 정상적으로 접수되었습니다. 확인까지 보통 1~2분 걸립니다.</p>
      <p role="status" style={{ color: '#3730a3' }}>중복 결제하지 마세요. 주문 상태 페이지에서 자동으로 확인됩니다.</p>
      <p><Link href={orderHref}>주문 상태 바로 보기</Link></p>
    </>}

    {state.phase === 'failed' && <>
      <h1>결제가 완료되지 않았습니다</h1>
      <p>결제가 취소되었거나 승인이 이루어지지 않았습니다. 주문 금액은 청구되지 않았습니다.</p>
      {state.orderId && <p><Link href={`/checkout/toss?order=${encodeURIComponent(state.orderId)}`}>결제 다시 시도하기</Link></p>}
      <p><Link href="/account">주문 내역 보기</Link></p>
    </>}

    {state.phase === 'unknown' && <>
      <h1>결제 결과를 확인하지 못했습니다</h1>
      <p role="alert">결제가 승인되었을 수 있으니 다시 결제하지 말고 주문 내역을 확인해주세요.</p>
      <p><Link href="/account">주문 내역 보기</Link></p>
    </>}
  </main>;
}

export function TossPaymentFailPage() {
  const query = new URLSearchParams(window.location.search);
  const orderId = query.get('order') || query.get('orderId');
  // A customer-initiated cancel is not a failure: the order is still resumable
  // and nothing was charged. Keep the two messages apart.
  const canceled = query.get('code') === 'PAY_PROCESS_CANCELED';
  return <main className="page-container" style={{ maxWidth: 720, margin: '3rem auto', padding: '1.5rem' }}>
    <h1>{canceled ? '결제를 취소하셨습니다' : '결제가 완료되지 않았습니다'}</h1>
    <p>
      {canceled
        ? '주문은 그대로 남아 있습니다. 아래에서 결제를 다시 진행할 수 있습니다.'
        : '카드 승인이 이루어지지 않았습니다. 주문 금액은 청구되지 않았으니 다시 시도해주세요.'}
    </p>
    {orderId && <p><Link href={`/checkout/toss?order=${encodeURIComponent(orderId)}`}>결제 다시 시도하기</Link></p>}
    <Link href="/account">주문 내역 보기</Link>
  </main>;
}
