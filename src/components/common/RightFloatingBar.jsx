import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { User, Heart, ShoppingBag, Search, ChevronUp, ChevronDown, MessageCircle } from 'lucide-react';

function KakaoTalkLogo({ size = 22, color = '#381E1F' }) {
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

export function RightFloatingBar({ onOpenSearch }) {
  const { isLoggedIn } = useAuth();
  const { wishlistCount } = useWishlist();
  const { totalCount, openCart } = useCart();
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. Main Floating Navigation Toolbar */}
      <aside
        className="korean-floating-bar"
        style={{
          position: 'fixed',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 85,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {/* Brand Mini Badge (Desktop Only) */}
        <div
          className="korean-floating-badge"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#18181b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.75rem',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
          title="노을 NOEUL"
        >
          노을
        </div>

        {/* Main Floating Tool Container */}
        <div
          className="korean-floating-tools"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #e4e4e7',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 4px',
            gap: '2px',
          }}
        >
          {/* User Account */}
          <Link
            href={isLoggedIn ? '/account' : '/auth'}
            style={{
              padding: '8px',
              color: '#27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background-color 0.15s',
            }}
            title={isLoggedIn ? t('nav.account') : t('nav.login')}
          >
            <User size={16} />
          </Link>

          {/* Wishlist */}
          <Link
            href={isLoggedIn ? '/account?tab=wishlist' : '/auth'}
            style={{
              padding: '8px',
              color: '#27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            title={t('nav.wishlist')}
          >
            <Heart size={16} />
            {wishlistCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.5625rem',
                  fontWeight: 800,
                  width: '14px',
                  height: '14px',
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

          {/* Cart */}
          <button
            onClick={openCart}
            style={{
              padding: '8px',
              color: '#27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
            }}
            title={t('nav.cart')}
          >
            <ShoppingBag size={16} />
            {totalCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: '#18181b',
                  color: '#ffffff',
                  fontSize: '0.5625rem',
                  fontWeight: 800,
                  width: '14px',
                  height: '14px',
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

          {/* Search */}
          <button
            onClick={onOpenSearch}
            style={{
              padding: '8px',
              color: '#27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            title={t('nav.search')}
          >
            <Search size={16} />
          </button>

          <div style={{ width: '16px', height: '1px', backgroundColor: '#f0f0f2', margin: '3px 0' }} />

          {/* Scroll To Top */}
          <button
            onClick={scrollToTop}
            style={{
              padding: '6px',
              color: '#71717a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            title="맨 위로"
          >
            <ChevronUp size={16} />
          </button>

          {/* Scroll To Bottom */}
          <button
            onClick={scrollToBottom}
            style={{
              padding: '6px',
              color: '#71717a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            title="맨 아래로"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </aside>

      {/* 2. KakaoTalk Floating Button (Bottom Right) */}
      <a
        href="https://open.kakao.com/o/prsnt.2415"
        target="_blank"
        rel="noopener noreferrer"
        className="korean-floating-kakao"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '24px',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          backgroundColor: '#FEE500',
          color: '#381E1F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.22)',
          zIndex: 90,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          textDecoration: 'none',
        }}
        title="카카오톡 1:1 상담톡 (KakaoTalk Contact)"
      >
        <KakaoTalkLogo size={22} color="#381E1F" />
      </a>

      <style>{`
        .korean-floating-kakao:hover {
          transform: scale(1.1) translateY(-2px) !important;
          box-shadow: 0 10px 24px rgba(254, 229, 0, 0.45) !important;
        }
      `}</style>
    </>
  );
}
