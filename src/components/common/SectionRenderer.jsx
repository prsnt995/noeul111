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

    // 3. DAILY ARRIVALS (Matches "매일 매일 업데이트 / 신상 5% 할인")
    case 'products_grid':
    case 'daily_updates': {
      return (
        <section style={{ padding: '40px 0 80px', backgroundColor: '#ffffff' }}>
          <div className="container">
            {/* Korean Mall Daily Updates Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
                  alt=""
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FEE500' }}
                />
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#18181b' }}>
                    {title || '매일 매일 업데이트'}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ef4444', marginTop: '2px' }}>
                    {subtitle || '신상 5% 할인'}
                  </p>
                </div>
              </div>

              <Link href={content.view_all_link || '/shop?filter=new'} style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#71717a', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span>더보기</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            {/* Product Cards Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
                상품을 불러오는 중입니다...
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '20px 16px',
                }}
              >
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
      const images = content.images || [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=500&auto=format&fit=crop',
      ];

      return (
        <section style={{ padding: '60px 0', backgroundColor: '#fafafa', borderTop: '1px solid #f0f0f2' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ff5c5c', marginBottom: '6px' }}>
                <Camera size={18} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 800 }}>#NOEUL_OOTD</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{title}</h2>
              {subtitle && <p style={{ color: '#71717a', fontSize: '0.8125rem', marginTop: '2px' }}>{subtitle}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
              {images.map((imgUrl, idx) => (
                <div key={idx} style={{ height: '170px', borderRadius: '4px', overflow: 'hidden' }}>
                  <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}
