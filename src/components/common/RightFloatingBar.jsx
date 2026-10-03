import React from 'react';
import { Link } from 'wouter';
import { business } from '../../config/business.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { User, Heart, ShoppingBag, Search, ChevronUp, ChevronDown, Mail } from 'lucide-react';

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
        aria-label={t('nav.menu')}
        style={{
          position: 'fixed',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          // Above sticky filter bars (95) so the rail never slides under
          // them; below header (100) and all modals/drawers.
          zIndex: 96,
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
            backgroundColor: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
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
            aria-label={isLoggedIn ? t('nav.account') : t('nav.login')}
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
            aria-label={t('nav.wishlist')}
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
            aria-label={t('nav.cart')}
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
            aria-label={t('nav.search')}
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
            aria-label={t('nav.scroll_top')}
            title={t('nav.scroll_top')}
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
            aria-label={t('nav.scroll_bottom')}
            title={t('nav.scroll_bottom')}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </aside>

      {/* Customer support email */}
      <a
        href={`mailto:${business.email}`}
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
          backgroundColor: '#1a1a1e',
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
        aria-label={t('nav.support_email')}
        title={t('nav.support_email')}
      >
        <Mail size={22} color="#ffffff" />
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
