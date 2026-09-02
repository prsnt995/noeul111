import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown, Shield } from 'lucide-react';

export function Header({ onOpenSearch }) {
  const { lang, setLang, t } = useLanguage();
  const { isLoggedIn, user, isAdmin } = useAuth();
  const { totalCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const [location] = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      {/* 1. Top Mini Bar */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f0f0f2', fontSize: '0.75rem', color: '#52525b', padding: '6px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left: Language & Country Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#52525b' }}
            >
              <span>{lang === 'ko' ? '🇰🇷 한국어' : '🇬🇧 English'}</span>
              <ChevronDown size={12} />
            </button>

            {langMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e4e4e7',
                  borderRadius: '6px',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 100,
                  minWidth: '110px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => { setLang('ko'); setLangMenuOpen(false); }}
                  style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', background: lang === 'ko' ? '#f4f4f5' : '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: lang === 'ko' ? 700 : 400 }}
                >
                  🇰🇷 한국어
                </button>
                <button
                  onClick={() => { setLang('en'); setLangMenuOpen(false); }}
                  style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', background: lang === 'en' ? '#f4f4f5' : '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: lang === 'en' ? 700 : 400 }}
                >
                  🇬🇧 English
                </button>
              </div>
            )}
          </div>

          {/* Right: Membership Benefit Badge & Auth Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!isLoggedIn && (
              <Link
                href="/auth?mode=register"
                style={{
                  backgroundColor: '#ff5c5c',
                  color: '#ffffff',
                  padding: '3px 9px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.6875rem',
                  letterSpacing: '-0.02em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <span>회원가입</span>
                <span style={{ backgroundColor: 'rgba(0,0,0,0.15)', padding: '1px 4px', borderRadius: '8px', fontSize: '0.625rem' }}>1000원 +</span>
              </Link>
            )}

            <Link href={isLoggedIn ? '/account' : '/auth'} style={{ color: '#52525b' }}>
              {isLoggedIn ? (lang === 'ko' ? `${user?.name}님` : 'My Account') : (lang === 'ko' ? '로그인' : 'Login')}
            </Link>

            <Link href={isLoggedIn ? '/account?tab=orders' : '/auth'} style={{ color: '#52525b' }}>
              {lang === 'ko' ? '주문조회' : 'Orders'}
            </Link>

            <button onClick={openCart} style={{ color: '#52525b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>
              {lang === 'ko' ? '장바구니' : 'Cart'} ({totalCount})
            </button>

            {isAdmin && (
              <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-sunset)', fontWeight: 700 }}>
                <Shield size={12} />
                <span>Admin</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Brand Header (Logo Center) */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e4e7', padding: '18px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Mobile Hamburger / Search Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="mobile-only"
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <Menu size={24} />
            </button>

            <button
              onClick={onOpenSearch}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#18181b', padding: '6px' }}
              title="검색"
            >
              <Search size={22} />
            </button>
          </div>

          {/* Center: Brand Logo (Korean Mall signature style) */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FEE500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1rem',
                color: '#18181b',
                boxShadow: '0 2px 8px rgba(254, 229, 0, 0.5)',
              }}
            >
              노을
            </div>
            <span
              className="font-serif"
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#18181b',
                textTransform: 'uppercase',
              }}
            >
              NOEUL
            </span>
          </Link>

          {/* Right: Wishlist & Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href={isLoggedIn ? '/account?tab=wishlist' : '/auth'}
              style={{ color: '#18181b', position: 'relative', padding: '6px' }}
              title="위시리스트"
            >
              <Heart size={22} />
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={openCart}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#18181b', position: 'relative', padding: '6px' }}
              title="장바구니"
            >
              <ShoppingBag size={22} />
              {totalCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'var(--accent-sunset)',
                    color: '#fff',
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    width: '16px',
                    height: '16px',
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

      {/* 3. Category Horizontal Sticky Bar (Iconic Korean Mall Navigation) */}
      <nav
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e4e4e7',
          position: 'sticky',
          top: 0,
          zIndex: 80,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: '48px', overflowX: 'auto', whiteSpace: 'nowrap', gap: '22px', fontSize: '0.875rem' }}>
          {/* Hamburger trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, paddingRight: '8px', borderRight: '1px solid #eee' }}
          >
            <Menu size={18} />
          </button>

          {/* Primary Shopping Categories */}
          <Link href="/shop?filter=new" style={{ fontWeight: 700, color: '#ef4444' }}>
            {lang === 'ko' ? '신상 5%' : 'NEW 5%'}
          </Link>

          <Link href="/shop?tag=today" style={{ fontWeight: 700, color: '#18181b' }}>
            {lang === 'ko' ? '당일발송' : 'Fast Ship'}
          </Link>

          <Link href="/shop?filter=best" style={{ fontWeight: 700, color: '#18181b' }}>
            BEST
          </Link>

          <Link
            href="/shop?tag=custom"
            style={{
              fontWeight: 800,
              color: 'var(--accent-sunset)',
              backgroundColor: '#fff1f2',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {lang === 'ko' ? '노을제작' : 'NOEUL MADE'}
          </Link>

          {/* Dynamic Categories */}
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              style={{
                color: location === `/shop?category=${c.slug}` ? 'var(--accent-sunset)' : '#27272a',
                fontWeight: location === `/shop?category=${c.slug}` ? 700 : 500,
                transition: 'color 0.15s',
              }}
            >
              {lang === 'ko' ? c.name_ko : c.name_en}
            </Link>
          ))}

          <Link href="/p/lookbook" style={{ color: '#27272a', fontWeight: 500 }}>
            {lang === 'ko' ? '2026 룩북' : 'Lookbook'}
          </Link>

          <Link href="/about" style={{ color: '#27272a', fontWeight: 500 }}>
            {lang === 'ko' ? '브랜드스토리' : 'About'}
          </Link>

          <Link href="/shop?filter=sale" style={{ fontWeight: 700, color: '#dc2626' }}>
            SALE
          </Link>
        </div>
      </nav>

      {/* 4. Full Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="backdrop" onClick={() => setMobileMenuOpen(false)} style={{ zIndex: 99 }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '84%',
              maxWidth: '340px',
              height: '100%',
              backgroundColor: '#ffffff',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FEE500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                    노을
                  </div>
                  <span className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 800 }}>NOEUL</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={22} />
                </button>
              </div>

              {/* Quick Links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                <Link href="/shop?filter=new" style={{ padding: '10px', backgroundColor: '#fff1f2', borderRadius: '6px', textAlign: 'center', fontWeight: 700, color: '#ef4444', fontSize: '0.875rem' }}>
                  신상 5%
                </Link>
                <Link href="/shop?filter=best" style={{ padding: '10px', backgroundColor: '#f4f4f5', borderRadius: '6px', textAlign: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                  BEST 100
                </Link>
              </div>

              {/* Categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9375rem' }}>
                <Link href="/shop" style={{ fontWeight: 700 }}>전체 상품 보기</Link>
                {categories.map((c) => (
                  <Link key={c.id} href={`/shop?category=${c.slug}`} style={{ color: '#52525b' }}>
                    {lang === 'ko' ? c.name_ko : c.name_en}
                  </Link>
                ))}
                <div style={{ height: '1px', backgroundColor: '#eee', margin: '8px 0' }} />
                <Link href="/p/lookbook" style={{ color: '#52525b' }}>2026 룩북</Link>
                <Link href="/about" style={{ color: '#52525b' }}>브랜드 스토리</Link>
                <Link href="/p/contact" style={{ color: '#52525b' }}>고객센터 & 쇼룸</Link>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
              <Link
                href={isLoggedIn ? '/account' : '/auth'}
                style={{ display: 'block', padding: '12px', backgroundColor: '#18181b', color: '#fff', textAlign: 'center', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem' }}
              >
                {isLoggedIn ? '마이페이지' : '로그인 / 회원가입'}
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-only { display: inline-flex !important; }
        }
      `}</style>
    </>
  );
}
