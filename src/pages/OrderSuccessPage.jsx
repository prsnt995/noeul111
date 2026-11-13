import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { api } from '../utils/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getCustomerStatus, CUSTOMER_ORDER_STEPS, customerStepIndex, formatDate } from '../utils/formatters.js';
import { CheckCircle2, Clock, ShieldCheck, MapPin, Package, ChevronRight } from 'lucide-react';

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 15; // ~60s, then hand over to My Page / customer service

function StatusIcon({ status, size = 20, color }) {
  if (status === 'paid') return <CheckCircle2 size={size} color={color} />;
  if (status === 'confirming') return <ShieldCheck size={size} color={color} />;
  return <Clock size={size} color={color} />;
}

export function OrderSuccessPage() {
  const [, params] = useRoute('/order-success/:orderNumber');
  const { formatKRW } = useLanguage();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const orderNumber = params?.orderNumber || '';
  // Meta Purchase must fire once per order and only after the money is captured.
  const purchaseFired = useRef(false);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }
    let active = true;
    api.get(`/orders/${encodeURIComponent(orderNumber)}`)
      .then(r => { if (active) setOrder(r.data); })
      .catch(e => { if (active) showToast(e.message, 'error'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderNumber]);

  // Payment confirmation can still be resolving when we land here. Poll until
  // it settles instead of asking the customer to keep refreshing.
  useEffect(() => {
    if (order?.status !== 'confirming' || pollCount >= MAX_POLLS) return;
    const timer = setTimeout(async () => {
      try {
        const r = await api.get(`/orders/${encodeURIComponent(orderNumber)}`);
        if (r.data) setOrder(r.data);
      } catch { /* transient — next poll will retry */ }
      setPollCount(c => c + 1);
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [order?.status, pollCount, orderNumber]);

  useEffect(() => {
    if (!order || order.status !== 'paid' || purchaseFired.current) return;
    const storageKey = `noeul_purchase_fired:${order.order_number}`;
    try { if (localStorage.getItem(storageKey)) { purchaseFired.current = true; return; } } catch { /* storage unavailable */ }
    purchaseFired.current = true;
    const purchaseData = {
      value: order.amount || 0,
      currency: order.currency || 'KRW',
      content_name: order.order_number,
      content_ids: (order.items || []).map(i => String(i.variant_id || '')).filter(Boolean),
      num_items: (order.items || []).reduce((n, i) => n + (i.quantity || 0), 0) || 1,
      order_source: order.order_source,
    };
    // @window.fbq injected by Meta Pixel base code in index.html
    if (typeof window !== 'undefined' && window.fbq) {
      try {
        window.fbq('track', 'Purchase', purchaseData);
        console.log('[order-success] Browser Pixel Purchase fired:', purchaseData);
      } catch (e) {
        console.warn('[order-success] Pixel track failed:', e);
      }
    }
    try { localStorage.setItem(storageKey, '1'); } catch { /* storage unavailable */ }
  }, [order]);

  const status = order?.status || 'pending_payment';
  const statusInfo = useMemo(() => getCustomerStatus(status), [status]);
  const stepIndex = customerStepIndex(status);

  if (loading) {
    return <main className="page-container" style={{ maxWidth: 720, margin: '5rem auto', padding: '1.5rem' }}>
      <p role="status">주문을 확인하는 중입니다…</p>
    </main>;
  }

  if (!order) {
    return <main className="page-container" style={{ maxWidth: 720, margin: '5rem auto', padding: '1.5rem' }}>
      <h1>주문을 찾을 수 없습니다</h1>
      <p>주문번호를 확인하시거나 주문 내역에서 다시 시도해주세요.</p>
      <p><Link href="/account">주문 내역 보기</Link> · <Link href="/">홈으로</Link></p>
    </main>;
  }

  return <main className="page-container" style={{ maxWidth: 720, margin: '4rem auto', padding: '1.5rem' }}>
    <header style={{ marginBottom: 24 }}>
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          backgroundColor: statusInfo.bg, color: statusInfo.text,
          border: `1px solid ${statusInfo.border || statusInfo.color}`,
          padding: '5px 12px', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 700,
        }}
      >
        <StatusIcon status={status} size={14} color={statusInfo.text} />
        {statusInfo.ko}
      </span>
      <h1 style={{ marginTop: 12, fontSize: '1.5rem', fontWeight: 700 }}>
        {status === 'paid' && '결제가 완료되었습니다'}
        {status === 'confirming' && '결제 확인 중입니다'}
        {status === 'pending_payment' && '결제가 아직 완료되지 않았습니다'}
        {!['paid', 'confirming', 'pending_payment'].includes(status) && statusInfo.ko}
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        주문번호 <strong style={{ fontFamily: 'monospace' }}>{order.order_number}</strong>
        {order.created_at && <> · {formatDate(order.created_at)}</>}
      </p>
    </header>

    {/* Payment state explanation + single clear next action */}
    {status === 'confirming' && (
      <section
        role="status"
        style={{
          background: statusInfo.bg, border: `1px solid ${statusInfo.border}`, color: statusInfo.text,
          borderRadius: 8, padding: '14px 16px', marginBottom: 20, fontSize: '0.875rem', lineHeight: 1.6,
        }}
      >
        <strong>결제는 정상적으로 접수되었습니다.</strong>
        <p style={{ margin: '4px 0 0' }}>
          판매자가 결제를 확인하고 있습니다. 보통 1~2분 안에 완료되며, 이 화면은 자동으로 갱신됩니다.
          중복 결제하지 마세요.
        </p>
        {pollCount >= MAX_POLLS && (
          <p style={{ margin: '8px 0 0', fontWeight: 600 }}>
            확인이 조금 지연되고 있습니다. <Link href="/account">주문 내역</Link>에서 계속 확인하실 수 있습니다.
          </p>
        )}
      </section>
    )}

    {status === 'pending_payment' && (
      <section
        style={{
          background: statusInfo.bg, border: `1px solid ${statusInfo.border}`, color: statusInfo.text,
          borderRadius: 8, padding: '14px 16px', marginBottom: 20, fontSize: '0.875rem', lineHeight: 1.6,
        }}
      >
        <strong>결제가 완료되지 않았습니다.</strong>
        <p style={{ margin: '4px 0 8px' }}>
          주문은 접수되어 있지만 카드 승인이 이루어지지 않았습니다. 아래 버튼으로 결제를 이어서 진행해주세요.
        </p>
        <Link
          href={`/checkout/toss?order=${encodeURIComponent(order.order_number)}`}
          style={{ display: 'inline-block', background: statusInfo.color, color: '#ffffff', padding: '8px 14px', borderRadius: 6, fontWeight: 700, fontSize: '0.8125rem' }}
        >
          결제 계속하기 →
        </Link>
      </section>
    )}

    {status === 'paid' && (
      <section
        style={{
          background: statusInfo.bg, border: `1px solid ${statusInfo.border}`, color: statusInfo.text,
          borderRadius: 8, padding: '14px 16px', marginBottom: 20, fontSize: '0.875rem', lineHeight: 1.6,
        }}
      >
        <strong>결제가 확인되었습니다.</strong>
        <p style={{ margin: '4px 0 0' }}>
          이제 판매자가 주문을 확인한 뒤 상품을 준비합니다. 배송이 시작되면 주문 내역에서 운송장을 확인하실 수 있습니다.
        </p>
      </section>
    )}

    {/* Fulfillment progress: only after the payment is confirmed */}
    {stepIndex >= 0 && (
      <section style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '18px 16px', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${CUSTOMER_ORDER_STEPS.length}, 1fr)`, textAlign: 'center' }}>
          {CUSTOMER_ORDER_STEPS.map((step, idx) => {
            const passed = stepIndex >= idx;
            const current = stepIndex === idx;
            return (
              <div key={step.key}>
                <div
                  style={{
                    width: 26, height: 26, borderRadius: '50%', margin: '0 auto 6px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: '#ffffff',
                    backgroundColor: current ? 'var(--accent-sunset)' : passed ? 'var(--text-primary)' : '#d1cecb',
                  }}
                >
                  {stepIndex > idx ? '✓' : idx + 1}
                </div>
                <p style={{ fontSize: '0.75rem', fontWeight: current ? 700 : 500, color: current ? 'var(--accent-sunset)' : passed ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {step.ko}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    )}

    {/* Order contents */}
    <section style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Package size={17} /> 주문 상품
      </h2>
      {(order.items || []).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>주문 상품 정보를 불러올 수 없습니다.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(order.items || []).map((item, idx) => (
          <div key={item.id || idx} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {item.image_url
              ? <img src={item.image_url} alt="" loading="lazy" style={{ width: 52, height: 66, objectFit: 'cover', borderRadius: 4, background: '#f4f4f5' }} />
              : <div style={{ width: 52, height: 66, borderRadius: 4, background: '#f4f4f5' }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {item.product_name_ko || item.product_name || item.name_ko || '상품'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {[item.size, item.color].filter(Boolean).join(' / ')} · {item.quantity}개
              </p>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
              {formatKRW((item.price || item.unit_price || 0) * (item.quantity || 1))}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', marginTop: 16, paddingTop: 14 }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>총 결제 금액</span>
        <strong style={{ fontSize: '1.0625rem' }}>{formatKRW(order.amount || 0)}</strong>
      </div>
    </section>

    {order.address && (order.address.recipient || order.address.address) && (
      <section style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20, marginBottom: 16, fontSize: '0.875rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={17} /> 배송지
        </h2>
        <p><strong>{order.address.recipient}</strong> {order.address.phone && `· ${order.address.phone}`}</p>
        <p style={{ color: 'var(--text-secondary)' }}>
          [{order.address.postal_code}] {order.address.address} {order.address.detail_address}
        </p>
      </section>
    )}

    <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20, fontSize: '0.875rem' }}>
      <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
        주문 내역에서 계속 확인 <ChevronRight size={14} />
      </Link>
      <Link href="/shop" style={{ color: 'var(--text-secondary)' }}>쇼핑 계속하기</Link>
    </nav>
  </main>;
}
