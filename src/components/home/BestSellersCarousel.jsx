import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard.jsx';

const AUTOPLAY_MS = 2500;
const TRACK_GAP = 12;

// Fixed slide widths keep BEST cards compact: 280px desktop → 373px tall
// media (3/4), smaller on tablet/mobile. Never percentage-based.
function getSlideWidth() {
  if (typeof window === 'undefined') return 280;
  if (window.innerWidth <= 768) return 220;
  if (window.innerWidth <= 1024) return 250;
  return 280;
}

export function BestSellersCarousel({ items = [], loading = false, title, subtitle }) {
  const [slideW, setSlideW] = useState(getSlideWidth);
  const [viewportW, setViewportW] = useState(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchX, setTouchX] = useState(null);
  const timerRef = useRef(null);
  const viewportRef = useRef(null);

  const total = items.length;

  useEffect(() => {
    const measure = () => {
      setSlideW(getSlideWidth());
      setViewportW(viewportRef.current?.clientWidth || 0);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Pixel-exact track: offset clamps so the track end lands flush with the
  // viewport end — never a blank gap.
  const step = slideW + TRACK_GAP;
  const trackW = total * slideW + Math.max(0, total - 1) * TRACK_GAP;
  const showControls = total > 0 && viewportW !== null && trackW > viewportW + 1;
  const maxOffset = Math.max(0, trackW - (viewportW ?? 0));
  const maxStart = viewportW === null ? 0 : Math.floor(maxOffset / step);
  const offset = Math.min(index * step, maxOffset);

  const goNext = useCallback(() => {
    if (!showControls) return;
    setIndex((i) => (i >= maxStart ? 0 : i + 1));
  }, [showControls, maxStart]);

  const goPrev = useCallback(() => {
    if (!showControls) return;
    setIndex((i) => (i <= 0 ? maxStart : i - 1));
  }, [showControls, maxStart]);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxStart));
  }, [maxStart, total]);

  useEffect(() => {
    if (loading || paused || !showControls) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    timerRef.current = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [loading, paused, showControls, goNext]);

  if (loading) {
    return (
      <section className="best-carousel-section" aria-label={title || 'Best items'}>
        <div className="best-carousel-head">
          <div>
            <p className="best-carousel-kicker">{subtitle || ''}</p>
            <h2 className="best-carousel-title">{title || 'BEST'}</h2>
          </div>
        </div>
        <div className="best-carousel-viewport" ref={viewportRef}>
          <div className="best-carousel-track" style={{ gap: TRACK_GAP }}>
            {[0, 1, 2].map((k) => (
              <div key={k} className="best-carousel-slide" style={{ flex: '0 0 auto', width: slideW, maxWidth: slideW }}>
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

  return (
    <section
      className="best-carousel-section"
      aria-roledescription="carousel"
      aria-label={title || 'Best items'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}
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
        ref={viewportRef}
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
          // On hover-capable devices the mouse handlers own the pause state;
          // only touch-only devices resume here.
          if (!window.matchMedia?.('(hover: hover)').matches) setPaused(false);
        }}
      >
        <div
          className="best-carousel-track"
          style={
            showControls
              ? {
                  gap: TRACK_GAP,
                  width: trackW,
                  transform: `translateX(-${offset}px)`,
                }
              : { gap: TRACK_GAP, width: '100%', transform: 'none', justifyContent: 'center' }
          }
        >
          {items.map((prod, i) => (
            <div
              key={prod.id || prod.slug}
              className="best-carousel-slide"
              style={{ flex: '0 0 auto', width: slideW, maxWidth: slideW }}
              aria-roledescription="slide"
              aria-label={`Best item ${i + 1} of ${total}`}
            >
              <ProductCard product={prod} variant="classic" eager={i === 0} />
            </div>
          ))}
        </div>
      </div>

      {showControls && (
        <div
          className="best-carousel-dots"
          role="group"
          aria-label="Best items pages"
          onKeyDown={(e) => { if (e.key === 'ArrowLeft') goPrev(); else if (e.key === 'ArrowRight') goNext(); }}
        >
          {Array.from({ length: maxStart + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-current={i === index ? true : undefined}
              aria-label={`Go to best items page ${i + 1} of ${maxStart + 1}`}
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
