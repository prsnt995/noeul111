import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ProductPreviewModal } from './ProductPreviewModal.jsx';

export function ProductCard({ product, onSelect }) {
  const { lang } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [internalPreviewOpen, setInternalPreviewOpen] = useState(false);

  if (!product) return null;

  // Extract actual primary and optional secondary product images
  const images = (() => {
    let list = [];
    if (Array.isArray(product.images)) {
      list = product.images.filter(Boolean);
    } else if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) list = parsed.filter(Boolean);
      } catch {}
      if (list.length === 0 && product.images) list = [product.images];
    }
    if (list.length === 0 && product.image_url) list = [product.image_url];
    if (list.length === 0) list = ['/products/men/classic-tshirt/1.jpg'];
    return list;
  })();

  const primaryImage = images[0];
  const secondaryImage = images.length > 1 ? images[1] : null;

  const productName = lang === 'ko'
    ? (product.name_ko || product.name_en)
    : (product.name_en || product.name_ko);

  const handleClick = (e) => {
    e.preventDefault();
    if (onSelect) {
      onSelect(product);
    } else {
      setInternalPreviewOpen(true);
    }
  };

  return (
    <>
      {/* STEP 1: Minimal Image-Only Product Grid Card */}
      <div
        className="noeul-product-card product-card"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={`View ${productName}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e);
          }
        }}
        style={{
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          cursor: 'pointer',
          position: 'relative',
          display: 'block',
          outline: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            aspectRatio: '3 / 4',
            backgroundColor: '#f7f7f8',
            borderRadius: '3px',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {/* Primary Product Image */}
          <img
            src={primaryImage}
            alt={productName}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
              padding: '6px',
              boxSizing: 'border-box',
              transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
              transform: isHovered ? 'scale(1.025)' : 'scale(1)',
              opacity: isHovered && secondaryImage ? 0 : 1,
            }}
          />

          {/* Badges Overlay */}
          <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {product.stock <= 0 && (
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '2px',
                  backgroundColor: '#18181b',
                  color: '#ffffff',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {lang === 'ko' ? '품절' : 'OUT OF STOCK'}
              </span>
            )}
            {product.is_sale && product.stock > 0 && (
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '2px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  letterSpacing: '0.05em',
                }}
              >
                SALE
              </span>
            )}
            {product.is_new && product.stock > 0 && !product.is_sale && (
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '2px',
                  backgroundColor: '#18181b',
                  color: '#ffffff',
                  letterSpacing: '0.05em',
                }}
              >
                NEW
              </span>
            )}
          </div>

          {/* Secondary Image Fade on Desktop Hover (if available) */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${productName} angle 2`}
              loading="lazy"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block',
                userSelect: 'none',
                pointerEvents: 'none',
                padding: '6px',
                boxSizing: 'border-box',
                transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'scale(1.025)' : 'scale(1)',
              }}
            />
          )}
        </div>
      </div>

      {/* Fallback Internal Preview Modal if onSelect is not provided */}
      {!onSelect && (
        <ProductPreviewModal
          product={product}
          isOpen={internalPreviewOpen}
          onClose={() => setInternalPreviewOpen(false)}
        />
      )}
    </>
  );
}
