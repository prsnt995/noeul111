import React, { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { ProductCard } from '../common/ProductCard.jsx';

const INITIAL = 4;

/**
 * One category section on the homepage.
 *
 * Layout scales with the *visible* inventory:
 *   1 product        → editorial duo (card + copy)
 *   2–3 products     → two-up grid
 *   4+ products      → four-up grid (wraps)
 *
 * Only the first INITIAL items render until the user expands the section
 * with the "더 보기" button at the bottom, which reveals every product in
 * that category in place.
 */
export function CategoryRow({ category }) {
  const [expanded, setExpanded] = useState(false);
  const products = Array.isArray(category?.products) ? category.products : [];
  if (!products.length) return null;

  const titleEn = category.name_en || category.slug;
  const titleKo = category.name_ko || '';
  const href = `/shop?category=${encodeURIComponent(category.slug)}`;
  const hasMore = products.length > INITIAL;
  const shown = expanded ? products : products.slice(0, INITIAL);
  const count = shown.length;

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

        {count === 1 && !expanded && products.length === 1 ? (
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
        ) : count <= 3 && !expanded ? (
          <div className="lux-cat-grid lux-cat-grid--two">
            {shown.map(card)}
          </div>
        ) : (
          <div className="lux-cat-grid">
            {shown.map(card)}
          </div>
        )}

        {hasMore ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
            <button
              type="button"
              className="lux-btn"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? (
                <>접기 <ChevronUp size={14} aria-hidden /></>
              ) : (
                <>더 보기 · {products.length - INITIAL}개 더 <ChevronDown size={14} aria-hidden /></>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default CategoryRow;
