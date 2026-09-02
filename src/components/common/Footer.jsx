import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Phone, Mail, Clock, CreditCard, ShieldCheck } from 'lucide-react';

export function Footer() {
  const { lang, t } = useLanguage();
  const [settings, setSettings] = useState({
    payment_info: {
      bank_name: '우리은행 (Woori Bank)',
      account_holder: '박기삼',
      account_number: '1002340390276',
    },
    business_info: {
      company_name: '(주)노을패션코리아 (NOEUL Fashion Korea)',
      ceo: '박기삼',
      business_number: '120-88-94821',
      ecommerce_number: '제 2026-서울강남-04821호',
      address: '서울특별시 강남구 압구정로 165 노을 빌딩 4층',
      cs_phone: '010-1234-5678',
      cs_email: 'noeulenterprise@gmail.com',
    },
  });

  useEffect(() => {
    fetch('/api/content/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings((prev) => ({
            ...prev,
            payment_info: { ...prev.payment_info, ...(data.data.payment_info || {}) },
            business_info: { ...prev.business_info, ...(data.data.business_info || {}) },
          }));
        }
      })
      .catch(console.error);
  }, []);

  const { payment_info, business_info } = settings;

  return (
    <footer
      style={{
        backgroundColor: '#111112',
        color: '#a1a1a6',
        paddingTop: '64px',
        paddingBottom: '48px',
        borderTop: '1px solid #232326',
        fontSize: '0.8125rem',
        lineHeight: 1.7,
      }}
    >
      <div className="container">
        {/* Top Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Col 1: Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
              <span className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f5f5f7', letterSpacing: '0.12em' }}>
                NOEUL
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--accent-sunset)', fontWeight: 500 }}>
                노을
              </span>
            </div>
            <p style={{ color: '#8e8e93', maxWidth: '300px', marginBottom: '20px' }}>
              {t('footer.about_desc')}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ color: '#d1d1d6', fontWeight: 500 }}>SEOUL • TOKYO • NEW YORK</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 style={{ color: '#f5f5f7', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              {lang === 'ko' ? '쇼핑 카테고리' : 'Collections'}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link href="/shop" style={{ color: '#8e8e93', transition: 'color 0.15s' }}>{t('nav.shop')}</Link></li>
              <li><Link href="/shop?category=outerwear" style={{ color: '#8e8e93' }}>{lang === 'ko' ? '아우터 (Outerwear)' : 'Outerwear'}</Link></li>
              <li><Link href="/shop?category=tops" style={{ color: '#8e8e93' }}>{lang === 'ko' ? '상의 (Tops & Tees)' : 'Tops & Tees'}</Link></li>
              <li><Link href="/shop?category=knitwear" style={{ color: '#8e8e93' }}>{lang === 'ko' ? '니트웨어 (Knitwear)' : 'Knitwear'}</Link></li>
              <li><Link href="/shop?category=pants" style={{ color: '#8e8e93' }}>{lang === 'ko' ? '팬츠 & 데님 (Pants)' : 'Pants & Denim'}</Link></li>
              <li><Link href="/shop?category=accessories" style={{ color: '#8e8e93' }}>{lang === 'ko' ? '액세서리 (Accessories)' : 'Accessories'}</Link></li>
            </ul>
          </div>

          {/* Col 3: Customer Center */}
          <div>
            <h4 style={{ color: '#f5f5f7', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              {t('footer.cs_title')}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700, color: '#f5f5f7', marginBottom: '8px' }}>
              <Phone size={18} color="var(--accent-sunset)" />
              <span>{business_info.cs_phone || '010-1234-5678'}</span>
            </div>
            <p style={{ color: '#8e8e93', marginBottom: '6px' }}>
              {t('footer.cs_hours')}
            </p>
            <p style={{ color: '#8e8e93', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> {business_info.cs_email || 'noeulenterprise@gmail.com'}
            </p>
          </div>

          {/* Col 4: Bank Account & Payment Safety */}
          <div>
            <h4 style={{ color: '#f5f5f7', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              {t('footer.bank_title')}
            </h4>
            <div style={{ backgroundColor: '#1c1c1e', padding: '14px', borderRadius: '6px', border: '1px solid #2c2c2e', marginBottom: '12px' }}>
              <p style={{ color: '#f5f5f7', fontWeight: 600, marginBottom: '2px' }}>{payment_info.bank_name || '우리은행 (Woori Bank)'}</p>
              <p style={{ color: 'var(--accent-sunset)', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700 }}>
                {payment_info.account_number || '1002340390276'}
              </p>
              <p style={{ color: '#8e8e93', fontSize: '0.75rem' }}>
                예금주: {payment_info.account_holder || '박기삼'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8e8e93', fontSize: '0.75rem' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>{lang === 'ko' ? '안전한 1:1 무통장 입금 검수 시스템' : 'Secured Bank Transfer Verification'}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #232326', paddingTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Korean Statutory Business Disclosures */}
          <div style={{ color: '#68686d', fontSize: '0.75rem', lineHeight: 1.8 }}>
            <p>
              상호: {business_info.company_name} | 대표자: {business_info.ceo || '박기삼'} | 사업자등록번호: {business_info.business_number}
            </p>
            <p>
              통신판매업신고: {business_info.ecommerce_number} | 주소: {business_info.address}
            </p>
            <p>
              고객센터/이메일: {business_info.cs_email || 'noeulenterprise@gmail.com'} ({business_info.cs_phone})
            </p>
          </div>

          {/* Links & Copyright */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #1a1a1d', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
              <Link href="/about" style={{ color: '#a1a1a6' }}>{t('nav.about')}</Link>
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert('노을 전자상거래 표준 이용약관이 적용됩니다.'); }} style={{ color: '#a1a1a6' }}>
                {t('footer.terms')}
              </a>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('노을 개인정보처리방침에 따라 고객 정보가 안전하게 보호됩니다.'); }} style={{ color: '#a1a1a6', fontWeight: 600 }}>
                {t('footer.privacy')}
              </a>
              <Link href="/admin" style={{ color: '#555558' }}>
                {t('nav.admin')}
              </Link>
            </div>
            <p style={{ color: '#68686d', fontSize: '0.75rem' }}>
              © 2026 NOEUL. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
