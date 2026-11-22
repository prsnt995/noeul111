import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard.jsx';

/**
 * Horizontal product rail used for BEST and NEW arrivals.
 *
 * Native scroll-snap instead of pixel-stepped transforms: it is smoother on
 * trackpads/touch, needs no resize math, and never leaves a blank gap at the
 * end. Arrows are progressive enhancement for mouse users and hide when the
 * rail does not overflow.
 */
export function BestSellersCarousel({
  items = [],
  loading = false,
  title,
  subtitle,
  moreHref = '/shop?filter=best',
  moreLabel = '전체보기',
  eyebrow = 'BEST SELLERS',
}) {
  const viewportRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(max > 4 && el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    // Re-measure once images/fonts settle.
    const timer = setTimeout(measure, 300);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      clearTimeout(timer);
    };
  }, [measure, items.length, loading]);

  const step = (dir) => {
    const el = viewportRef.current;
    if (!el) return;
    const first = el.querySelector('.lux-rail__item');
    const gap = 20;
    const width = first ? first.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * width, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section className="lux-section lux-section--tight" aria-label={title || 'BEST'}>
        <div className="lux-container">
          <div className="lux-section-head">
            <div>
              <span className="lux-eyebrow">{eyebrow}</span>
              <h2 className="lux-section-title">{title || 'BEST'}</h2>
            </div>
          </div>
          <div className="lux-rail__viewport" aria-hidden="true">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="lux-rail__item">
                <div className="lux-skeleton" style={{ aspectRatio: '3 / 4' }} />
                <div className="lux-skeleton" style={{ height: 12, marginTop: 14, width: '72%' }} />
                <div className="lux-skeleton" style={{ height: 10, marginTop: 8, width: '38%' }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="lux-section lux-section--tight" aria-label={title || 'BEST'}>
      <div className="lux-container">
        <div className="lux-section-head">
          <div>
            <span className="lux-eyebrow">{eyebrow}</span>
            <h2 className="lux-section-title">{title || 'BEST'}</h2>
            {subtitle ? <p className="lux-rail__sub">{subtitle}</p> : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {moreHref ? (
              <Link href={moreHref} className="lux-link-more">
                {moreLabel} <ArrowRight size={13} aria-hidden />
              </Link>
            ) : null}
            <div className="lux-rail__arrows">
              <button
                type="button"
                className="lux-rail__arrow"
                onClick={() => step(-1)}
                disabled={!canPrev}
                aria-label="이전 상품"
              >
                <ChevronLeft size={17} aria-hidden />
              </button>
              <button
                type="button"
                className="lux-rail__arrow"
                onClick={() => step(1)}
                disabled={!canNext}
                aria-label="다음 상품"
              >
                <ChevronRight size={17} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div
          className="lux-rail__viewport"
          ref={viewportRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={title || 'BEST'}
        >
          {items.map((prod, i) => (
            <div
              key={prod.id || prod.slug}
              className="lux-rail__item"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${items.length}`}
            >
              <ProductCard product={prod} variant="classic" eager={i === 0} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BestSellersCarousel;
