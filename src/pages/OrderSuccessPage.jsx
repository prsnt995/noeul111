import React, { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { api } from '../utils/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function OrderSuccessPage() {
  const [, params] = useRoute('/order-success/:orderNumber');
  const { formatKRW } = useLanguage(); const { showToast } = useToast();
  const [order, setOrder] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!params?.orderNumber) return; api.get(`/orders/${params.orderNumber}`).then(r => setOrder(r.data)).catch(e => showToast(e.message, 'error')).finally(() => setLoading(false)); }, [params?.orderNumber]);
  // Fire Meta Purchase event on page load (browser pixel)
  useEffect(() => {
    if (!order) return;
    const purchaseData = {
      value: order.amount || 0,
      currency: order.currency || 'KRW',
      content_name: order.order_number,
      content_ids: [],
      num_items: 1,
      order_source: order.order_source,
    };
    // @window.fbq injected by Meta Pixel base code in _document or index.html
    if (typeof window !== 'undefined' && window.fbq) {
      try {
        window.fbq('track', 'Purchase', purchaseData);
        console.log('[order-success] Browser Pixel Purchase fired:', purchaseData);
      } catch (e) {
        console.warn('[order-success] Pixel track failed:', e);
      }
    }
  }, [order]);
  if (loading) return <main className="page-container"><p>주문을 확인하는 중입니다…</p></main>;
  if (!order) return <main className="page-container"><p>주문을 찾을 수 없습니다.</p><Link href="/">홈으로</Link></main>;
  return <main className="page-container" style={{maxWidth:720,margin:'5rem auto',padding:'1.5rem'}}>
    <h1>주문이 생성되었습니다.</h1><p>주문번호: <strong>{order.order_number}</strong></p>
    <p>결제 상태: {order.status === 'paid' ? '결제 완료' : 'Toss 카드 결제 대기'}</p><p>결제 금액: {formatKRW(order.amount)}</p>
    <p>카드 결제가 완료되기 전에는 상품이 확정되지 않습니다. 결제 창을 닫았다면 주문 내역에서 다시 시도하세요.</p>
    <Link href="/account">주문 내역 보기</Link>
  </main>;
}
