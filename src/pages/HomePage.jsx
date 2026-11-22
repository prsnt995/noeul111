import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useStorefrontHome } from '../hooks/useStorefrontHome.js';
import { HomeHero } from '../components/home/HomeHero.jsx';
import { FastDeliveryBanner } from '../components/home/FastDeliveryBanner.jsx';
import { BestSellersCarousel } from '../components/home/BestSellersCarousel.jsx';
import { CategoryTiles } from '../components/home/CategoryTiles.jsx';
import { CategoryRow } from '../components/home/CategoryRow.jsx';
import { PromoBanner } from '../components/home/PromoBanner.jsx';
import { EditorialBlock } from '../components/home/EditorialBlock.jsx';
import { HomeSkeleton } from '../components/home/HomeSkeleton.jsx';
import { getOptimizedImageUrl, getPrimaryProductImage, safeHttpUrl } from '../utils/imageHelper.js';

/**
 * Homepage — curated discovery.
 *
 * The server returns a page model (`mode`, `maxRows`, `best`, `new`,
 * `categories`, `banners`) so the layout adapts to inventory:
 *   sparse  (<12)   → hero + BEST + tiles + new + editorial
 *   standard (12–30) → adds up to 3 category rows
 *   rich    (>30)   → adds up to 6 category rows
 *
 * Category rows keep their existing admin `sort_order`. Banners render
 * between rows using `anchor_category` + `anchor_position`.
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
  const best = Array.isArray(data.best) ? data.best : [];
  const fresh = Array.isArray(data.new) ? data.new : [];
  const maxRows = Number.isFinite(Number(data.maxRows)) ? Number(data.maxRows) : 0;
  const rows = maxRows > 0 ? categories.slice(0, maxRows) : [];
  const between = Array.isArray(banners.between_categories) ? banners.between_categories : [];
  const rowSlugs = new Set(rows.map((c) => c.slug));

  const bannersAt = (slug, position) => between.filter((b) => (
    b
    && b.anchor_category === slug
    && (b.anchor_position === 'before' ? 'before' : 'after') === position
  ));
  // Banners anchored to a category that did not make the row cut still render
  // after the category block rather than silently disappearing.
  const looseBanners = between.filter((b) => b && !rowSlugs.has(b.anchor_category));

  const heroProduct = best[0] || categories.find((c) => c.products?.length)?.products?.[0];
  const footerBanners = Array.isArray(banners.before_footer) ? banners.before_footer : [];
  const editorialBanner = footerBanners[0];
  const editorialImage = safeHttpUrl(editorialBanner?.image_url)
    || (fresh[0] ? getOptimizedImageUrl(getPrimaryProductImage(fresh[0]), 1000) : '')
    || (heroProduct ? getOptimizedImageUrl(getPrimaryProductImage(heroProduct), 1000) : '');

  return (
    <div className="lux-home">
      <HomeHero banner={banners.hero} site={data.site} heroProduct={heroProduct} />

      <FastDeliveryBanner variant="slim" />

      <BestSellersCarousel
        items={best}
        title={t('home.best_title')}
        subtitle={t('home.best_sub')}
        moreHref="/shop?filter=best"
        eyebrow="BEST SELLERS"
      />

      {(Array.isArray(banners.after_best) ? banners.after_best : []).map((b) => (
        <PromoBanner key={b.id || `after-best-${b.title_ko || b.image_url}`} banner={b} />
      ))}

      <CategoryTiles categories={categories} />

      {rows.map((cat) => (
        <React.Fragment key={cat.slug}>
          {bannersAt(cat.slug, 'before').map((b) => (
            <PromoBanner key={b.id || `${cat.slug}-before-${b.title_ko || b.image_url}`} banner={b} />
          ))}
          <CategoryRow category={cat} />
          {bannersAt(cat.slug, 'after').map((b) => (
            <PromoBanner key={b.id || `${cat.slug}-after-${b.title_ko || b.image_url}`} banner={b} />
          ))}
        </React.Fragment>
      ))}

      {looseBanners.map((b) => (
        <PromoBanner key={b.id || `loose-${b.title_ko || b.image_url}`} banner={b} />
      ))}

      <BestSellersCarousel
        items={fresh}
        title={t('home.new_arrivals')}
        subtitle={t('home.new_arrivals_sub')}
        moreHref="/shop?filter=new"
        eyebrow="NEW IN"
      />

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
