import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { RefreshCw, ArrowLeft, CheckCircle2, XCircle, Truck, Phone, Mail } from 'lucide-react';

export function RefundExchangePage() {
  const { lang } = useLanguage();

  return (
    <div style={{ backgroundColor: 'var(--bg-primary, #0b0b0c)', color: 'var(--text-primary, #f4f4f5)', minHeight: '100vh', padding: '60px 0 100px' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Navigation Back Link */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-sunset, #e05638)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>

        {/* Page Header */}
        <div style={{ borderBottom: '1px solid var(--border-color, #232328)', paddingBottom: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <RefreshCw size={28} color="var(--accent-sunset, #e05638)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-sunset, #e05638)' }}>
              NOEUL RETURN & EXCHANGE POLICY
            </span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>
            환불 및 교환 정책
          </h1>
          <p style={{ color: '#8e8e93', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            NOEUL은 고객님의 만족스러운 쇼핑 경험을 위해 전자상거래법을 준수하며 정직하고 신속한 교환 및 반품 절차를 제공합니다.
          </p>
        </div>

        {/* Content Body */}
        <div style={{ fontSize: '0.9375rem', lineHeight: 1.85, color: '#c7c7cc' }}>
          
          {/* Section 1: Eligible Conditions */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} color="#22c55e" />
              <span>1. 교환 및 반품 가능 기준</span>
            </h2>
            <div style={{ backgroundColor: '#141416', borderRadius: '8px', padding: '20px', border: '1px solid #232328' }}>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><strong>신청 기간:</strong> 상품을 수령하신 날로부터 <strong>7일 이내</strong> 마이페이지 또는 고객센터를 통해 신청 가능합니다.</li>
                <li><strong>상품 상태:</strong> 의류는 시착만 한 상태이어야 하며, <strong>상품 택(Tag), 브랜드 라벨, 포장 비닐, 사은품</strong>이 훼손되지 않은 원상태 그대로여야 합니다.</li>
                <li><strong>하자 및 오배송:</strong> 수령하신 상품이 오배송 되었거나 상품 자체에 결함/하자가 있는 경우 배송비 포함 100% 무료로 교환 또는 환불해 드립니다.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Non-returnable Items */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <XCircle size={20} color="#ef4444" />
              <span>2. 교환 및 반품이 불가능한 경우 (법령 기준)</span>
            </h2>
            <div style={{ backgroundColor: '#141416', borderRadius: '8px', padding: '20px', border: '1px solid #232328' }}>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li>고객님의 부주의 또는 사용으로 인해 상품이 훼손되거나 가치가 현저히 감소한 경우</li>
                <li><strong>착용 흔적, 세탁, 수선, 향수/화장품 오염, 담배 냄새</strong> 등이 발생한 경우</li>
                <li>상품 택(Tag)을 제거하거나 훼손하여 상품 가치가 상실된 경우</li>
                <li>시간이 지나 재판매가 어려울 정도로 상품의 가치가 현저히 떨어진 경우</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Shipping Fee Rules */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Truck size={20} color="var(--accent-sunset, #e05638)" />
              <span>3. 반품 및 교환 배송비 안내</span>
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#18181c', color: '#ffffff' }}>
                    <th style={{ padding: '12px 16px', border: '1px solid #282830' }}>구분</th>
                    <th style={{ padding: '12px 16px', border: '1px solid #282830' }}>부담 주체</th>
                    <th style={{ padding: '12px 16px', border: '1px solid #282830' }}>배송비 금액 [수정 가능 예시]</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>단순 변심 (사이즈/컬러 교환)</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>고객 부담</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>왕복 배송비 6,000원</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>단순 변심 (전체 반품)</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>고객 부담</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>초기 무료배송 시 6,000원 (편도 반품 3,000원)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>상품 하자 및 오배송</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>NOEUL 전액 부담</td>
                    <td style={{ padding: '12px 16px', border: '1px solid #282830' }}>0원 (전액 회사 부담)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Refund Processing */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
              4. 환불 처리 절차 및 소요 시간
            </h2>
            <p style={{ marginBottom: '12px' }}>
              회수된 상품이 물류 센터에 입고되어 검품 완료된 후 환불이 진행됩니다.
            </p>
            <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>신용카드 / 간편결제:</strong> 승인 취소 후 카드사 사정에 따라 3~5영업일 이내 취소 반영됩니다.</li>
              <li><strong>무통장 입금:</strong> 고객님이 지정하신 예금주 본인 명의 계좌로 영업일 기준 1~2일 이내 환불 금액이 입금됩니다.</li>
            </ul>
          </section>

          {/* Section 5: Customer Contact */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
              5. 교환 및 반품 신청 문의
            </h2>
            <div style={{ backgroundColor: '#141416', borderRadius: '8px', padding: '20px', border: '1px solid #232328', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={16} color="var(--accent-sunset, #e05638)" />
                <span><strong>고객센터 전화:</strong> 01083615305 (평일 09:00 - 17:00)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={16} color="var(--accent-sunset, #e05638)" />
                <span><strong>이메일 문의:</strong> noeulenterprises@gmail.com</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default RefundExchangePage;
