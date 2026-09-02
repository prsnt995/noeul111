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
  const { lang } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
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
      {/* Brand Mini Badge */}
      <div
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
            padding: '10px',
            color: '#27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background-color 0.15s',
          }}
          title={isLoggedIn ? '마이페이지' : '로그인'}
        >
          <User size={18} />
        </Link>

        {/* Wishlist */}
        <Link
          href={isLoggedIn ? '/account?tab=wishlist' : '/auth'}
          style={{
            padding: '10px',
            color: '#27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
          title="관심상품 (위시리스트)"
        >
          <Heart size={18} />
          {wishlistCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
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

        {/* Cart */}
        <button
          onClick={openCart}
          style={{
            padding: '10px',
            color: '#27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
          }}
          title="장바구니"
        >
          <ShoppingBag size={18} />
          {totalCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: 'var(--accent-sunset)',
                color: '#ffffff',
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

        {/* Search */}
        <button
          onClick={onOpenSearch}
          style={{
            padding: '10px',
            color: '#27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          title="상품 검색"
        >
          <Search size={18} />
        </button>

        <div style={{ width: '20px', height: '1px', backgroundColor: '#f0f0f2', margin: '4px 0' }} />

        {/* Scroll To Top */}
        <button
          onClick={scrollToTop}
          style={{
            padding: '8px',
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
          <ChevronUp size={18} />
        </button>

        {/* Scroll To Bottom */}
        <button
          onClick={scrollToBottom}
          style={{
            padding: '8px',
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
          <ChevronDown size={18} />
        </button>
      </div>

      {/* KakaoTalk Live Consultation Floating Button */}
      <a
        href="https://pf.kakao.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: '#FEE500',
          color: '#381E1F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(254, 229, 0, 0.45)',
          marginTop: '4px',
          cursor: 'pointer',
        }}
        title="카카오톡 실시간 1:1 상담톡"
      >
        <MessageCircle size={22} fill="#381E1F" />
      </a>
    </aside>
  );
}
