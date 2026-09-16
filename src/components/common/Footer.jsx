import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ChevronDown, Phone, Mail, X, Shield, RefreshCw, HelpCircle, FileText } from 'lucide-react';

function InstagramIcon({ size = 15, color = '#ffffff' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function KakaoTalkIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3C6.477 3 2 6.477 2 10.765c0 2.766 1.84 5.195 4.62 6.643-.2.74-.73 2.68-.84 3.09-.13.5.18.49.38.36.16-.1 2.53-1.72 3.56-2.42.75.11 1.51.17 2.28.17 5.523 0 10-3.477 10-7.765C22 6.477 17.523 3 12 3z" />
    </svg>
  );
}

export function Footer() {
  const { lang } = useLanguage();
  
  // Dynamic business and CS info fetched from API (only shown if present in website data)
  const [businessData, setBusinessData] = useState({
    cs_phone: '',
    cs_email: '',
  });

  // Mobile accordion states
  const [openAccordion, setOpenAccordion] = useState({
    shop: false,
    cs: false,
  });

  // Modal states for policies (이용약관, 개인정보처리방침, 배송/교환/반품, FAQ, Contact Us)
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | 'returns' | 'faq' | 'contact' | null

  useEffect(() => {
    fetch('/api/content/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.business_info) {
          const info = data.data.business_info;
          setBusinessData({
            cs_phone: info.cs_phone || '',
            cs_email: info.cs_email || '',
          });
        }
      })
      .catch(() => {
        // Fallback to existing server defaults if network issue occurs
        setBusinessData({
          cs_phone: '010-8361-5305',
          cs_email: 'noeulenterprise@gmail.com',
        });
      });
  }, []);

  const toggleAccordion = (key) => {
    setOpenAccordion((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Exact registered legal business details as specified by user
  const legalInfo = {
    companyName: '주식회사 피케이에스이엔지',
    ceo: '박기삼',
    businessNumber: '610-88-00182',
    address: '경기도 파주시 송학2길 62-3, 1층(야당동)',
  };

  return (
    <footer
      style={{
        backgroundColor: '#0b0b0c',
        color: '#8e8e93',
        paddingTop: '72px',
        paddingBottom: '40px',
        borderTop: '1px solid #1a1a1e',
        fontSize: '0.8125rem',
        lineHeight: 1.7,
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div className="container" style={{ maxWidth: '1380px', margin: '0 auto', padding: '0 24px' }}>
        {/* Main 4-Column Grid */}
        <div className="footer-grid">
          {/* ============================================================
              1. BRAND SECTION
             ============================================================ */}
          <div className="footer-col brand-col">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif, 'Pretendard'",
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                  }}
                >
                  NOEUL
                </span>
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: '#e05638',
                    display: 'inline-block',
                  }}
                />
              </div>

              <p
                style={{
                  color: '#a1a1a6',
                  fontSize: '0.8125rem',
                  lineHeight: 1.7,
                  maxWidth: '320px',
                  marginBottom: '20px',
                  fontWeight: 300,
                }}
              >
                NOEUL is a contemporary fashion brand inspired by modern Korean aesthetics, creating refined styles for everyday life.
              </p>

              <div style={{ marginBottom: '16px', fontSize: '0.8125rem', color: '#a1a1a6' }}>
                A business by{' '}
                <a
                  href="https://www.noeulenterprises.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#ffffff',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#e05638')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
                >
                  NOEUL ENTERPRISES
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                <span
                  style={{
                    color: '#6e6e73',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  SEOUL · KOREA
                </span>
              </div>
            </div>

            {/* Instagram Social Icon Link */}
            <div style={{ marginTop: '24px' }}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="NOEUL Instagram"
                className="social-icon-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyInstance: 'center',
                  gap: '8px',
                  color: '#d1d1d6',
                  backgroundColor: '#161618',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  border: '1px solid #232328',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  transition: 'all 0.25s ease',
                  textDecoration: 'none',
                }}
              >
                <InstagramIcon size={15} color="#ffffff" />
                <span>INSTAGRAM</span>
              </a>
            </div>
          </div>

          {/* ============================================================
              2. SHOP SECTION
             ============================================================ */}
          <div className="footer-col accordion-col">
            <div
              className="accordion-header"
              onClick={() => toggleAccordion('shop')}
            >
              <h3 className="section-title">
                {lang === 'ko' ? 'SHOP' : 'SHOP'}
              </h3>
              <ChevronDown
                size={16}
                className={`accordion-chevron ${openAccordion.shop ? 'open' : ''}`}
              />
            </div>

            <div className={`accordion-content ${openAccordion.shop ? 'expanded' : ''}`}>
              <ul className="footer-links">
                <li>
                  <Link href="/shop">{lang === 'ko' ? '전체 상품 (All Products)' : 'All Products'}</Link>
                </li>
                <li>
                  <Link href="/shop?category=men">{lang === 'ko' ? '남성 (Men)' : 'Men'}</Link>
                </li>
                <li>
                  <Link href="/shop?category=women">{lang === 'ko' ? '여성 (Women)' : 'Women'}</Link>
                </li>
                <li>
                  <Link href="/shop?filter=new">{lang === 'ko' ? '신상품 (New Arrivals)' : 'New Arrivals'}</Link>
                </li>
                <li>
                  <Link href="/shop?category=outerwear">{lang === 'ko' ? '아우터 (Outerwear)' : 'Outerwear'}</Link>
                </li>
                <li>
                  <Link href="/shop?category=tops">{lang === 'ko' ? '상의 (Tops & Tees)' : 'Tops & Tees'}</Link>
                </li>
                <li>
                  <Link href="/shop?category=knitwear">{lang === 'ko' ? '니트웨어 (Knitwear)' : 'Knitwear'}</Link>
                </li>
                <li>
                  <Link href="/shop?category=pants">{lang === 'ko' ? '팬츠 & 데님 (Pants & Denim)' : 'Pants & Denim'}</Link>
                </li>
                <li>
                  <Link href="/shop?category=accessories">{lang === 'ko' ? '액세서리 (Accessories)' : 'Accessories'}</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* ============================================================
              3. CUSTOMER SERVICE SECTION
             ============================================================ */}
          <div className="footer-col accordion-col">
            <div
              className="accordion-header"
              onClick={() => toggleAccordion('cs')}
            >
              <h3 className="section-title">
                {lang === 'ko' ? 'CUSTOMER SERVICE' : 'CUSTOMER SERVICE'}
              </h3>
              <ChevronDown
                size={16}
                className={`accordion-chevron ${openAccordion.cs ? 'open' : ''}`}
              />
            </div>

            <div className={`accordion-content ${openAccordion.cs ? 'expanded' : ''}`}>
              <ul className="footer-links" style={{ marginBottom: '20px' }}>
                <li>
                  <button type="button" onClick={() => setActiveModal('faq')} className="footer-btn-link">
                    {lang === 'ko' ? '고객센터 (Customer Center)' : 'Customer Center'}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setActiveModal('faq')} className="footer-btn-link">
                    {lang === 'ko' ? '자주 묻는 질문 (FAQ)' : 'FAQ'}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setActiveModal('returns')} className="footer-btn-link">
                    {lang === 'ko' ? '배송 안내 (Shipping)' : 'Shipping'}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setActiveModal('returns')} className="footer-btn-link">
                    {lang === 'ko' ? '교환 및 반품 (Exchange & Returns)' : 'Exchange & Returns'}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setActiveModal('contact')} className="footer-btn-link">
                    {lang === 'ko' ? '1:1 문의하기 (Contact Us)' : 'Contact Us'}
                  </button>
                </li>
                <li>
                  <a
                    href="https://open.kakao.com/o/prsnt.2415"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-btn-link"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <KakaoTalkIcon size={14} color="#fee500" />
                    <span>KakaoTalk</span>
                  </a>
                </li>
              </ul>

              {/* Show CS phone & email ONLY if present in site data */}
              {(businessData.cs_phone || businessData.cs_email) && (
                <div
                  style={{
                    backgroundColor: '#141416',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    border: '1px solid #1f1f23',
                    marginTop: '8px',
                  }}
                >
                  {businessData.cs_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: businessData.cs_email ? '6px' : '0' }}>
                      <Phone size={13} color="#e05638" />
                      <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.02em' }}>
                        {businessData.cs_phone}
                      </span>
                    </div>
                  )}

                  {businessData.cs_email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={13} color="#8e8e93" />
                      <span style={{ color: '#a1a1a6', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {businessData.cs_email}
                      </span>
                    </div>
                  )}
                  
                  <div style={{ color: '#68686d', fontSize: '0.6875rem', marginTop: '8px', borderTop: '1px solid #1c1c20', paddingTop: '6px' }}>
                    MON - FRI 10:00 - 18:00 (KST)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================
              4. BUSINESS INFORMATION SECTION
             ============================================================ */}
          <div className="footer-col business-col">
            <h3 className="section-title">
              Business Information
            </h3>

            <div
              style={{
                color: '#8e8e93',
                fontSize: '0.8125rem',
                lineHeight: 1.85,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#6e6e73', minWidth: '70px' }}>상호:</span>
                <span style={{ color: '#d1d1d6', fontWeight: 500 }}>{legalInfo.companyName}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#6e6e73', minWidth: '70px' }}>대표자:</span>
                <span style={{ color: '#d1d1d6', fontWeight: 500 }}>{legalInfo.ceo}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#6e6e73', minWidth: '70px' }}>사업자등록번호:</span>
                <span style={{ color: '#d1d1d6', fontFamily: 'monospace', letterSpacing: '0.03em' }}>
                  {legalInfo.businessNumber}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#6e6e73', minWidth: '70px' }}>주소:</span>
                <span style={{ color: '#a1a1a6', wordBreak: 'keep-all' }}>{legalInfo.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Divider */}
        <div
          style={{
            borderTop: '1px solid #1a1a1e',
            marginTop: '56px',
            paddingTop: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          {/* ============================================================
              5. POLICY / LEGAL LINKS
             ============================================================ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveModal('terms')}
              className="policy-link-btn"
            >
              이용약관
            </button>
            <span style={{ color: '#2c2c30', fontSize: '0.75rem' }}>|</span>
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="policy-link-btn highlight"
            >
              개인정보처리방침
            </button>
            <span style={{ color: '#2c2c30', fontSize: '0.75rem' }}>|</span>
            <button
              type="button"
              onClick={() => setActiveModal('returns')}
              className="policy-link-btn"
            >
              배송/교환/반품
            </button>
          </div>

          {/* ============================================================
              6. COPYRIGHT & COMPANY CREDIT
             ============================================================ */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <div style={{ color: '#8e8e93', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
              A business by{' '}
              <a
                href="https://www.noeulenterprises.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#d1d1d6',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d1d6')}
              >
                NOEUL ENTERPRISES
              </a>
            </div>
            <div style={{ color: '#68686d', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
              © 2026 NOEUL. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          POLICY & HELP MODAL DIALOGS
         ============================================================ */}
      {activeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 5, 6, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            style={{
              backgroundColor: '#121214',
              color: '#f4f4f5',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              borderRadius: '16px',
              border: '1px solid #28282e',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #232328',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activeModal === 'terms' && <FileText size={18} color="#e05638" />}
                {activeModal === 'privacy' && <Shield size={18} color="#e05638" />}
                {activeModal === 'returns' && <RefreshCw size={18} color="#e05638" />}
                {(activeModal === 'faq' || activeModal === 'contact') && <HelpCircle size={18} color="#e05638" />}
                <span>
                  {activeModal === 'terms' && '전자상거래 표준 이용약관 (Terms of Service)'}
                  {activeModal === 'privacy' && '개인정보처리방침 (Privacy Policy)'}
                  {activeModal === 'returns' && '배송 / 교환 / 반품 안내 (Shipping & Returns)'}
                  {activeModal === 'faq' && '자주 묻는 질문 & 고객센터 (FAQ)'}
                  {activeModal === 'contact' && '1:1 고객 문의 (Contact Us)'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  color: '#a1a1a6',
                  backgroundColor: '#1c1c20',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', fontSize: '0.875rem', lineHeight: 1.8, color: '#c7c7cc' }}>
              {activeModal === 'terms' && (
                <div>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '12px' }}>제1조 (목적)</h4>
                  <p style={{ marginBottom: '16px' }}>
                    본 약관은 주식회사 피케이에스이엔지가 운영하는 온라인 쇼핑몰 NOEUL(이하 "몰")에서 제공하는 전자상거래 관련 서비스(이하 "서비스")를 이용함에 있어 몰과 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
                  </p>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '12px' }}>제2조 (정의)</h4>
                  <p style={{ marginBottom: '16px' }}>
                    "몰"이란 주식회사 피케이에스이엔지가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.
                  </p>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '12px' }}>제3조 (구매신청 및 계약성립)</h4>
                  <p>
                    이용자는 몰상에서 상품 구매를 신청하고, 몰이 승낙함으로써 구매계약이 성립됩니다. 무통장 입금 주문의 경우 안내된 지정 계좌로 정확한 금액 입금이 완료되어야 배송 절차가 진행됩니다.
                  </p>
                </div>
              )}

              {activeModal === 'privacy' && (
                <div>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '12px' }}>1. 개인정보의 수집 및 이용 목적</h4>
                  <p style={{ marginBottom: '16px' }}>
                    NOEUL은 주문 상품의 배송, 결제 확인, 고객 상담 및 회원 서비스 제공을 위해 최소한의 개인정보를 수집합니다.
                  </p>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '12px' }}>2. 수집하는 개인정보 항목</h4>
                  <p style={{ marginBottom: '16px' }}>
                    - 필수항목: 성명, 이메일, 휴대폰 번호, 배송지 주소, 결제 정보
                  </p>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '12px' }}>3. 개인정보의 보유 및 파기</h4>
                  <p>
                    관계 법령에 의하여 보존할 필요가 있는 경우를 제외하고, 수집 목적 달성 시 즉시 파기합니다. 전자상거래 등에서의 소비자보호에 관한 법률에 따라 대금결제 및 재화 공급 기록은 5년간 보존됩니다.
                  </p>
                </div>
              )}

              {activeModal === 'returns' && (
                <div>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '12px' }}>배송 안내 (Shipping)</h4>
                  <p style={{ marginBottom: '16px' }}>
                    - 배송 방법: CJ대한통운 / 전국 택배 배송<br />
                    - 배송 기간: 결제 완료 후 평일 기준 1~3일 소요 (도서산간 지역 추가 1~2일)<br />
                    - 배송비: 70,000원 이상 구매 시 무료배송 (70,000원 미만 시 기본 배송비 3,000원)
                  </p>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '12px' }}>교환 및 반품 절차 (Exchange & Return)</h4>
                  <p style={{ marginBottom: '16px' }}>
                    - 상품 수령 후 7일 이내에 마이페이지 또는 고객센터를 통해 교환/반품 접수가 가능합니다.<br />
                    - 단순 변심으로 인한 교환/반품 시 왕복 택배비 6,000원은 고객 부담입니다.
                  </p>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '12px' }}>교환/반품 불가 사유</h4>
                  <p>
                    - 고객의 부주의로 인한 상품 착용, 세탁, 오염, 향수 착향, 텍/라벨 훼손 시 교환 및 반품이 불가합니다.
                  </p>
                </div>
              )}

              {(activeModal === 'faq' || activeModal === 'contact') && (
                <div>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '12px' }}>NOEUL 고객센터 안내</h4>
                  <p style={{ marginBottom: '16px' }}>
                    NOEUL 고객센터는 고객님의 편안한 쇼핑을 지원합니다.<br />
                    - 운영시간: 평일 10:00 ~ 18:00 (점심시간 12:30 ~ 13:30 / 주말 및 공휴일 휴무)
                  </p>
                  {businessData.cs_phone && (
                    <p style={{ color: '#ffffff', fontWeight: 600, marginBottom: '8px' }}>
                      대표 전화: {businessData.cs_phone}
                    </p>
                  )}
                  {businessData.cs_email && (
                    <p style={{ color: '#ffffff', fontWeight: 600, marginBottom: '16px' }}>
                      이메일 문의: {businessData.cs_email}
                    </p>
                  )}
                  <p>
                    마이페이지 1:1 문의 게시판을 이용하시면 빠른 확인 후 답변 드리겠습니다.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #232328',
                backgroundColor: '#161619',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#121214',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                닫기 (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Modern Styling for Footer */}
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
          gap: 48px;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
        }

        .section-title {
          color: #f4f4f5;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 22px;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-links a,
        .footer-btn-link {
          color: #8e8e93;
          text-decoration: none;
          font-size: 0.8125rem;
          transition: color 0.2s ease, transform 0.2s ease;
          display: inline-block;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          text-align: left;
        }

        .footer-links a:hover,
        .footer-btn-link:hover {
          color: #ffffff;
          transform: translateX(2px);
        }

        .social-icon-btn:hover {
          background-color: #232328 !important;
          border-color: #383840 !important;
          color: #ffffff !important;
          transform: translateY(-2px);
        }

        .policy-link-btn {
          background: none;
          border: none;
          color: #8e8e93;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s ease;
        }

        .policy-link-btn:hover {
          color: #ffffff;
          text-decoration: underline;
        }

        .policy-link-btn.highlight {
          color: #d1d1d6;
          font-weight: 600;
        }

        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .accordion-chevron {
          display: none;
          color: #8e8e93;
          transition: transform 0.25s ease;
        }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .accordion-header {
            cursor: pointer;
            padding: 12px 0;
            border-bottom: 1px solid #1a1a1e;
            margin-bottom: 0;
          }

          .section-title {
            margin-bottom: 0;
          }

          .accordion-chevron {
            display: block;
          }

          .accordion-chevron.open {
            transform: rotate(180deg);
          }

          .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s cubic-bezier(0, 1, 0, 1), padding 0.3s ease;
            padding-top: 0;
          }

          .accordion-content.expanded {
            max-height: 500px;
            padding-top: 16px;
            padding-bottom: 12px;
            transition: max-height 0.3s ease-in-out, padding 0.3s ease;
          }

          .brand-col, .business-col {
            border-bottom: 1px solid #1a1a1e;
            padding-bottom: 24px;
          }
        }
      `}</style>
    </footer>
  );
}
