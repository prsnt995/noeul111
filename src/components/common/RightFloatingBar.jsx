import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { User, Heart, ShoppingBag, Search, ChevronUp, ChevronDown, MessageCircle } from 'lucide-react';

export function RightFloatingBar({ onOpenSearch }) {
  const { isLoggedIn } = useAuth();
  const { wishlistCount } = useWishlist();
  const { totalCount, openCart } = useCart();
  const { lang, t } = useLanguage();

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
            backgroundColor: '#FEE500',
            color: '#18181b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.75rem',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
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

      {/* 2. KakaoTalk Live Consultation Floating Button */}
      <a
        href="https://pf.kakao.com"
        target="_blank"
        rel="noopener noreferrer"
        className="korean-floating-kakao"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '24px',
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: '#FEE500',
          color: '#381E1F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
          zIndex: 90,
          cursor: 'pointer',
          transition: 'transform 0.15s ease',
        }}
        title="카카오톡 실시간 1:1 상담톡"
      >
        <MessageCircle size={20} fill="#381E1F" />
      </a>
    </>
  );
}
