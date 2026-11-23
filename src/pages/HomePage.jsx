import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useStorefrontHome } from '../hooks/useStorefrontHome.js';
import { HomeHero } from '../components/home/HomeHero.jsx';
import { FastDeliveryBanner } from '../components/home/FastDeliveryBanner.jsx';
import { BrowseSection } from '../components/home/BrowseSection.jsx';
import { PromoBanner } from '../components/home/PromoBanner.jsx';
import { EditorialBlock } from '../components/home/EditorialBlock.jsx';
import { HomeSkeleton } from '../components/home/HomeSkeleton.jsx';
import { getOptimizedImageUrl, getPrimaryProductImage, safeHttpUrl } from '../utils/imageHelper.js';

/**
 * Homepage — curated discovery.
 *
 *   hero → service strip → browse (category index + recent 4) → promo → editorial
 *
 * Filtering/sorting/pagination live entirely on /shop, so the home page stays
 * light and curated regardless of catalog size.
 */
export function HomePage() {
  const { t } = useLanguage();
  const { data, loading, error } = useStorefrontHome();

  if (loading && !data) {
    return (
      <div className="lux-home">
        <HomeSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="lux-home">
        <div className="lux-container lux-section" style={{ textAlign: 'center' }}>
          <span className="lux-eyebrow">NOEUL</span>
          <h1 className="lux-section-title">컬렉션을 불러오지 못했습니다</h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 13, margin: '12px 0 22px' }}>
            {error || '잠시 후 다시 시도해 주세요.'}
          </p>
          <a href="/shop" className="lux-btn">전체 상품 보기</a>
        </div>
      </div>
    );
  }

  const banners = data.banners || {};
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const recent = Array.isArray(data.new) ? data.new : [];
  const heroProduct = recent[0] || categories.find((c) => c.products?.length)?.products?.[0];

  const promoBanners = (Array.isArray(banners.after_browse) && banners.after_browse.length)
    ? banners.after_browse
    : (Array.isArray(banners.after_best) ? banners.after_best : []);

  const footerBanners = Array.isArray(banners.before_footer) ? banners.before_footer : [];
  const editorialBanner = footerBanners[0];
  const editorialImage = safeHttpUrl(editorialBanner?.image_url)
    || (recent[0] ? getOptimizedImageUrl(getPrimaryProductImage(recent[0]), 1000) : '')
    || (heroProduct ? getOptimizedImageUrl(getPrimaryProductImage(heroProduct), 1000) : '');

  return (
    <div className="lux-home">
      <HomeHero banner={banners.hero} site={data.site} heroProduct={heroProduct} />

      <FastDeliveryBanner variant="slim" />

      <BrowseSection categories={categories} recent={recent} />

      {promoBanners.map((b) => (
        <PromoBanner key={b.id || `promo-${b.title_ko || b.image_url}`} banner={b} />
      ))}

      {footerBanners.slice(1).map((b) => (
        <PromoBanner key={b.id || `footer-${b.title_ko || b.image_url}`} banner={b} />
      ))}

      <EditorialBlock image={editorialImage} />

      {error ? (
        <p className="lux-container" style={{ paddingTop: 0, paddingBottom: 24, fontSize: 11, color: 'var(--muted)' }}>
          일부 콘텐츠를 불러오지 못했습니다. ({error})
        </p>
      ) : null}
    </div>
  );
}

export default HomePage;
