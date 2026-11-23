import React from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard.jsx';
import { getOptimizedImageUrl, getPrimaryProductImage, safeHttpUrl } from '../../utils/imageHelper.js';

/**
 * Homepage browse section — the single curated entry point to the catalog.
 *
 * Desktop: a sticky category index on the left, four recent products on
 * the right. Mobile: the index becomes a horizontal snap rail above a 2x2
 * product grid. Exactly one expansion CTA ("전체 상품 보기") is rendered.
 *
 * Filtering/sorting/pagination still live on /shop; this section only
 * navigates there. No in-page filter state on the home page.
 */
export function BrowseSection({ categories = [], recent = [] }) {
  const hasCategories = Array.isArray(categories) && categories.length > 0;
  const recentItems = Array.isArray(recent) ? recent.slice(0, 4) : [];

  return (
    <section className="home-browse" aria-label="카테고리별 탐색">
      <div className="home-browse__inner">
        {/* Category index — desktop sidebar, mobile rail */}
        {hasCategories ? (
          <aside className="home-browse__side" aria-label="카테고리">
            <div className="home-browse__side-head">
              <span className="lux-eyebrow">BROWSE</span>
              <h2 className="home-browse__title">카테고리</h2>
            </div>
            <ul className="category-index">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(c.slug)}`}
                    className="category-index__item"
                  >
                    <span className="category-index__name">{c.name_ko || c.slug}</span>
                    <span className="category-index__count">{c.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/shop" className="home-browse__expand">
              전체 상품 보기 <ArrowRight size={14} aria-hidden />
            </Link>
          </aside>
        ) : null}

        {/* Recent products */}
        <div className="home-browse__main">
          <div className="lux-section-head">
            <div>
              <span className="lux-eyebrow">NEW IN</span>
              <h2 className="lux-section-title">새로 입고된 상품</h2>
            </div>
          </div>

          {recentItems.length > 0 ? (
            <div className="recent-grid">
              {recentItems.map((prod, i) => (
                <ProductCard
                  key={prod.id || prod.slug}
                  product={prod}
                  variant="classic"
                  eager={i < 2}
                />
              ))}
            </div>
          ) : (
            <div className="home-browse__empty">
              <p>곧 새로운 상품이 입고됩니다.</p>
            </div>
          )}

          {/* Single expansion CTA on mobile (desktop CTA lives in the sidebar) */}
          <div className="home-browse__mobile-expand">
            <Link href="/shop" className="lux-btn lux-btn--solid home-browse__expand-btn">
              전체 상품 보기 <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrowseSection;
