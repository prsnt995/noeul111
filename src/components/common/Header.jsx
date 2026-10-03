import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { CATEGORIES_BY_GENDER } from '../../data/products.js';
import { api } from '../../utils/api.js';
import { Menu, X, Search, ShoppingBag, ChevronDown, User } from 'lucide-react';

export function Header({ onOpenSearch }) {
  const { lang, setLang, t } = useLanguage();
  const { totalCount, openCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  const [location, setLocation] = useLocation();
  // useSearch: query-only navigation doesn't change the pathname, so
  // location alone would leave drawer active-states stale.
  const search = useSearch();

  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null); // 'men' | 'women' | null
  const [liveCategories, setLiveCategories] = useState([]);

  // Current filters from URL — single source of truth, homepage owns filtering
  const currentParams = useMemo(() => {
    const sp = new URLSearchParams(search);
    return {
      gender: (sp.get('gender') || 'all').toLowerCase(),
      category: (sp.get('category') || 'all').toLowerCase(),
      filter: (sp.get('filter') || '').toLowerCase(),
    };
  }, [search]);

  // Live categories (frontend-only, same source as homepage pills)
  useEffect(() => {
    let cancelled = false;
    api.get('/catalog/categories').then((res) => {
      if (!cancelled && res.success && Array.isArray(res.data) && res.data.length) {
        setLiveCategories(
          res.data.map((c) => ({
            key: (c.slug || '').toLowerCase(),
            label: c.name_en || c.slug,
            label_ko: c.name_ko || c.slug,
          }))
        );
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const catsFor = (gender) => {
    if (liveCategories.length) {
      const allowMen = ['tshirts', 'shirts', 'jeans', 'pants', 'underwear', 'socks', 'jackets', 'hoodies', 'accessories', 'bags'];
      const allowWomen = ['tshirts', 'shirts', 'jeans', 'pants', 'underwear', 'socks', 'dresses', 'skirts', 'jackets', 'hoodies', 'accessories', 'bags'];
      const allow = gender === 'men' ? allowMen : allowWomen;
      const filtered = liveCategories.filter((c) => allow.includes(c.key));
      return filtered.length ? filtered : liveCategories;
    }
    return CATEGORIES_BY_GENDER[gender] || [];
  };

  const menCats = useMemo(() => catsFor('men'), [liveCategories]);
  const womenCats = useMemo(() => catsFor('women'), [liveCategories]);

  const catLabel = (c) => (lang === 'ko' ? (c.label_ko || c.label) : (c.label || c.label_ko));

  // Close menu on route change + auto-expand section matching gender
  useEffect(() => {
    setMenuOpen(false);
    if (currentParams.gender === 'men' || currentParams.gender === 'women') {
      setExpandedSection(currentParams.gender);
    }
  }, [location]);

  // Escape closes the slide-out menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Unified navigation — everything stays on / homepage (same-page filtering)
  const navigateWithFilter = (paramsObj) => {
    setMenuOpen(false);
    const sp = new URLSearchParams();
    Object.entries(paramsObj).forEach(([k, v]) => {
      if (v && v !== 'all' && v !== '') sp.set(k, v);
    });
    const qs = sp.toString();
    const target = qs ? `/?${qs}` : '/';
    setLocation(target);
  };

  const renderGenderSection = (gender, cats) => {
    const isExpanded = expandedSection === gender;
    const isActiveGender = currentParams.gender === gender;
    const title = gender === 'men' ? t('nav.men') : t('nav.women');
    return (
      <div className={`drawer-section${isActiveGender ? ' active-gender' : ''}`}>
        <div
          className="drawer-section-head"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateWithFilter({ gender });
            }}
            className={isActiveGender ? 'drawer-section-title active' : 'drawer-section-title'}
          >
            {title.toUpperCase()}
          </button>
          <button
            type="button"
            className="drawer-section-toggle"
            onClick={() => setExpandedSection(isExpanded ? null : gender)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? t('nav.collapse_section', { title }) : t('nav.expand_section', { title })}
          >
          <ChevronDown
            size={16}
            className={isExpanded ? 'chev open' : 'chev'}
            aria-hidden
          />
          </button>
        </div>

        {isExpanded && (
          <div className="drawer-subcats">
            <button
              type="button"
              onClick={() => navigateWithFilter({ gender })}
              className={isActiveGender && currentParams.category === 'all' ? 'drawer-subcat active' : 'drawer-subcat all-link'}
            >
              {lang === 'ko' ? (gender === 'men' ? '남성 전체' : '여성 전체') : (gender === 'men' ? "All Men's" : "All Women's")}
            </button>
            {cats.map((c) => {
              const isActive = isActiveGender && currentParams.category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => navigateWithFilter({ gender, category: c.key })}
                  className={isActive ? 'drawer-subcat active' : 'drawer-subcat'}
                >
                  {catLabel(c)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
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
          2. UNIFIED SLIDE-OUT MENU — mirrors homepage filters
          ALL / MEN (expand) / WOMEN (expand) / NEW / BEST / SALE
          All stay on / (same-page filtering)
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
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
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
            <div style={{ flex: 1, padding: '12px 0 20px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* ALL */}
                <button
                  type="button"
                  onClick={() => navigateWithFilter({})}
                  className={currentParams.gender === 'all' && !currentParams.category?.length ? 'drawer-link active' : 'drawer-link'}
                >
                  <span>{t('nav.all')}</span>
                  {currentParams.gender === 'all' && <span className="drawer-active-dot" />}
                </button>

                {/* MEN expandable */}
                {renderGenderSection('men', menCats)}

                {/* WOMEN expandable */}
                {renderGenderSection('women', womenCats)}

                {/* Quick filters — same-page */}
                <div className="drawer-divider" />
                <button
                  type="button"
                  onClick={() => navigateWithFilter({ filter: 'new' })}
                  className={currentParams.filter === 'new' ? 'drawer-link active' : 'drawer-link'}
                >
                  <span>{t('nav.new_arrivals')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateWithFilter({ filter: 'best' })}
                  className={currentParams.filter === 'best' ? 'drawer-link active' : 'drawer-link'}
                >
                  <span>{t('nav.best_sellers')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateWithFilter({ filter: 'sale' })}
                  className="drawer-link sale"
                >
                  <span>{t('nav.sale')}</span>
                </button>

                {/* CART */}
                <div className="drawer-divider" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openCart();
                  }}
                  className="drawer-link"
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

      {/* Slide in animation from left + drawer styles */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .drawer-link {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 24px; font-size: 0.9375rem; font-weight: 600;
          letter-spacing: 0.08em; color: #000000; background: none;
          border: none; border-left: 2px solid transparent;
          cursor: pointer; text-align: left; width: 100%;
        }
        .drawer-link.active { border-left-color: #000000; background: #fafafa; }
        .drawer-link.sale { color: #e11d48; }
        .drawer-active-dot { width: 6px; height: 6px; border-radius: 50%; background: #000; }
        .drawer-section-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 24px;
        }
        .drawer-section-toggle {
          display: flex; align-items: center; justify-content: center;
          min-width: 40px; min-height: 40px; margin: -8px -8px -8px 0;
          background: none; border: none; border-radius: 8px; cursor: pointer;
        }
        .drawer-section-toggle:focus-visible { outline: 2px solid #18181b; outline-offset: 2px; }
        .drawer-section-title {
          font-size: 0.9375rem; font-weight: 600; letter-spacing: 0.08em;
          color: #000000; background: none; border: none; border-left: 2px solid transparent;
          cursor: pointer; padding: 0 0 0 2px;
        }
        .drawer-section-title.active { font-weight: 800; }
        .drawer-section.active-gender .drawer-section-head { background: #fafafa; }
        .drawer-section .chev { transition: transform 0.2s; color: #71717a; }
        .drawer-section .chev.open { transform: rotate(180deg); }
        .drawer-subcats { padding: 4px 24px 12px 38px; display: flex; flex-direction: column; gap: 4px; }
        .drawer-subcat {
          font-size: 0.8125rem; color: #52525b; background: none; border: none;
          border-left: 2px solid transparent; cursor: pointer; text-align: left; padding: 5px 0 5px 8px;
        }
        .drawer-subcat.all-link { color: #000; font-weight: 600; }
        .drawer-subcat.active { color: #000; font-weight: 700; border-left-color: #000; background: #fafafa; }
        .drawer-divider { height: 1px; background: #f0f0f0; margin: 8px 24px; }
      `}</style>
    </>
  );
}
