import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Truck, ArrowLeft, Clock, MapPin, AlertCircle, HelpCircle } from 'lucide-react';

export function ShippingPage() {
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
            <Truck size={28} color="var(--accent-sunset, #e05638)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-sunset, #e05638)' }}>
              NOEUL SHIPPING POLICY
            </span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>
            배송정책
          </h1>
          <p style={{ color: '#8e8e93', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            NOEUL의 상품 배송 지역, 배송비 기준, 출고 마감 시간 및 소요 기간에 관한 상세 안내입니다.
          </p>
        </div>

        {/* Policy Body */}
        <div style={{ fontSize: '0.9375rem', lineHeight: 1.85, color: '#c7c7cc' }}>
          
          {/* Section 1: Coverage */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={20} color="var(--accent-sunset, #e05638)" />
              <span>1. 배송 지역 및 지정 택배사</span>
            </h2>
            <div style={{ backgroundColor: '#141416', borderRadius: '8px', padding: '20px', border: '1px solid #232328' }}>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>배송 지역:</strong> 대한민국 전국 (제주도 및 도서산간 지역 포함)</li>
                <li><strong>지정 택배사:</strong> CJ대한통운 (택배사 사정에 따라 우체국 또는 로젠택배로 변경될 수 있습니다)</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Shipping Rates & Free Threshold */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
              2. 배송비 및 무료배송 혜택
            </h2>
            <div style={{ backgroundColor: '#141416', borderRadius: '8px', padding: '20px', border: '1px solid #232328', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #232328', paddingBottom: '10px' }}>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>전국 무료배송 기준</span>
                <span style={{ color: 'var(--accent-sunset, #e05638)', fontWeight: 700, fontSize: '1.0625rem' }}>실결제 금액 70,000원 이상 구매 시</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #232328', paddingBottom: '10px' }}>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>기본 배송비</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>3,000원 (70,000원 미만 구매 시)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>제주 및 도서산간 추가 배송비</span>
                <span style={{ color: '#8e8e93' }}>[수정 가능 예시 - 3,000원 추가]</span>
              </div>
            </div>
          </section>

          {/* Section 3: Delivery Times */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="var(--accent-sunset, #e05638)" />
              <span>3. 출고 마감 시간 및 평균 소요 기간</span>
            </h2>
            <div style={{ backgroundColor: '#141416', borderRadius: '8px', padding: '20px', border: '1px solid #232328' }}>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><strong>당일 출고 마감:</strong> 평일 오후 2시 이전 입금/결제 완료 주문 건에 한해 당일 출고를 원칙으로 합니다.</li>
                <li><strong>평균 배송 기간:</strong> 출고 후 평일 기준 <strong>1 ~ 3일</strong> 소요됩니다.</li>
                <li><strong>도서산간/제주도:</strong> 일반 배송일보다 1~2일 추가 소요될 수 있습니다.</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Delays & Issues */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} color="#f59e0b" />
              <span>4. 배송 지연 및 배송지 변경</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p>
                - 주문량이 급증하는 세일 기간, 명절 연휴 전후 또는 악천후 등 불가피한 사정으로 출고 및 배송이 지연될 경우 안내 문자 및 알림을 발송해 드립니다.
              </p>
              <p>
                - 배송지 변경은 상품 출고 전(‘상품 준비 중’ 상태)에 한하여 가능하며, 고객센터(01083615305) 또는 이메일(noeulenterprises@gmail.com)로 빠르게 요청해주셔야 합니다. 출고 이후에는 배송지 변경이 어려울 수 있습니다.
              </p>
            </div>
          </section>

          {/* Section 5: Customer Support */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HelpCircle size={20} color="var(--accent-sunset, #e05638)" />
              <span>5. 배송 관련 문의처</span>
            </h2>
            <div style={{ backgroundColor: '#141416', borderRadius: '8px', padding: '20px', border: '1px solid #232328' }}>
              <p style={{ margin: 0 }}>
                배송과 관련된 모든 문의사항은 NOEUL 고객센터 <strong>01083615305</strong> 또는 <strong>noeulenterprises@gmail.com</strong> (평일 09:00 - 17:00)으로 문의해주시면 친절히 안내해 드리겠습니다.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default ShippingPage;
