import React from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import {
  getOptimizedImageUrl,
  getPrimaryProductImage,
  safeHttpUrl,
} from '../../utils/imageHelper.js';

function tileImage(category) {
  const adminImage = safeHttpUrl(category?.image_url);
  if (adminImage) return adminImage;
  const first = category?.products?.[0];
  return first ? getOptimizedImageUrl(getPrimaryProductImage(first), 520) : '';
}

/**
 * Category discovery strip. Tiles use the admin category image when set,
 * otherwise the first product photo, otherwise a typographic fallback.
 */
export function CategoryTiles({ categories = [] }) {
  if (!categories.length) return null;

  return (
    <section className="lux-section lux-section--tight" aria-label="카테고리별 탐색">
      <div className="lux-container">
        <div className="lux-section-head">
          <div>
            <span className="lux-eyebrow">Shop by Category</span>
            <h2 className="lux-section-title">카테고리별 탐색</h2>
          </div>
          <Link href="/shop" className="lux-link-more">
            전체보기 <ArrowRight size={13} aria-hidden />
          </Link>
        </div>

        <div className="lux-tiles">
          {categories.slice(0, 6).map((c) => {
            const image = tileImage(c);
            return (
              <Link
                key={c.slug}
                href={`/shop?category=${encodeURIComponent(c.slug)}`}
                className="lux-tile"
              >
                <div className="lux-tile__media">
                  {image ? (
                    <img src={image} alt={c.name_ko || c.name_en || c.slug} loading="lazy" decoding="async" />
                  ) : (
                    <span className="lux-tile__fallback">{(c.name_en || c.slug || 'N')[0]}</span>
                  )}
                </div>
                <span className="lux-tile__label">
                  <span className="lux-tile__ko">{c.name_ko || c.slug}</span>
                  <span className="lux-tile__en">{c.name_en || c.slug}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CategoryTiles;
