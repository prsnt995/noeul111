import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getOptimizedImageUrl, safeHttpUrl } from '../../utils/imageHelper.js';

/**
 * PDP band rendered below the information tabs: admin-managed rich blocks
 * (heading / text / image / image_grid) stored in products.detail_blocks.
 * Renders nothing when the product has no blocks.
 */
export function DetailContentBand({ blocks: initialBlocks = [] }) {
  let blocks = initialBlocks;
  const { lang } = useLanguage();
  let parsed = blocks;
  if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch { parsed = []; } }
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  blocks = parsed;

  const pick = (bilingual) => {
    if (!bilingual) return '';
    if (typeof bilingual === 'string') return bilingual;
    return String(bilingual.ko || bilingual.en || '');
  };

  let firstHeading = true;

  return (
    <section
      aria-label="상세 콘텐츠"
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

          if (b.type === 'divider') {
            return <hr key={i} style={{ border: 'none', borderTop: '1px solid #d4d4d8', margin: '24px 0' }} />;
          }

          if (b.type === 'quote') {
            const text = pick(b.text);
            if (!text) return null;
            const author = String(b.author || '').trim();
            return (
              <blockquote key={i} style={{ margin: '0 0 24px', padding: '16px 20px', borderLeft: '4px solid var(--accent-sunset, #e11d48)', backgroundColor: '#ffffff', borderRadius: '4px' }}>
                <p style={{ fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.7, color: '#18181b', margin: 0 }}>“{text}”</p>
                {author && <footer style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '8px' }}>— {author}</footer>}
              </blockquote>
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
                  decoding="async"
                  style={{ width: '100%', borderRadius: '6px', display: 'block', contentVisibility: 'auto' }}
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
            const items = b.images
              .map((im) => ({ url: safeHttpUrl(im?.url), caption: pick(im?.caption) }))
              .filter((x) => x.url);
            if (!items.length) return null;
            return <ImageGrid key={i} items={items} />;
          }

          return null;
        })}
      </div>
    </section>
  );
}

function ImageGrid({ items }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 12);
  return (
    <div style={{ margin: '0 0 24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
        }}
      >
        {visible.map((it, j) => (
          <figure key={j} style={{ margin: 0 }}>
            <img
              src={getOptimizedImageUrl(it.url, 640)}
              alt={it.caption || ''}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: '6px', display: 'block', contentVisibility: 'auto' }}
            />
            {it.caption && (
              <figcaption style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '6px', textAlign: 'center' }}>
                {it.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      {!showAll && items.length > 12 && (
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e4e4e7',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            더 보기 ({items.length - 12}장)
          </button>
        </div>
      )}
    </div>
  );
}
