import React from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { safeHttpUrl } from '../../utils/imageHelper.js';

/**
 * Full-bleed promotional banner used between homepage category sections.
 *
 * Placement is decided by the parent (anchor category + before/after); this
 * component only renders the visual. `overlay_opacity` (0–100) is passed to
 * CSS so the scrim strength is admin-controlled.
 */
export function PromoBanner({ banner }) {
  if (!banner) return null;

  const image = safeHttpUrl(banner.image_url);
  const href = safeHttpUrl(banner.link_url);
  const title = banner.title_ko || banner.title_en || '';
  const sub = banner.subtitle_ko || banner.subtitle_en || '';
  const cta = banner.button_text_ko || banner.button_text_en || '';
  const opacity = Number.isFinite(Number(banner.overlay_opacity))
    ? Math.max(0, Math.min(100, Number(banner.overlay_opacity)))
    : 35;
  const light = banner.theme === 'light';
  const ctaStyle = ['ghost', 'solid', 'underline'].includes(banner.cta_style) ? banner.cta_style : 'ghost';

  const ctaClass = light
    ? (ctaStyle === 'solid' ? 'lux-btn lux-btn--solid' : ctaStyle === 'underline' ? 'lux-link-more' : 'lux-btn')
    : (ctaStyle === 'solid' ? 'lux-btn lux-btn--paper' : ctaStyle === 'underline' ? 'lux-link-more lux-link-more--light' : 'lux-btn lux-btn--light');

  const content = (
    <div className="lux-promo__content">
      {sub ? <span className="lux-eyebrow">{sub}</span> : null}
      <h2 className="lux-promo__title">{title}</h2>
      {cta ? (
        <span className={ctaClass}>
          {cta} <ArrowRight size={14} aria-hidden />
        </span>
      ) : null}
    </div>
  );

  return (
    <section
      className={`lux-promo${light ? ' lux-promo--light' : ''}`}
      style={{ '--promo-overlay': opacity / 100 }}
      aria-label={title || '프로모션'}
    >
      {image ? (
        <div className="lux-promo__media">
          <img src={image} alt={banner.alt_ko || title} loading="lazy" decoding="async" />
        </div>
      ) : null}
      {href ? (
        <Link href={href} className="lux-promo__link" {...(banner.open_in_new_tab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {content}
        </Link>
      ) : content}
    </section>
  );
}

export default PromoBanner;
