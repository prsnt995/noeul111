import React, { useState } from 'react';
import { Link } from 'wouter';
import { business as verifiedBusiness } from '../../config/business.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ChevronDown, Phone, Mail, Clock, ExternalLink, ShieldCheck } from 'lucide-react';

function InstagramIcon({ size = 13, color = '#ffffff' }) {
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

function EmailIcon({ size = 12, color = 'currentColor' }) {
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
    business: false,
    cs: false,
    shop: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordion((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <footer
      style={{
        backgroundColor: '#080808',
        color: '#8e8e93',
        paddingTop: '36px',
        paddingBottom: '24px',
        borderTop: '1px solid #161619',
        fontSize: '0.75rem',
        lineHeight: 1.55,
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div className="container" style={{ maxWidth: '1380px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Main 4-Column Grid: Brand | Business Info | Customer Service | Shop Navigation */}
        <div className="footer-grid">
          
          {/* ============================================================
              1. NOEUL BRAND SECTION
             ============================================================ */}
          <div className="footer-col brand-col">
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Link
                  href="/"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif, 'Pretendard'",
                    fontSize: '1.625rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    textDecoration: 'none',
                  }}
                >
                  {verifiedBusiness.brandName}
                </Link>
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#ff4d2d',
                    display: 'inline-block',
                  }}
                />
              </div>

              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '4px' }}>
                Premium Fashion & Everyday Essentials
              </div>

              <p
                style={{
                  color: '#9ca3af',
                  fontSize: '0.75rem',
                  lineHeight: 1.5,
                  maxWidth: '300px',
                  marginBottom: '10px',
                  fontWeight: 300,
                }}
              >
                A modern clothing brand for men and women inspired by contemporary Korean aesthetics.
              </p>

              <div style={{ fontSize: '0.75rem', color: '#6e6e73' }}>
                A business by{' '}
                <a
                  href="https://www.noeulenterprises.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#d1d1d6', fontWeight: 600, textDecoration: 'underline' }}
                >
                  NOEUL ENTERPRISES
                </a>
              </div>
            </div>

            {/* Social Link Button */}
            <div>
              <a
                href="https://www.instagram.com/noeul.me"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="NOEUL Instagram"
                className="social-icon-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#d1d1d6',
                  backgroundColor: '#121214',
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  border: '1px solid #1f1f23',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                  width: 'fit-content',
                }}
              >
                <InstagramIcon size={13} color="#ffffff" />
                <span>INSTAGRAM</span>
              </a>
            </div>
          </div>

          {/* ============================================================
              2. BUSINESS INFORMATION SECTION (사업자 정보)
             ============================================================ */}
          <div className="footer-col business-col accordion-col">
            <div className="accordion-header" onClick={() => toggleAccordion('business')}>
              <h3 className="section-title">
                사업자 정보 (Business Info)
              </h3>
              <ChevronDown
                size={15}
                className={`accordion-chevron ${openAccordion.business ? 'open' : ''}`}
              />
            </div>

            <div className={`accordion-content ${openAccordion.business ? 'expanded' : ''}`}>
              <div
                style={{
                  color: '#8e8e93',
                  fontSize: '0.75rem',
                  lineHeight: 1.6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <span style={{ color: '#636366' }}>상호: </span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{verifiedBusiness.companyName}</span>
                </div>

                <div>
                  <span style={{ color: '#636366' }}>대표자: </span>
                  <span style={{ color: '#d1d1d6', fontWeight: 500 }}>{verifiedBusiness.representative}</span>
                </div>

                <div>
                  <span style={{ color: '#636366' }}>사업자등록번호: </span>
                  <span style={{ color: '#d1d1d6', fontFamily: 'monospace', letterSpacing: '0.02em', fontWeight: 600 }}>
                    {verifiedBusiness.businessNumber}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#636366' }}>법인등록번호: </span>
                  <span style={{ color: '#d1d1d6', fontFamily: 'monospace' }}>{verifiedBusiness.corporationNumber}</span>
                </div>

                <div>
                  <span style={{ color: '#636366' }}>주소: </span>
                  <span style={{ color: '#a1a1a6', wordBreak: 'keep-all' }}>{verifiedBusiness.address}</span>
                </div>

                <div>
                  <span style={{ color: '#636366' }}>통신판매업 신고번호: </span>
                  <span style={{ color: '#8e8e93', fontFamily: 'monospace' }}>{verifiedBusiness.ecommerceNumber}</span>
                  {' '}
                  <a
                    href={verifiedBusiness.businessLookupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#d1d1d6', textDecoration: 'underline', fontSize: '0.6875rem' }}
                  >
                    사업자정보 확인
                  </a>
                </div>
              </div>

              <div>
                <Link
                  href="/business-info"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#ff4d2d',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <ShieldCheck size={13} />
                  <span>사업자 정보 상세 보기</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ============================================================
              3. CUSTOMER SERVICE SECTION (고객센터)
             ============================================================ */}
          <div className="footer-col cs-col accordion-col">
            <div className="accordion-header" onClick={() => toggleAccordion('cs')}>
              <h3 className="section-title">
                고객센터 (Customer Service)
              </h3>
              <ChevronDown
                size={15}
                className={`accordion-chevron ${openAccordion.cs ? 'open' : ''}`}
              />
            </div>

            <div className={`accordion-content ${openAccordion.cs ? 'expanded' : ''}`}>
              <div
                style={{
                  backgroundColor: '#111113',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  border: '1px solid #1a1a1e',
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '7px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Phone size={13} color="#ff4d2d" />
                  <a
                    href={`tel:${verifiedBusiness.phone}`}
                    style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.8125rem', textDecoration: 'none', letterSpacing: '0.02em' }}
                  >
                    Phone: {verifiedBusiness.phoneFormatted}
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Mail size={13} color="#8e8e93" />
                  <a
                    href={`mailto:${verifiedBusiness.email}`}
                    style={{ color: '#d1d1d6', fontSize: '0.6875rem', textDecoration: 'none', fontFamily: 'monospace' }}
                  >
                    Email: {verifiedBusiness.email}
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', borderTop: '1px solid #1a1a1e', paddingTop: '6px', color: '#8e8e93', fontSize: '0.6875rem' }}>
                  <Clock size={13} color="#ff4d2d" style={{ marginTop: '1px', flexShrink: 0 }} />
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
                    href="mailto:noeulenterprises@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <EmailIcon size={12} color="#fee500" />
                    <span>이메일 상담 (Email)</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* ============================================================
              4. SHOP & NAVIGATION LINKS
             ============================================================ */}
          <div className="footer-col shop-col accordion-col">
            <div className="accordion-header" onClick={() => toggleAccordion('shop')}>
              <h3 className="section-title">
                쇼핑 (Shop Navigation)
              </h3>
              <ChevronDown
                size={15}
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
            borderTop: '1px solid #161619',
            marginTop: '28px',
            paddingTop: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Clickable Legal Links Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '8px 16px',
              fontSize: '0.75rem',
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
              상품·서비스 안내
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
              href="https://www.instagram.com/noeul.me"
              target="_blank"
              rel="noopener noreferrer"
              className="legal-nav-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Instagram</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Copyright & Legal Attribution */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              color: '#636366',
              fontSize: '0.6875rem',
              paddingTop: '6px',
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
          grid-template-columns: 1.25fr 1.35fr 1.15fr 0.9fr;
          gap: 28px;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
        }

        .section-title {
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .footer-links a {
          color: #a1a1a6;
          text-decoration: none;
          font-size: 0.75rem;
          transition: color 0.18s ease, transform 0.18s ease;
          display: inline-block;
          line-height: 1.45;
        }

        .footer-links a:hover {
          color: #ffffff;
          transform: translateX(2px);
        }

        .legal-nav-link {
          color: #8e8e93;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.18s ease;
        }

        .legal-nav-link:hover {
          color: #ffffff;
          text-decoration: underline;
        }

        .legal-nav-link.highlight {
          color: #e5e5ea;
          font-weight: 600;
        }

        .social-icon-btn:hover {
          background-color: #1c1c20 !important;
          border-color: #2c2c32 !important;
          color: #ffffff !important;
          transform: translateY(-1px);
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
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .accordion-header {
            cursor: pointer;
            padding: 10px 0;
            border-bottom: 1px solid #161619;
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
            transition: max-height 0.25s cubic-bezier(0, 1, 0, 1), padding 0.25s ease;
            padding-top: 0;
          }

          .accordion-content.expanded {
            max-height: 500px;
            padding-top: 10px;
            padding-bottom: 8px;
            transition: max-height 0.3s ease-in-out, padding 0.25s ease;
          }
        }
      `}</style>
    </footer>
  );
}

export default Footer;
