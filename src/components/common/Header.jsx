import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { CATEGORIES_BY_GENDER } from '../../data/products.js';
import { Menu, X, Search, ShoppingBag, ChevronDown, ChevronRight, User } from 'lucide-react';

export function Header({ onOpenSearch }) {
  const { lang, setLang, t } = useLanguage();
  const { totalCount, openCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  const [location, setLocation] = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null); // 'women' | null

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Navigate with query params without page reload
  const navigateWithFilter = (paramsObj) => {
    setMenuOpen(false);
    const sp = new URLSearchParams();
    Object.entries(paramsObj).forEach(([k, v]) => {
      if (v && v !== 'all') sp.set(k, v);
    });
    const qs = sp.toString();
    const target = qs ? `/?${qs}` : '/';
    window.history.pushState({}, '', target);
    setLocation(target);
  };

  return (
    <>
      {/* =========================================================
          1. MINIMAL FIXED / STICKY HEADER
          Layout: Left (☰), Center (NOEUL), Right (Search, Cart)
          ========================================================= */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e5e5',
          height: '56px',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            height: '100%',
            padding: '0 12px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            margin: '0 auto',
          }}
        >
          {/* Left: Hamburger Menu (☰) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open Navigation Menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 4px',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Menu size={22} strokeWidth={1.75} />
            </button>
          </div>

          {/* Center: Brand / Logo "NOEUL" */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, overflow: 'hidden' }}>
            <Link
              href="/"
              style={{
                fontFamily: "'Cormorant Garamond', 'Pretendard', serif",
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#000000',
                textTransform: 'uppercase',
                textDecoration: 'none',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              NOEUL
            </Link>
          </div>

          {/* Right: Search & Shopping Cart Icons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            {/* Search Icon */}
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Search size={20} strokeWidth={1.75} />
            </button>

            {/* Shopping Bag / Cart Icon */}
            <button
              type="button"
              onClick={openCart}
              aria-label="Cart"
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag size={20} strokeWidth={1.75} />
              {totalCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: '-2px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontSize: '0.5625rem',
                    fontWeight: 700,
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {totalCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          2. CLEAN SLIDE-OUT SIDE MENU (FROM LEFT)
          Includes: HOME, WOMEN, NEW ARRIVALS, SALE, CART
          ========================================================= */}
      {menuOpen && (
        <div
          className="backdrop"
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 150,
            display: 'flex',
            justifyContent: 'flex-start',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '320px',
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInLeft 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Slide Menu Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#000000',
                  textTransform: 'uppercase',
                }}
              >
                NOEUL
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close Menu"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#000000',
                }}
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Menu Items List */}
            <div style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* 1. HOME */}
                <button
                  type="button"
                  onClick={() => navigateWithFilter({})}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 24px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: '#000000',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span>{t('nav.home').toUpperCase()}</span>
                </button>

                {/* 2. WOMEN (with subcategory expander) */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 24px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedSection(expandedSection === 'women' ? null : 'women')}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateWithFilter({ gender: 'women' });
                      }}
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        color: '#000000',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {t('nav.women').toUpperCase()}
                    </button>
                    <ChevronDown
                      size={16}
                      style={{
                        transform: expandedSection === 'women' ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: '#71717a',
                      }}
                    />
                  </div>

                  {expandedSection === 'women' && (
                    <div style={{ padding: '4px 24px 12px 36px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => navigateWithFilter({ gender: 'women' })}
                        style={{
                          fontSize: '0.8125rem',
                          color: '#000000',
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: '3px 0',
                        }}
                      >
                        {lang === 'ko' ? '여성 전체' : 'All Women\'s'}
                      </button>
                      {CATEGORIES_BY_GENDER.women.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => navigateWithFilter({ gender: 'women', category: c.key })}
                          style={{
                            fontSize: '0.8125rem',
                            color: '#52525b',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            padding: '3px 0',
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. NEW ARRIVALS */}
                <button
                  type="button"
                  onClick={() => navigateWithFilter({ filter: 'new' })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 24px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: '#000000',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span>{t('nav.new_arrivals')}</span>
                </button>

                {/* 5. SALE */}
                <button
                  type="button"
                  onClick={() => navigateWithFilter({ filter: 'sale' })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 24px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: '#e11d48',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span>{t('nav.sale')}</span>
                </button>

                {/* 6. CART */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openCart();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 24px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: '#000000',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span>{t('nav.cart')}</span>
                  {totalCount > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#71717a' }}>({totalCount})</span>
                  )}
                </button>
              </div>
            </div>

            {/* Slide Menu Footer */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8125rem',
              }}
            >
              <Link
                href={isLoggedIn ? '/account' : '/auth'}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: '#000000',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                }}
              >
                <User size={15} />
                <span>{isLoggedIn ? (user?.name || t('nav.account')) : t('nav.login')}</span>
              </Link>

              <button
                type="button"
                onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
                style={{
                  background: '#18181b',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                }}
                title={lang === 'ko' ? 'Switch to English' : '한국어로 전환'}
              >
                {t('lang.switch')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide in animation from left */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
