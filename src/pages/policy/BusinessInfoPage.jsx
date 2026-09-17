import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Building, ArrowLeft, Phone, Mail, MapPin, Globe, Shield, ExternalLink, Edit3 } from 'lucide-react';

export function BusinessInfoPage() {
  const { lang } = useLanguage();

  const businessData = {
    brandName: 'NOEUL (노을)',
    website: 'https://noeul.me',
    companyName: '주식회사 페리어스엔지',
    representative: '박기성',
    businessNumber: '610-88-00182',
    address: '경기도 파주시 송학2길 62-3, 1층(야당동)',
    phone: '01083615305',
    phoneFormatted: '010-8361-5305',
    email: 'noeulenterprises@gmail.com',
    businessType: '법인사업자',
    ecommerceNumber: '[수정 가능 / 확인 필요]',
    businessHours: '월요일 ~ 금요일 09:00 - 17:00 (토/일/공휴일 휴무)',
    country: '대한민국 (South Korea)',
  };

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
            <Building size={28} color="var(--accent-sunset, #e05638)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-sunset, #e05638)' }}>
              OFFICIAL BUSINESS DETAILS
            </span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>
            사업자 정보 (Business Information)
          </h1>
          <p style={{ color: '#8e8e93', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            NOEUL 패션 브랜드를 운영하는 등록 법인 사업자의 검증된 정식 사업자 등록 정보 및 연락처 안내입니다.
          </p>
        </div>

        {/* Main Grid Information Card */}
        <div
          style={{
            backgroundColor: '#121214',
            borderRadius: '16px',
            border: '1px solid #232328',
            padding: '36px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            marginBottom: '40px',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1f1f25', paddingBottom: '16px' }}>
            <Shield size={20} color="var(--accent-sunset, #e05638)" />
            <span>법인 사업자 등록 명세</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                브랜드명 (Brand Name)
              </span>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>
                {businessData.brandName}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                등록 상호명 (Registered Legal Name)
              </span>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>
                {businessData.companyName}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                대표자명 (Representative / CEO)
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f4f4f5' }}>
                {businessData.representative}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                사업자등록번호 (Business Registration No.)
              </span>
              <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--accent-sunset, #e05638)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {businessData.businessNumber}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                사업장 주소 (Business Address)
              </span>
              <span style={{ fontSize: '0.9375rem', color: '#d1d1d6', lineHeight: 1.5 }}>
                {businessData.address}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                대표 전화번호 (Phone)
              </span>
              <a href={`tel:${businessData.phone}`} style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', textDecoration: 'none' }}>
                {businessData.phoneFormatted}
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                대표 이메일 (Email)
              </span>
              <a href={`mailto:${businessData.email}`} style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--accent-sunset, #e05638)', textDecoration: 'none' }}>
                {businessData.email}
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                사업자 유형 (Business Type)
              </span>
              <span style={{ fontSize: '0.9375rem', color: '#f4f4f5' }}>
                {businessData.businessType} ({businessData.country})
              </span>
            </div>

            {/* Editable Telecom Commerce Number Placeholder Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#18181c', padding: '16px', borderRadius: '10px', border: '1px border-dashed #383842' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit3 size={14} color="#f59e0b" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  통신판매업 신고번호
                </span>
              </div>
              <span style={{ fontSize: '0.9375rem', color: '#d1d1d6', fontWeight: 500, fontFamily: 'monospace' }}>
                {businessData.ecommerceNumber}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#8e8e93', marginTop: '4px' }}>
                ※ 구청 등록 통신판매업 신고 완료 후 관리자 페이지에서 수정이 가능합니다.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                고객센터 운영시간 (CS Hours)
              </span>
              <span style={{ fontSize: '0.9375rem', color: '#f4f4f5' }}>
                {businessData.businessHours}
              </span>
            </div>

          </div>

          {/* Business Verification Button Banner */}
          <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid #1f1f25', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ fontSize: '0.8125rem', color: '#8e8e93' }}>
              공정거래위원회 전자상거래 사업자 정보 조회 시스템에서 해당 사업자등록번호를 조회하실 수 있습니다.
            </div>
            <a
              href="https://www.ftc.go.kr/bizCommList.do"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1c1c20',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid #2d2d35',
                transition: 'all 0.2s ease',
              }}
            >
              <span>사업자 정보 조회하기</span>
              <ExternalLink size={14} />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}

export default BusinessInfoPage;
