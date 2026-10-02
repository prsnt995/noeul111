import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { BestSellersCarousel } from '../components/home/BestSellersCarousel.jsx';
import { CATEGORIES_BY_GENDER } from '../data/products.js';
import { api } from '../utils/api.js';

export function HomePage() {
  const { lang, t } = useLanguage();
  const [location, setLocation] = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bestProducts, setBestProducts] = useState([]);
  const [bestLoading, setBestLoading] = useState(true);
  const [liveCategories, setLiveCategories] = useState([]);

  // Active filter state from URL
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Sync state with URL query parameters
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const g = sp.get('gender') || 'all';
    const c = sp.get('category') || 'all';
    const f = sp.get('filter') || '';
    const s = sp.get('search') || '';

    setSelectedGender(g.toLowerCase());
    setSelectedCategory(c.toLowerCase());
    setActiveFilter(f.toLowerCase());
    setSearchQuery(s);
  }, [location]);

  // 2. Live categories (frontend-only, falls back to hardcoded list)
  useEffect(() => {
    let cancelled = false;
    api.get('/catalog/categories').then((res) => {
      if (!cancelled && res.success && Array.isArray(res.data) && res.data.length) {
        setLiveCategories(
          res.data.map((c) => ({
            key: (c.slug || '').toLowerCase(),
            label: c.name_en || c.slug,
            label_ko: c.name_ko || c.slug,
          }))
        );
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const availableCategories = useMemo(() => {
    if (liveCategories.length) {
      if (selectedGender === 'men') {
        return liveCategories.filter((c) =>
          ['tshirts', 'shirts', 'jeans', 'pants', 'underwear', 'socks', 'jackets', 'hoodies', 'accessories', 'bags'].includes(c.key)
        );
      }
      if (selectedGender === 'women') {
        return liveCategories.filter((c) =>
          ['tshirts', 'shirts', 'jeans', 'pants', 'underwear', 'socks', 'dresses', 'skirts', 'jackets', 'hoodies', 'accessories', 'bags'].includes(c.key)
        );
      }
      return liveCategories;
    }
    if (selectedGender === 'men') return CATEGORIES_BY_GENDER.men;
    if (selectedGender === 'women') return CATEGORIES_BY_GENDER.women;
    const seen = new Map();
    [...CATEGORIES_BY_GENDER.women, ...CATEGORIES_BY_GENDER.men].forEach((c) => {
      if (!seen.has(c.key)) seen.set(c.key, c);
    });
    return [...seen.values()];
  }, [selectedGender, liveCategories]);

  // 3. Fetch BEST items (top 6, follows gender filter)
  useEffect(() => {
    let cancelled = false;
    async function loadBest() {
      setBestLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedGender !== 'all') params.append('gender', selectedGender);
        params.append('isBest', 'true');
        const json = await api.get(`/catalog/products?${params.toString()}`);
        if (!cancelled) {
          if (json.success && Array.isArray(json.data)) {
            setBestProducts(json.data.slice(0, 6));
          } else {
            setBestProducts([]);
          }
        }
      } catch (err) {
        if (!cancelled) setBestProducts([]);
      } finally {
        if (!cancelled) setBestLoading(false);
      }
    }
    loadBest();
    return () => { cancelled = true; };
  }, [selectedGender]);

  // 4. Fetch grid products dynamically
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedGender !== 'all') params.append('gender', selectedGender);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (activeFilter === 'new') params.append('isNew', 'true');
        if (activeFilter === 'best') params.append('isBest', 'true');
        if (activeFilter === 'sale') params.append('sale', 'true');
        if (searchQuery.trim()) params.append('search', searchQuery.trim());

        const json = await api.get(`/catalog/products?${params.toString()}`);
        if (json.success && Array.isArray(json.data)) {
          setProducts(json.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [selectedGender, selectedCategory, activeFilter, searchQuery]);

  // Handle switching gender filter smoothly — single source of truth via wouter
  const handleGenderSwitch = (gender) => {
    const params = new URLSearchParams(window.location.search);
    if (gender === 'all') {
      params.delete('gender');
    } else {
      params.set('gender', gender);
    }
    params.delete('category');
    const qs = params.toString();
    const target = qs ? `/?${qs}` : '/';
    setLocation(target);
  };

  const handleCategorySelect = (slug) => {
    const params = new URLSearchParams(window.location.search);
    if (!slug || slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    const qs = params.toString();
    const target = qs ? `/?${qs}` : '/';
    setLocation(target);
  };

  const handleReset = () => {
    setLocation('/');
  };

  const categoryLabel = (c) => (lang === 'ko' ? (c.label_ko || c.label) : (c.label || c.label_ko));

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* =========================================================
          BEST ITEMS CAROUSEL (top, 6 items, 3 visible, shift-by-1)
          ========================================================= */}
      <BestSellersCarousel
        items={bestProducts}
        loading={bestLoading}
        title={t('home.best_title')}
        subtitle={t('home.best_sub')}
      />

      {/* =========================================================
          STICKY SELECTION BAR:
          Row 1 = gender (ALL / MEN / WOMEN) + item count
          Row 2 = category pills (shirts / jeans ...)
          ========================================================= */}
      <div
        className="noeul-category-bar home-filter-bar"
        style={{
          borderBottom: '1px solid #f0f0f0',
          padding: '8px 12px 10px',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 95,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Row 1: gender segmented + count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {[
              { key: 'all', label: t('nav.all') },
              { key: 'men', label: t('nav.men') },
              { key: 'women', label: t('nav.women') },
            ].map((item) => {
              const isSelected = selectedGender === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleGenderSwitch(item.key)}
                  aria-pressed={isSelected}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 700 : 500,
                    letterSpacing: '0.08em',
                    color: isSelected ? '#000000' : '#888888',
                    borderBottom: isSelected ? '1.5px solid #000000' : '1.5px solid transparent',
                    paddingBottom: '2px',
                    paddingLeft: '2px',
                    paddingRight: '2px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              fontSize: '0.6875rem',
              color: '#888888',
              letterSpacing: '0.04em',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          >
            {loading ? '...' : `${products.length} ${t('home.items')}`}
          </div>
        </div>

        {/* Row 2: category pills */}
        <div className="home-category-pills" role="tablist" aria-label={t('home.shop_by_category')}>
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => handleCategorySelect('all')}
            className={`home-pill${selectedCategory === 'all' ? ' active' : ''}`}
          >
            {t('shop.all_categories')}
          </button>
          {availableCategories.map((c) => {
            const isSelected = selectedCategory === c.key;
            return (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleCategorySelect(c.key)}
                className={`home-pill${isSelected ? ' active' : ''}`}
              >
                {categoryLabel(c)}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          PRODUCT GRID
          ========================================================= */}
      <main
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          padding: '4px 4px 40px',
          margin: 0,
          overflowX: 'hidden',
        }}
      >
        {loading ? (
          <div className="product-grid noeul-product-grid" aria-label={t('home.loading')}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
              <div key={k} className="best-skeleton-card" aria-hidden="true">
                <div className="best-skeleton-media" />
                <div className="best-skeleton-line" />
                <div className="best-skeleton-line short" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#666666' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>{t('home.no_products')}</p>
            <p style={{ fontSize: '0.8125rem', color: '#888888', marginBottom: '20px' }}>
              {t('home.no_products_desc')}
            </p>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '8px 20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t('home.view_all_products')}
            </button>
          </div>
        ) : (
          <div key={`${selectedGender}-${selectedCategory}`} className="product-grid noeul-product-grid home-grid-animated">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
