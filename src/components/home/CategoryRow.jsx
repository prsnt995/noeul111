import React from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard.jsx';

/**
 * One category section on the homepage.
 *
 * Layout scales with inventory:
 *   1 product   → editorial duo (card + copy)
 *   2–3 products → two-up grid
 *   4 products   → four-up grid
 *   5+ products  → horizontal rail
 * Zero products → not rendered by the parent.
 */
export function CategoryRow({ category }) {
  const products = Array.isArray(category?.products) ? category.products : [];
  if (!products.length) return null;

  const titleEn = category.name_en || category.slug;
  const titleKo = category.name_ko || '';
  const href = `/shop?category=${encodeURIComponent(category.slug)}`;
  const count = products.length;

  const card = (product, index) => (
    <ProductCard key={product.id || product.slug} product={product} variant="classic" eager={index === 0} />
  );

  return (
    <section className="lux-cat-row" aria-label={titleKo || titleEn}>
      <div className="lux-container">
        <div className="lux-cat-head">
          <h2 className="lux-cat-title">
            {titleEn}
            {titleKo ? <span className="lux-cat-title__ko">{titleKo}</span> : null}
          </h2>
          <Link href={href} className="lux-link-more">
            전체보기 <ArrowRight size={13} aria-hidden />
          </Link>
        </div>

        {count === 1 ? (
          <div className="lux-duo">
            <div className="lux-duo__card">{card(products[0], 0)}</div>
            <div className="lux-duo__panel">
              <span className="lux-eyebrow">The Edit</span>
              <h3>{titleKo || titleEn}</h3>
              <p>
                {category.description_ko
                  || `${titleKo || titleEn} 라인의 시그니처 아이템. 절제된 실루엣과 고급스러운 소재로 완성했습니다.`}
              </p>
              <Link href={href} className="lux-btn">
                컬렉션 보기 <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </div>
        ) : count <= 3 ? (
          <div className="lux-cat-grid lux-cat-grid--two">
            {products.slice(0, 4).map(card)}
          </div>
        ) : count <= 4 ? (
          <div className="lux-cat-grid">
            {products.slice(0, 4).map(card)}
          </div>
        ) : (
          <div className="lux-rail__viewport">
            {products.map((product, index) => (
              <div key={product.id || product.slug} className="lux-rail__item">
                {card(product, index)}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default CategoryRow;
