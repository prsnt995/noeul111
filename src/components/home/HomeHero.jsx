import React from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getOptimizedImageUrl, getPrimaryProductImage, safeHttpUrl } from '../../utils/imageHelper.js';

/**
 * Homepage hero.
 *
 * An admin hero banner wins. Without one we render the split editorial hero
 * (copy left / campaign image right) so the top of the page is never a blank
 * block. The fallback image is the first best-seller or category product.
 */
export function HomeHero({ banner, site = {}, heroProduct }) {
  const { t } = useLanguage();

  const desktop = safeHttpUrl(banner?.image_url);
  const mobile = safeHttpUrl(banner?.mobile_image_url) || desktop;
  const href = safeHttpUrl(banner?.link_url) || '/shop';
  const title = banner?.title_ko || site?.hero_title || t('home.hero_title');
  const subtitle = banner?.subtitle_ko || site?.hero_subtitle || t('home.hero_subtitle');
  const cta = banner?.button_text_ko || t('home.hero_cta');
  const eyebrow = banner?.subtitle_en || 'NOEUL — SEOUL';

  if (desktop) {
    return (
      <section className="lux-hero lux-hero--banner" aria-label={title}>
        <div className="lux-hero__media">
          <picture>
            {mobile ? <source media="(max-width: 767px)" srcSet={mobile} /> : null}
            <img src={desktop} alt={banner?.alt_ko || title} fetchPriority="high" decoding="async" />
          </picture>
        </div>
        <div className="lux-hero__scrim" aria-hidden="true" />
        <div className="lux-hero__content">
          <span className="lux-eyebrow">{eyebrow}</span>
          <h1 className="lux-hero__title">{title}</h1>
          {subtitle ? <p className="lux-hero__sub">{subtitle}</p> : null}
          <Link href={href} className="lux-btn lux-btn--light lux-hero__cta">
            {cta} <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  const image = heroProduct ? getOptimizedImageUrl(getPrimaryProductImage(heroProduct), 1200) : '';

  return (
    <section className="lux-hero lux-hero--split" aria-label={title}>
      <div className="lux-hero__text">
        <span className="lux-eyebrow">{t('home.hero_tag')}</span>
        <h1 className="lux-hero__title">{title}</h1>
        {subtitle ? <p className="lux-hero__sub">{subtitle}</p> : null}
        <div>
          <Link href="/shop" className="lux-btn lux-btn--solid">
            {cta} <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
      <div className="lux-hero__image">
        {image ? <img src={image} alt="" fetchPriority="high" decoding="async" /> : null}
        <span className="lux-hero__image-caption">NOEUL — SEOUL</span>
      </div>
    </section>
  );
}

export default HomeHero;
