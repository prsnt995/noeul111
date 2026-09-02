import React, { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { Heart, Plus } from 'lucide-react';

export function ProductCard({ product }) {
  const { lang, formatKRW } = useLanguage();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImg = images[0] || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop';
  const hoverImg = images[1] || primaryImg;
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const wish = isWishlisted(product.id);

  const finalPrice = product.discount_price || product.price;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, product.sizes?.[0] || 'FREE', colors[0]);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container */}
      <Link
        href={`/product/${product.id}`}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          aspectRatio: '3 / 4',
          overflow: 'hidden',
          backgroundColor: '#f8f8f9',
          borderRadius: '4px',
          marginBottom: '10px',
        }}
      >
        <img
          src={isHovered ? hoverImg : primaryImg}
          alt={product.name_ko}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease, opacity 0.2s ease',
            transform: isHovered ? 'scale(1.03)' : 'scale(1)',
          }}
          loading="lazy"
        />

        {/* Korean Signature Ribbon Badge ("노을제작") */}
        {product.is_featured || product.id % 2 === 1 ? (
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '12px',
              backgroundColor: '#FEE500',
              color: '#18181b',
              padding: '6px 8px 10px',
              fontWeight: 900,
              fontSize: '0.6875rem',
              lineHeight: 1.1,
              textAlign: 'center',
              clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
              zIndex: 2,
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            노을<br />제작
          </div>
        ) : null}

        {/* Badges (New, Best, Sale) */}
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', gap: '4px', zIndex: 2 }}>
          {product.is_new ? (
            <span style={{ fontSize: '0.625rem', fontWeight: 800, backgroundColor: '#18181b', color: '#fff', padding: '2px 6px', borderRadius: '2px' }}>
              NEW
            </span>
          ) : null}
          {product.is_best ? (
            <span style={{ fontSize: '0.625rem', fontWeight: 800, backgroundColor: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '2px' }}>
              BEST
            </span>
          ) : null}
        </div>

        {/* Wishlist Heart Button inside Top-Right */}
        <button
          onClick={handleWishlistClick}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: wish ? '#ef4444' : '#52525b',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 2,
          }}
          aria-label="Wishlist"
        >
          <Heart size={16} fill={wish ? '#ef4444' : 'none'} />
        </button>

        {/* Quick Add Button on Hover */}
        <button
          onClick={handleQuickAdd}
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(24, 24, 27, 0.92)',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(6px)',
            transition: 'all 0.2s ease',
            zIndex: 3,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          <span>담기</span>
        </button>
      </Link>

      {/* Color Swatch Dots */}
      {colors.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
          {colors.slice(0, 5).map((col, idx) => (
            <span
              key={idx}
              title={lang === 'ko' ? col.name_ko : col.name_en}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: col.hex || '#111',
                border: '1px solid rgba(0,0,0,0.15)',
                display: 'inline-block',
              }}
            />
          ))}
          {colors.length > 5 && (
            <span style={{ fontSize: '0.625rem', color: '#a1a1aa' }}>+{colors.length - 5}</span>
          )}
        </div>
      )}

      {/* Product Title & Pricing */}
      <Link href={`/product/${product.id}`} style={{ display: 'block' }}>
        <h3
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#18181b',
            marginBottom: '4px',
            lineHeight: 1.35,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {lang === 'ko' ? product.name_ko : product.name_en}
        </h3>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          {product.discount_rate > 0 && (
            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#ef4444' }}>
              {product.discount_rate}%
            </span>
          )}

          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#18181b' }}>
            {formatKRW(finalPrice)}
          </span>

          {product.discount_price && (
            <span style={{ fontSize: '0.75rem', color: '#a1a1aa', textDecoration: 'line-through' }}>
              {formatKRW(product.price)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
