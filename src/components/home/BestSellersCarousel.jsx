import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard.jsx';

const AUTOPLAY_MS = 2500;

function getVisibleCount() {
  if (typeof window === 'undefined') return 3;
  if (window.innerWidth <= 768) return 1;
  if (window.innerWidth <= 1024) return 2;
  return 3;
}

export function BestSellersCarousel({ items = [], loading = false, title, subtitle }) {
  const [visibleCount, setVisibleCount] = useState(getVisibleCount);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchX, setTouchX] = useState(null);
  const timerRef = useRef(null);

  const total = items.length;

  useEffect(() => {
    const onResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [total, visibleCount]);

  const goNext = useCallback(() => {
    if (total <= 1) return;
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    if (total <= 1) return;
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (loading || paused || total <= visibleCount) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    timerRef.current = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [loading, paused, total, visibleCount, goNext]);

  if (loading) {
    return (
      <section className="best-carousel-section" aria-label={title || 'Best items'}>
        <div className="best-carousel-head">
          <div>
            <p className="best-carousel-kicker">{subtitle || ''}</p>
            <h2 className="best-carousel-title">{title || 'BEST'}</h2>
          </div>
        </div>
        <div className="best-carousel-viewport">
          <div className="best-carousel-track">
            {[0, 1, 2].map((k) => (
              <div key={k} className="best-carousel-slide">
                <div className="best-skeleton-card">
                  <div className="best-skeleton-media" />
                  <div className="best-skeleton-line" />
                  <div className="best-skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!total) return null;

  const showControls = total > visibleCount;
  // Static mode (fewer items than slots): fill the row, no sliding, no empty gap.
  // Sliding mode (more items than slots): shift-by-1 track as before.
  const slideBasis = !showControls
    ? `calc(${100 / total}% - ${((total - 1) * 12) / total}px)`
    : visibleCount === 3 ? 'calc(33.333% - 8px)' : visibleCount === 2 ? 'calc(50% - 6px)' : 'calc(85% - 6px)';
  const offsetPct = total > 0 ? (index * 100) / total : 0;

  return (
    <section
      className="best-carousel-section"
      aria-roledescription="carousel"
      aria-label={title || 'Best items'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="best-carousel-head">
        <div>
          {subtitle && <p className="best-carousel-kicker">{subtitle}</p>}
          <h2 className="best-carousel-title">{title || 'BEST'}</h2>
        </div>
        {showControls && (
          <div className="best-carousel-arrows">
            <button type="button" className="best-carousel-arrow" onClick={goPrev} aria-label="Previous best items">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="best-carousel-arrow" onClick={goNext} aria-label="Next best items">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <div
        className="best-carousel-viewport"
        onTouchStart={(e) => {
          if (!showControls) return;
          setTouchX(e.touches[0].clientX);
          setPaused(true);
        }}
        onTouchEnd={(e) => {
          if (!showControls) return;
          if (touchX === null) {
            setPaused(false);
            return;
          }
          const dx = e.changedTouches[0].clientX - touchX;
          if (Math.abs(dx) > 35) {
            if (dx < 0) goNext();
            else goPrev();
          }
          setTouchX(null);
          setPaused(false);
        }}
      >
        <div
          className="best-carousel-track"
          style={
            showControls
              ? {
                  width: `${(total / visibleCount) * 100}%`,
                  transform: `translateX(-${offsetPct}%)`,
                }
              : { width: '100%', transform: 'none' }
          }
        >
          {items.map((prod) => (
            <div
              key={prod.id || prod.slug}
              className="best-carousel-slide"
              style={{ flexBasis: slideBasis, maxWidth: slideBasis }}
              aria-roledescription="slide"
              aria-label={`Best item ${index + 1} of ${total}`}
            >
              <ProductCard product={prod} variant="classic" />
            </div>
          ))}
        </div>
      </div>

      {showControls && (
        <div className="best-carousel-dots" role="tablist" aria-label="Best items pages">
          {items.map((prod, i) => (
            <button
              key={prod.id || i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to item ${i + 1}`}
              className={i === index ? 'active' : ''}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default BestSellersCarousel;
