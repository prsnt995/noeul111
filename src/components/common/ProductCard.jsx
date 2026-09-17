import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ProductPreviewModal } from './ProductPreviewModal.jsx';
import { getProductImages } from '../../utils/imageHelper.js';

export function ProductCard({ product, onSelect }) {
  const { lang } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [internalPreviewOpen, setInternalPreviewOpen] = useState(false);

  if (!product) return null;

  // Extract actual product images dynamically
  const images = getProductImages(product);
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
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
              boxSizing: 'border-box',
              transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
              transform: isHovered ? 'scale(1.03)' : 'scale(1)',
              opacity: isHovered && secondaryImage ? 0 : 1,
            }}
          />

          {/* Secondary Hover Image (if available) */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${productName} hover`}
              loading="lazy"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                userSelect: 'none',
                pointerEvents: 'none',
                boxSizing: 'border-box',
                transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                opacity: isHovered ? 1 : 0,
              }}
            />
          )}

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
