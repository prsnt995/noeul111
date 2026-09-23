import React, { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ChevronDown, Phone, Mail, Clock, ExternalLink, ShieldCheck } from 'lucide-react';

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

  // Mobile accordion states
  const [openAccordion, setOpenAccordion] = useState({
    shop: false,
    cs: false,
    business: false,
    legal: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordion((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Exact verified business registration details as requested
  const verifiedBusiness = {
    brandName: 'NOEUL',
    website: 'https://noeul.me',
    websiteShort: 'noeul.me',
    companyName: '주식회사 페리어스엔지',
    representative: '박기성',
    businessNumber: '610-88-00182',
    address: '경기도 파주시 송학2길 62-3, 1층(야당동)',
    phone: '01083615305',
    phoneFormatted: '010-8361-5305',
    email: 'noeulenterprises@gmail.com',
    businessHours: '월요일 ~ 금요일 09:00 - 17:00 (Mon to Fri 9 to 5)',
    ecommerceNumber: '[수정 가능 / 확인 필요]',
  };

  return (
    <footer
      style={{
        backgroundColor: '#0b0b0c',
        color: '#8e8e93',
        paddingTop: '64px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Link
                  href="/"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif, 'Pretendard'",
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    textDecoration: 'none',
                  }}
                >
                  {verifiedBusiness.brandName}
                </Link>
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

              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>
                Premium Fashion & Everyday Essentials
              </div>

              <p
                style={{
                  color: '#a1a1a6',
                  fontSize: '0.8125rem',
                  lineHeight: 1.65,
                  maxWidth: '320px',
                  marginBottom: '16px',
                  fontWeight: 300,
                }}
              >
                A modern clothing brand for men and women inspired by contemporary Korean aesthetics.
              </p>


              <div style={{ fontSize: '0.75rem', color: '#6e6e73' }}>
                A business by{' '}
                <a
                  href="https://www.noeulenterprises.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#d1d1d6', fontWeight: 600, textDecoration: 'underline' }}
                >
                  NOEUL ENTERPRISES
                </a>
              </div>
            </div>

            {/* Social Link Button */}
            <div style={{ marginTop: '16px' }}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="NOEUL Instagram"
                className="social-icon-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#d1d1d6',
                  backgroundColor: '#161618',
                  padding: '9px 16px',
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
              2. CUSTOMER SERVICE SECTION (고객센터)
             ============================================================ */}
          <div className="footer-col accordion-col">
            <div className="accordion-header" onClick={() => toggleAccordion('cs')}>
              <h3 className="section-title">
                고객센터 (Customer Service)
              </h3>
              <ChevronDown
                size={16}
                className={`accordion-chevron ${openAccordion.cs ? 'open' : ''}`}
              />
            </div>

            <div className={`accordion-content ${openAccordion.cs ? 'expanded' : ''}`}>
              <div
                style={{
                  backgroundColor: '#141416',
                  borderRadius: '10px',
                  padding: '16px',
                  border: '1px solid #1f1f23',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} color="#e05638" />
                  <a
                    href={`tel:${verifiedBusiness.phone}`}
                    style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none', letterSpacing: '0.02em' }}
                  >
                    Phone: {verifiedBusiness.phoneFormatted}
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="#8e8e93" />
                  <a
                    href={`mailto:${verifiedBusiness.email}`}
                    style={{ color: '#d1d1d6', fontSize: '0.75rem', textDecoration: 'none', fontFamily: 'monospace' }}
                  >
                    Email: {verifiedBusiness.email}
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', borderTop: '1px solid #1c1c20', paddingTop: '8px', color: '#8e8e93', fontSize: '0.75rem' }}>
                  <Clock size={14} color="#e05638" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>운영시간: {verifiedBusiness.businessHours}</span>
                </div>
              </div>

              <ul className="footer-links">
                <li>
                  <Link href="/contact">고객센터 1:1 문의 (Customer Center)</Link>
                </li>
                <li>
                  <Link href="/shipping">배송안내 (Shipping Policy)</Link>
                </li>
                <li>
                  <Link href="/refund-exchange">환불 및 교환 정책 (Exchange & Returns)</Link>
                </li>
                <li>
                  <a
                    href="https://open.kakao.com/o/prsnt.2415"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <KakaoTalkIcon size={14} color="#fee500" />
                    <span>카카오톡 1:1 상담 (KakaoTalk)</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* ============================================================
              3. BUSINESS INFORMATION SECTION (사업자 정보)
             ============================================================ */}
          <div className="footer-col business-col accordion-col">
            <div className="accordion-header" onClick={() => toggleAccordion('business')}>
              <h3 className="section-title">
                사업자 정보 (Business Information)
              </h3>
              <ChevronDown
                size={16}
                className={`accordion-chevron ${openAccordion.business ? 'open' : ''}`}
              />
            </div>

            <div className={`accordion-content ${openAccordion.business ? 'expanded' : ''}`}>
              <div
                style={{
                  color: '#8e8e93',
                  fontSize: '0.8125rem',
                  lineHeight: 1.85,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span style={{ color: '#6e6e73' }}>상호: </span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{verifiedBusiness.companyName}</span>
                </div>

                <div>
                  <span style={{ color: '#6e6e73' }}>대표자: </span>
                  <span style={{ color: '#d1d1d6', fontWeight: 500 }}>{verifiedBusiness.representative}</span>
                </div>

                <div>
                  <span style={{ color: '#6e6e73' }}>사업자등록번호: </span>
                  <span style={{ color: '#d1d1d6', fontFamily: 'monospace', letterSpacing: '0.03em', fontWeight: 600 }}>
                    {verifiedBusiness.businessNumber}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#6e6e73' }}>주소: </span>
                  <span style={{ color: '#a1a1a6', wordBreak: 'keep-all' }}>{verifiedBusiness.address}</span>
                </div>

                <div>
                  <span style={{ color: '#6e6e73' }}>통신판매업 신고번호: </span>
                  <span style={{ color: '#8e8e93', fontFamily: 'monospace' }}>{verifiedBusiness.ecommerceNumber}</span>
                </div>
              </div>

              <div>
                <Link
                  href="/business-info"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#e05638',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>사업자 정보 상세 보기</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ============================================================
              4. SHOP & NAVIGATION LINKS
             ============================================================ */}
          <div className="footer-col accordion-col">
            <div className="accordion-header" onClick={() => toggleAccordion('shop')}>
              <h3 className="section-title">
                쇼핑 (Shop Navigation)
              </h3>
              <ChevronDown
                size={16}
                className={`accordion-chevron ${openAccordion.shop ? 'open' : ''}`}
              />
            </div>

            <div className={`accordion-content ${openAccordion.shop ? 'expanded' : ''}`}>
              <ul className="footer-links">
                <li>
                  <Link href="/shop">전체 상품 (Shop All)</Link>
                </li>
                <li>
                  <Link href="/shop?gender=men">남성 (Men)</Link>
                </li>
                <li>
                  <Link href="/shop?gender=women">여성 (Women)</Link>
                </li>
                <li>
                  <Link href="/shop?filter=new">신상품 (New Arrivals)</Link>
                </li>
                <li>
                  <Link href="/shop?filter=best">베스트 (Best Sellers)</Link>
                </li>
                <li>
                  <Link href="/about">브랜드 스토리 (About NOEUL)</Link>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Full-width Legal Policy Navigation Bar */}
        <div
          style={{
            borderTop: '1px solid #1a1a1e',
            marginTop: '48px',
            paddingTop: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Clickable Legal Links Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px 20px',
              fontSize: '0.8125rem',
            }}
          >
            <Link href="/privacy" className="legal-nav-link highlight">
              개인정보처리방침
            </Link>
            <span style={{ color: '#2c2c30' }}>·</span>

            <Link href="/terms" className="legal-nav-link">
              이용약관
            </Link>
            <span style={{ color: '#2c2c30' }}>·</span>

            <Link href="/refund-exchange" className="legal-nav-link">
              환불 및 교환 정책
            </Link>
            <span style={{ color: '#2c2c30' }}>·</span>

            <Link href="/shipping" className="legal-nav-link">
              배송정책
            </Link>
            <span style={{ color: '#2c2c30' }}>·</span>

            <Link href="/cookies" className="legal-nav-link">
              쿠키정책
            </Link>
            <span style={{ color: '#2c2c30' }}>·</span>

            <Link href="/disclaimer" className="legal-nav-link">
              면책조항
            </Link>
            <span style={{ color: '#2c2c30' }}>·</span>

            <Link href="/business-info" className="legal-nav-link">
              사업자 정보
            </Link>
            <span style={{ color: '#2c2c30' }}>·</span>

            <Link href="/contact" className="legal-nav-link">
              고객센터
            </Link>
            <span style={{ color: '#2c2c30' }}>·</span>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="legal-nav-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Instagram</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Copyright & Legal Attribution */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              color: '#68686d',
              fontSize: '0.75rem',
              paddingTop: '12px',
              borderTop: '1px solid #141416',
            }}
          >
            <div>
              © 2026 {verifiedBusiness.brandName} ({verifiedBusiness.companyName}). All rights reserved.
            </div>

          </div>
        </div>

      </div>

      {/* Modern Responsive Footer CSS */}
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1.1fr 1.2fr 1fr;
          gap: 40px;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
        }

        .section-title {
          color: #ffffff;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-links a {
          color: #c7c7cc;
          text-decoration: none;
          font-size: 0.8125rem;
          transition: color 0.2s ease, transform 0.2s ease;
          display: inline-block;
        }

        .footer-links a:hover {
          color: #ffffff;
          transform: translateX(2px);
        }

        .legal-nav-link {
          color: #d1d1d6;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .legal-nav-link:hover {
          color: #ffffff;
          text-decoration: underline;
        }

        .legal-nav-link.highlight {
          color: #f4f2ed;
          font-weight: 700;
        }

        .social-icon-btn:hover {
          background-color: #232328 !important;
          border-color: #383840 !important;
          color: #ffffff !important;
          transform: translateY(-2px);
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
            gap: 36px;
          }
        }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .accordion-header {
            cursor: pointer;
            padding: 14px 0;
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
            max-height: 600px;
            padding-top: 16px;
            padding-bottom: 12px;
            transition: max-height 0.35s ease-in-out, padding 0.3s ease;
          }
        }
      `}</style>
    </footer>
  );
}

export default Footer;
