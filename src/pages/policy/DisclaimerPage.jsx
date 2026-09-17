import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ShieldAlert, ArrowLeft, Info, HelpCircle } from 'lucide-react';

export function DisclaimerPage() {
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
            <ShieldAlert size={28} color="var(--accent-sunset, #e05638)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-sunset, #e05638)' }}>
              NOEUL LEGAL DISCLAIMER
            </span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>
            면책조항
          </h1>
          <p style={{ color: '#8e8e93', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            주식회사 페리어스엔지가 운영하는 NOEUL 웹사이트의 상품 정보, 색상 차이, 가격 표기 및 서비스 제공 한계에 관한 면책사항 안내입니다.
          </p>
        </div>

        {/* Policy Body */}
        <div style={{ fontSize: '0.9375rem', lineHeight: 1.85, color: '#c7c7cc' }}>
          
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
              1. 상품 정보 및 정보의 정확성
            </h2>
            <p>
              NOEUL 웹사이트(noeul.me)에 게재된 모든 상품 설명, 소재 정보, 사이즈 가이드 및 가격 정보는 정확한 실측과 촬영을 기반으로 작성되었습니다. 다만, 오탈자나 예기치 못한 시스템 오류로 인해 일시적으로 표기상 오차가 발생할 수 있으며, 이 경우 회사는 발견 즉시 시정할 권리를 가집니다.
            </p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
              2. 모니터 해상도 및 촬영 조명에 따른 색상 차이
            </h2>
            <p>
              상품 룩북 및 상세 이미지의 색상은 스튜디오 조명, 야외 촬영 환경, 그리고 고객님이 사용하시는 스마트폰/모니터 디스플레이의 해상도 및 색감 설정에 따라 실제 상품과 미세한 차이가 발생할 수 있습니다. 이는 제품의 하자가 아니며, 색상 차이에 대한 교환/반품은 고객 변심 규정이 적용될 수 있습니다.
            </p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
              3. 가격 및 재고 변동
            </h2>
            <p>
              상품의 판매 가격 및 재고 수량은 원자재 가격 변동, 시즌 프로모션, 입고 상황에 따라 사전 고지 없이 변경될 수 있습니다. 결제가 완료된 주문 건에 대해서는 결제 당시의 가격이 적용됩니다.
            </p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
              4. 외부 링크 및 제3자 사이트
            </h2>
            <p>
              본 웹사이트는 고객 편의를 위해 인스타그램, 카카오톡, 결제대행사 등 제3자의 웹사이트 링크를 포함할 수 있습니다. 외부 사이트로 이동하신 후 제공되는 정보, 콘텐츠, 서비스에 대해서는 주식회사 페리어스엔지가 직접 보증하거나 책임을 지지 않습니다.
            </p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
              5. 웹사이트 이용 및 서비스 점검
            </h2>
            <p>
              시스템 보안 점검, 서버 교체, 통신망 장애 또는 천재지변 등 불가피한 사유로 인해 웹사이트 이용이 일시적으로 중단될 수 있으며, 이로 인한 직접적인 데이터 지연에 대해 관련 법령이 허용하는 범위 내에서 면책될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
              6. 문의처
            </h2>
            <p>
              면책조항에 대한 문의사항은 주식회사 페리어스엔지 고객센터(<strong>01083615305</strong> / <strong>noeulenterprises@gmail.com</strong>)로 문의해주시기 바랍니다.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

export default DisclaimerPage;
