import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getOptimizedImageUrl, safeHttpUrl } from '../../utils/imageHelper.js';

/**
 * PDP band rendered below the information tabs: admin-managed rich blocks
 * (heading / text / image / image_grid) stored in products.detail_blocks.
 * Renders nothing when the product has no blocks.
 */
export function DetailContentBand({ blocks = [] }) {
  const { lang } = useLanguage();
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  const pick = (bilingual) => {
    const ko = String(bilingual?.ko || '');
    const en = String(bilingual?.en || '');
    return lang === 'ko' ? (ko || en) : (en || ko);
  };

  let firstHeading = true;

  return (
    <section
      aria-label={lang === 'ko' ? '상세 콘텐츠' : 'Product detail content'}
      style={{ backgroundColor: '#f7f6f3', borderRadius: '8px', padding: '40px 24px', marginBottom: '64px' }}
    >
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        {blocks.map((b, i) => {
          if (!b || typeof b !== 'object') return null;

          if (b.type === 'heading') {
            const text = pick(b.text);
            if (!text) return null;
            const isFirst = firstHeading;
            firstHeading = false;
            return (
              <h3
                key={i}
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#18181b',
                  margin: isFirst ? '0 0 12px' : '32px 0 12px',
                }}
              >
                {text}
              </h3>
            );
          }

          if (b.type === 'text') {
            const text = pick(b.text);
            if (!text) return null;
            return (
              <p
                key={i}
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.8,
                  color: '#3f3f46',
                  whiteSpace: 'pre-wrap',
                  margin: '0 0 16px',
                }}
              >
                {text}
              </p>
            );
          }

          if (b.type === 'image') {
            const url = safeHttpUrl(b.url);
            if (!url) return null;
            const caption = pick(b.caption);
            return (
              <figure key={i} style={{ margin: '0 0 24px' }}>
                <img
                  src={getOptimizedImageUrl(url, 1200)}
                  alt={b.alt || caption || ''}
                  loading="lazy"
                  style={{ width: '100%', borderRadius: '6px', display: 'block' }}
                />
                {caption && (
                  <figcaption style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '8px', textAlign: 'center' }}>
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          if (b.type === 'image_grid' && Array.isArray(b.images) && b.images.length) {
            const urls = b.images.map((im) => safeHttpUrl(im?.url)).filter(Boolean);
            if (!urls.length) return null;
            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  margin: '0 0 24px',
                }}
              >
                {urls.map((url, j) => (
                  <img
                    key={j}
                    src={getOptimizedImageUrl(url, 640)}
                    alt=""
                    loading="lazy"
                    style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: '6px', display: 'block' }}
                  />
                ))}
              </div>
            );
          }

          return null;
        })}
      </div>
    </section>
  );
}
