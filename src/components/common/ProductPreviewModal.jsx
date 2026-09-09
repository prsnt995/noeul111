import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { X } from 'lucide-react';

export function ProductPreviewModal({ product, isOpen, onClose }) {
  const [, setLocation] = useLocation();
  const { lang, formatKRW, t } = useLanguage();

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  // Extract primary image
  const displayImage = (() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch {}
      if (product.images) return product.images;
    }
    return product.image_url || '/products/men/classic-tshirt/1.jpg';
  })();

  const productName = lang === 'ko'
    ? (product.name_ko || product.name_en)
    : (product.name_en || product.name_ko);

  const finalPrice = product.discount_price || product.price;

  const handleOpenDetail = () => {
    onClose();
    setLocation(`/product/${product.id}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="noeul-preview-card"
        style={{
          position: 'relative',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '380px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#18181b',
            zIndex: 10,
            transition: 'background-color 0.15s ease',
          }}
        >
          <X size={18} />
        </button>

        {/* 1. Product Image (Clickable to view detail) */}
        <div
          onClick={handleOpenDetail}
          style={{
            width: '100%',
            aspectRatio: '3 / 4',
            maxHeight: '320px',
            backgroundColor: '#f7f7f8',
            borderRadius: '6px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            boxSizing: 'border-box',
            cursor: 'pointer',
          }}
          title={productName}
        >
          <img
            src={displayImage}
            alt={productName}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
              transition: 'transform 0.3s ease',
            }}
          />
        </div>

        {/* 2. Product Name & 3. Product Price */}
        <div
          onClick={handleOpenDetail}
          style={{
            marginTop: '12px',
            marginBottom: '14px',
            cursor: 'pointer',
          }}
        >
          {/* Product Name */}
          <h3
            style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#18181b',
              lineHeight: 1.35,
              letterSpacing: '-0.01em',
              marginBottom: '4px',
            }}
          >
            {productName}
          </h3>

          {/* Product Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#18181b' }}>
              {formatKRW(finalPrice)}
            </span>

            {product.discount_price && (
              <span style={{ fontSize: '0.8125rem', color: '#a1a1aa', textDecoration: 'line-through' }}>
                {formatKRW(product.price)}
              </span>
            )}

            {product.discount_rate > 0 && (
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ef4444' }}>
                {product.discount_rate}%
              </span>
            )}
          </div>
        </div>

        {/* 4. "View Product" Action Button */}
        <button
          type="button"
          onClick={handleOpenDetail}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '13px 16px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            backgroundColor: '#18181b',
            color: '#ffffff',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease',
          }}
        >
          {t('product.view_product')}
        </button>
      </div>
    </div>
  );
}
