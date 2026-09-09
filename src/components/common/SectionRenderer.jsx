import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ProductCard } from './ProductCard.jsx';
import { api } from '../../utils/api.js';
import { ArrowRight, Truck, ShieldCheck, RefreshCw, Sparkles, Tag, Camera, ChevronRight } from 'lucide-react';

export function SectionRenderer({ section }) {
  const { lang, t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const content = section.content || {};

  useEffect(() => {
    if (['products_grid', 'products_carousel', 'featured_products', 'daily_updates'].includes(section.type)) {
      setLoading(true);
      const filterType = content.filter_type || 'all';
      const limit = content.limit || 4;
      let url = `/products?limit=${limit}`;

      if (filterType === 'new') url += '&badge=new';
      else if (filterType === 'best') url += '&badge=best';
      else if (filterType === 'featured') url += '&badge=featured';
      else if (content.category_id) url += `&category=${content.category_id}`;

      api.get(url)
        .then((res) => {
          if (res.success) setProducts(res.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }

    if (section.type === 'categories_grid') {
      api.get('/categories')
        .then((res) => {
          if (res.success) setCategories(res.data);
        })
        .catch(console.error);
    }
  }, [section.type, content.filter_type, content.limit, content.category_id]);

  const title = lang === 'ko' ? section.title_ko : (section.title_en || section.title_ko);
  const subtitle = lang === 'ko' ? section.subtitle_ko : (section.subtitle_en || section.subtitle_ko);

  switch (section.type) {
    // 1. KOREAN SPLIT HERO COLLAGE (Matches 66girls hero photo layout)
    case 'hero': {
      const heroPhotos = content.images || [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop',
      ];
      const mainPhoto = content.image_url || heroPhotos[0];
      const secondPhoto = content.secondary_image_url || heroPhotos[1];

      return (
        <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f0f0f2', overflow: 'hidden' }}>
          <div className="container" style={{ padding: '0 0 20px' }}>
            <Link
              href={content.button_link || '/shop'}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '8px',
                height: 'clamp(480px, 75vh, 720px)',
                cursor: 'pointer',
              }}
            >
              {/* Left Main Lifestyle Photo */}
              <div style={{ position: 'relative', height: '100%', overflow: 'hidden', backgroundColor: '#eee' }}>
                <img
                  src={mainPhoto}
                  alt={title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Right Secondary Model Photo */}
              <div style={{ position: 'relative', height: '100%', overflow: 'hidden', backgroundColor: '#eee' }}>
                <img
                  src={secondPhoto}
                  alt={title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </Link>
          </div>
        </section>
      );
    }

    // 2. 3-COLUMN CURATED THEMES WITH HASHTAGS (Matches "셔츠코디", "SlgTho", etc.)
    case 'curated_themes':
    case 'lookbook_story': {
      const themes = content.themes || [
        {
          tag_sub: '간절기',
          title: '셔츠코디',
          subtitle_script: 'Season of Shirt',
          image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
          label: '셔츠의 계절',
          hashtags: ['#셔츠', '#체크셔츠', '#코디추천'],
          link: '/shop?category=shirts',
        },
        {
          tag_sub: 'BRAND',
          title: 'SlgTho',
          subtitle_script: 'Slog & Thought',
          image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop',
          label: 'SlgTho 슬토',
          hashtags: ['#Slog', '#Thought', '#브랜드'],
          link: '/shop?filter=featured',
        },
        {
          tag_sub: 'CUSTOM',
          title: '노을 데님',
          subtitle_script: 'now, here...',
          image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop',
          label: 'now, here...',
          hashtags: ['#잘만든', '#데님', '#와이드핏'],
          link: '/shop?category=pants',
        },
      ];

      return (
        <section style={{ padding: '36px 0 60px', backgroundColor: '#ffffff' }}>
          <div className="container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {themes.map((t, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Photo Card with text overlay */}
                  <Link
                    href={t.link}
                    style={{
                      position: 'relative',
                      height: '380px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      display: 'block',
                      backgroundColor: '#f4f4f5',
                    }}
                  >
                    <img
                      src={t.image}
                      alt={t.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />

                    {/* Middle Card Title Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.15)',
                        textAlign: 'center',
                        color: '#ffffff',
                        padding: '16px',
                      }}
                    >
                      {t.tag_sub && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            backgroundColor: 'rgba(24,24,27,0.75)',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            marginBottom: '6px',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {t.tag_sub}
                        </span>
                      )}
                      <h3
                        className="font-serif"
                        style={{
                          fontSize: '2rem',
                          fontWeight: 900,
                          letterSpacing: '-0.02em',
                          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        }}
                      >
                        {t.title}
                      </h3>
                      {t.subtitle_script && (
                        <span
                          style={{
                            fontFamily: 'serif',
                            fontStyle: 'italic',
                            fontSize: '1.125rem',
                            opacity: 0.95,
                            marginTop: '2px',
                            color: '#FEE500',
                          }}
                        >
                          {t.subtitle_script}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Bottom Text & Hashtag Pills */}
                  <div style={{ marginTop: '12px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#18181b', marginBottom: '6px' }}>
                      {t.label}
                    </h4>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {t.hashtags.map((h, hIdx) => (
                        <span
                          key={hIdx}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#ff5c5c',
                            backgroundColor: '#fff1f2',
                            padding: '3px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // 3. DAILY ARRIVALS & MINIMAL PRODUCT SHOWCASE
    case 'products_grid':
    case 'daily_updates': {
      return (
        <section style={{ padding: '56px 0 80px', backgroundColor: '#ffffff' }}>
          <div className="container">
            {/* Minimal Clean Korean Fashion Section Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '32px',
                paddingBottom: '16px',
                borderBottom: '1px solid #f0f0f1',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#8c8984',
                    marginBottom: '4px',
                  }}
                >
                  {lang === 'ko' ? '에센셜 컬렉션' : 'ESSENTIAL COLLECTION'}
                </span>
                <h2
                  style={{
                    fontSize: '1.375rem',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#18181b',
                    lineHeight: 1.2,
                  }}
                >
                  {title || (lang === 'ko' ? '매일 매일 업데이트' : 'Daily Updates')}
                </h2>
                {subtitle && (
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: '#71717a',
                      marginTop: '4px',
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              <Link
                href={content.view_all_link || '/shop?filter=new'}
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  color: '#18181b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s ease',
                }}
              >
                <span>{lang === 'ko' ? '전체보기' : 'View All'}</span>
                <ChevronRight size={15} />
              </Link>
            </div>

            {/* Product Cards Grid with Minimal Responsive Styling */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
                상품을 불러오는 중입니다...
              </div>
            ) : (
              <div className="noeul-product-grid">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    // 4. CATEGORIES GRID
    case 'categories_grid': {
      return (
        <section style={{ padding: '40px 0 60px', backgroundColor: '#fcfbf9' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 800 }}>{title}</h2>
                {subtitle && <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '2px' }}>{subtitle}</p>}
              </div>
              <Link href={content.view_all_link || '/shop'} style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-sunset)' }}>
                전체보기 →
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  style={{
                    position: 'relative',
                    height: '220px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    display: 'block',
                  }}
                >
                  <img
                    src={cat.image_url || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop'}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '14px',
                      color: '#ffffff',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{lang === 'ko' ? cat.name_ko : cat.name_en}</h3>
                      <span style={{ fontSize: '0.6875rem', opacity: 0.9 }}>{cat.product_count || 0} ITEMS</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // 5. PROMO BANNER
    case 'promo_banner': {
      return (
        <section style={{ backgroundColor: '#18181b', color: '#ffffff', padding: '60px 0', position: 'relative', overflow: 'hidden' }}>
          {content.image_url && (
            <img
              src={content.image_url}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }}
            />
          )}
          <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#ff5c5c', color: '#fff', padding: '3px 10px', borderRadius: '12px', display: 'inline-block', marginBottom: '12px' }}>
              SPECIAL BENEFIT
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>{title}</h2>
            {subtitle && <p style={{ fontSize: '0.9375rem', color: '#d4d4d8', lineHeight: 1.5, marginBottom: '20px' }}>{subtitle}</p>}
            {content.coupon_code && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '6px', marginBottom: '20px' }}>
                <Tag size={15} color="#FEE500" />
                <span style={{ fontSize: '0.8125rem' }}>쿠폰코드: <strong>{content.coupon_code}</strong></span>
              </div>
            )}
            <div>
              <Link href={content.button_link || '/shop'} className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)', padding: '12px 28px', fontSize: '0.875rem' }}>
                {content.button_text_ko || '지금 혜택 받기'}
              </Link>
            </div>
          </div>
        </section>
      );
    }

    // 6. INSTAGRAM FEED
    case 'instagram_feed': {
      const instagramUsername = content.instagram_username || '@noeul.me';
      const instagramUrl = content.instagram_url || 'https://www.instagram.com/noeul.me/';
      const images = content.images || [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=600&auto=format&fit=crop',
      ];

      // Instagram gradient SVG icon
      const InstagramIcon = () => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="ig-grad-1" cx="30%" cy="107%" r="150%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="5%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="60%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-grad-1)" />
          <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.6" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
        </svg>
      );

      return (
        <section style={{ padding: '72px 0 80px', backgroundColor: '#ffffff', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="container">
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '48px', gap: '20px' }}>
              {/* Instagram badge row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <InstagramIcon />
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: '#8a3ab9',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Instagram
                </span>
              </div>

              {/* Title */}
              <h2
                className="font-serif"
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                  maxWidth: '560px',
                }}
              >
                {title || 'Follow NOEUL.ME on Instagram'}
              </h2>

              {/* Subtitle */}
              {subtitle && (
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9375rem',
                    textAlign: 'center',
                    maxWidth: '420px',
                    lineHeight: 1.6,
                  }}
                >
                  {subtitle}
                </p>
              )}

              {/* Username + Follow button row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#8a3ab9')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  {instagramUsername}
                </a>

                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    borderRadius: '4px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    textDecoration: 'none',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
                    boxShadow: '0 2px 12px rgba(220,39,67,0.25)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(220,39,67,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(220,39,67,0.25)';
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="white" fillOpacity="0.25"/>
                    <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.8"/>
                    <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
                  </svg>
                  Follow on Instagram
                </a>
              </div>
            </div>

            {/* Photo Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '6px',
              }}
              className="instagram-grid"
            >
              {images.slice(0, 6).map((imgUrl, idx) => (
                <a
                  key={idx}
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    position: 'relative',
                    display: 'block',
                    aspectRatio: '1 / 1',
                    overflow: 'hidden',
                    borderRadius: '3px',
                    backgroundColor: '#f0eee9',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.querySelector('.ig-overlay').style.opacity = '1';
                    e.currentTarget.querySelector('img').style.transform = 'scale(1.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.querySelector('.ig-overlay').style.opacity = '0';
                    e.currentTarget.querySelector('img').style.transform = 'scale(1)';
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`NOEUL Instagram ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                  {/* Hover overlay */}
                  <div
                    className="ig-overlay"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(240,148,51,0.7) 0%, rgba(230,104,60,0.7) 25%, rgba(220,39,67,0.7) 50%, rgba(204,35,102,0.7) 75%, rgba(188,24,136,0.7) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="white" fillOpacity="0.2"/>
                      <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.8"/>
                      <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
                    </svg>
                  </div>
                </a>
              ))}
            </div>

            {/* Bottom CTA */}
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.04em',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '2px',
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#8a3ab9';
                  e.currentTarget.style.borderColor = '#8a3ab9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
              >
                더보기 · View all on Instagram
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}
