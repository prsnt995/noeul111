import React from 'react';
import {createRoot} from 'react-dom/client';
import {TossPaymentPage,TossPaymentSuccessPage,TossPaymentFailPage} from '../../src/pages/TossPaymentPage.jsx';
import AdminPaymentActions from '../../src/components/admin/AdminPaymentActions.jsx';
const path=location.pathname;
const Page=path.endsWith('/success') ? TossPaymentSuccessPage : path.endsWith('/fail') ? TossPaymentFailPage : path === '/admin' ? () => <AdminPaymentActions orderId="lab-uuid" /> : TossPaymentPage;
createRoot(document.getElementById('root')).render(<React.StrictMode><header><h2>로컬 PG 검증실 — 실제 결제 없음</h2><p>운영 DB·토스 SDK 대역. 시나리오 선택 시 초기화.</p><nav>{['normal','timeout','db-failure','refund-timeout','cancel','disabled'].map(s=><a style={{marginRight:16}} key={s} href={`/reset?scenario=${s}`}>{s}</a>)}<a href="/admin">관리자 환불</a></nav></header><Page /></React.StrictMode>);
