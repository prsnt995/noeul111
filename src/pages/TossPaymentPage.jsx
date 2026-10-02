import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { api } from '../utils/api.js';

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
        if (!status.canResume) { if (!disposed) setMessage(status.status === 'paid' ? '이미 결제된 주문입니다. 주문 내역을 확인해주세요.' : '결제 상태 확인 중이거나 재결제할 수 없는 주문입니다. 주문 내역을 확인해주세요.'); return; }
        const { data } = await api.post('/payments/toss/prepare', { orderId });
        if (disposed) return;
        setOrder(data);
        const toss = await loadTossPayments(data.clientKey);
        if (disposed) return;
        const widgets = toss.widgets({ customerKey: data.customerKey });
        await widgets.setAmount({ currency: 'KRW', value: data.amount });
        if (disposed) return;
        const methods = await widgets.renderPaymentMethods({ selector: '#toss-methods', variantKey: data.variantKey });
        if (disposed) { await methods.destroy(); return; }
        handles.push(methods);
        const agreement = await widgets.renderAgreement({ selector: '#toss-agreement', variantKey: data.agreementVariantKey });
        if (disposed) { await agreement.destroy(); return; }
        handles.push(agreement);
        widgetsRef.current = widgets;
        setReady(true);
      } catch { if (!disposed) setMessage('결제를 준비할 수 없습니다. 로그인 상태와 주문 내역을 확인해주세요.'); }
    }
    setup();
    return () => { disposed = true; widgetsRef.current = null; handles.forEach(handle => { handle.destroy().catch(() => {}); }); };
  }, [orderId]);
  async function pay() {
    if (lock.current || !ready) return;
    lock.current = true; setBusy(true); setMessage('');
    try {
      await widgetsRef.current.requestPayment({ orderId: order.orderId, orderName: order.orderName,
        successUrl: `${window.location.origin}/checkout/toss/success`,
        failUrl: `${window.location.origin}/checkout/toss/fail?order=${encodeURIComponent(orderId)}` });
    } catch (err) {
      if (!['USER_CANCEL', 'PAY_PROCESS_CANCELED'].includes(err.code)) setReady(false);
      setMessage(err.code === 'USER_CANCEL' || err.code === 'PAY_PROCESS_CANCELED' ? '결제를 취소했습니다. 다시 시도할 수 있어요.' : '결제 상태 확인이 필요합니다. 다시 결제하지 말고 주문 내역에서 확인해주세요.');
    } finally { lock.current = false; setBusy(false); }
  }
  return <main className="page-container" style={{ maxWidth: 820, margin: '3rem auto', padding: '1.5rem' }}>
    <h1>결제하기</h1>
    {order && <p>주문번호 {order.orderId} · {order.amount.toLocaleString('ko-KR')}원</p>}
    {message && <p role="alert">{message}</p>}
    <div id="toss-methods" /><div id="toss-agreement" />
    <button className="checkout-pay-button" disabled={!ready || busy} onClick={pay}>{busy ? '결제 진행 중…' : '결제하기'}</button>
    <p><Link href="/account">주문 내역 보기</Link></p>
  </main>;
}

export function TossPaymentSuccessPage() {
  const [state, setState] = useState({ loading: true, paid: false });
  // StrictMode 중복 실행 방지입니다. 새로고침/다중 탭 중복 방지는 서버 DB가 담당합니다.
  const attempt = useRef(null);
  useEffect(() => {
    let active = true;
    if (!attempt.current) attempt.current = (async () => {
      const query = new URLSearchParams(window.location.search);
      const orderId = query.get('orderId');
      const paymentKey = query.get('paymentKey');
      const rawAmount = query.get('amount');
      if (!orderId || !paymentKey || !/^\d+$/.test(rawAmount || '') || !Number.isSafeInteger(Number(rawAmount)) || Number(rawAmount) <= 0) throw new Error('INVALID_CALLBACK');
      await api.get('/me');
      const { data } = await api.post('/payments/toss/confirm', { orderId, paymentKey, amount: Number(rawAmount) });
      if (data?.status !== 'paid' || data.orderId !== orderId) throw new Error('UNCONFIRMED');
      return orderId;
    })();
    attempt.current.then(orderId => { if (active) setState({ loading: false, paid: true, orderId }); })
      .catch(() => { if (active) setState({ loading: false, paid: false }); });
    return () => { active = false; };
  }, []);
  return <main className="page-container" style={{ maxWidth: 720, margin: '3rem auto', padding: '1.5rem' }}>
    <h1>{state.loading ? '결제를 확인하고 있어요' : state.paid ? '결제가 완료되었습니다' : '결제 상태 확인이 필요합니다'}</h1>
    {!state.loading && !state.paid && <p role="alert">결제가 승인되었을 수 있으니 다시 결제하지 말고 주문 내역을 확인하거나 고객센터로 문의해주세요.</p>}
    {state.paid && <p>주문번호: {state.orderId}</p>}
    {state.paid && <p><Link href={`/order-success/${encodeURIComponent(state.orderId)}`}>주문 상세 보기</Link></p>}
    {!state.loading && !state.paid && <PaymentRecoveryButton onPaid={orderId => setState({ loading: false, paid: true, orderId })} />}
    <Link href="/account">주문 내역 보기</Link>
  </main>;
}

function PaymentRecoveryButton({ onPaid }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function recover() {
    setBusy(true);
    try {
      await api.get('/me');
      const orderId = new URLSearchParams(window.location.search).get('orderId');
      const { data } = await api.post('/payments/toss/recover', { orderId });
      if (data.status === 'paid' && !data.recoveryRequired) onPaid(orderId);
      else setMessage('현재 주문 상태: ' + data.status + '. 중복 결제하지 말고 주문 내역을 확인해주세요.');
    } catch { setMessage('아직 확인할 수 없습니다. 잠시 후 다시 조회하거나 고객센터로 문의해주세요.'); }
    finally { setBusy(false); }
  }
  return <div><button disabled={busy} onClick={recover}>결제 상태 다시 확인</button><p role="status">{message}</p></div>;
}

export function TossPaymentFailPage() {
  const query = new URLSearchParams(window.location.search);
  const orderId = query.get('order') || query.get('orderId');
  return <main className="page-container" style={{ maxWidth: 720, margin: '3rem auto', padding: '1.5rem' }}>
    <h1>결제가 완료되지 않았습니다</h1>
    <p>결제를 취소했거나 인증을 마치지 못했습니다. 주문 상태를 확인한 뒤 다시 시도해주세요.</p>
    {orderId && <p><Link href={`/checkout/toss?order=${encodeURIComponent(orderId)}`}>결제 다시 시도하기</Link></p>}
    <Link href="/account">주문 내역 보기</Link>
  </main>;
}
