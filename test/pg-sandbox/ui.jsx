import React from 'react';
import { createRoot } from 'react-dom/client';
import { TossPaymentPage, TossPaymentSuccessPage, TossPaymentFailPage } from '../../src/pages/TossPaymentPage.jsx';
import AdminPaymentActions from '../../src/components/admin/AdminPaymentActions.jsx';

const path = location.pathname;
const Page = path.endsWith('/success') ? TossPaymentSuccessPage
  : path.endsWith('/fail') ? TossPaymentFailPage
    : path === '/admin' ? () => <AdminPaymentActions orderId="lab-uuid" /> : TossPaymentPage;
createRoot(document.getElementById('root')).render(<React.StrictMode>
  <header><h2>토스 테스트 결제 — 실제 청구 없음</h2>
    <p>실제 토스 SDK/API · 임시 메모리 저장. 재시작하면 주문 기록이 사라집니다.</p>
    <a href="/admin">테스트 승인 후 환불</a>
  </header><Page />
</React.StrictMode>);
