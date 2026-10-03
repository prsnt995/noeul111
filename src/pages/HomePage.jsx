import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { BestSellersCarousel } from '../components/home/BestSellersCarousel.jsx';
import { GenderSegmented } from '../components/common/GenderSegmented.jsx';
import { FilterChips } from '../components/common/FilterChips.jsx';
import { CATEGORIES_BY_GENDER } from '../data/products.js';
import { api } from '../utils/api.js';

export function HomePage() {
  const { lang, t } = useLanguage();
  const [, setLocation] = useLocation();
  // useSearch subscribes to query changes (useLocation only sees the
  // pathname, so query-only pill navigation would never re-sync state).
  const search = useSearch();

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
    const sp = new URLSearchParams(search);
    const g = sp.get('gender') || 'all';
    const c = sp.get('category') || 'all';
    const f = sp.get('filter') || '';
    const s = sp.get('search') || '';

    setSelectedGender(g.toLowerCase());
    setSelectedCategory(c.toLowerCase());
    setActiveFilter(f.toLowerCase());
    setSearchQuery(s);
  }, [search]);

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

  // 3. Fetch BEST items (top 6, follows gender + category so each
  // category has its own strip — fully controlled by admin is_best flag)
  useEffect(() => {
    let cancelled = false;
    async function loadBest() {
      setBestLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedGender !== 'all') params.append('gender', selectedGender);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        params.append('is_best', 'true');
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
  }, [selectedGender, selectedCategory]);

  // 4. Fetch grid products dynamically
  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedGender !== 'all') params.append('gender', selectedGender);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (activeFilter === 'new') params.append('is_new', 'true');
        if (activeFilter === 'best') params.append('is_best', 'true');
        if (activeFilter === 'sale') params.append('is_sale', 'true');
        if (searchQuery.trim()) params.append('search', searchQuery.trim());

        const json = await api.get(`/catalog/products?${params.toString()}`);
        if (cancelled) return;
        if (json.success && Array.isArray(json.data)) {
          setProducts(json.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => { cancelled = true; };
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

  const handleFilterSelect = (f) => {
    const params = new URLSearchParams(window.location.search);
    if (!f || f === '' || f === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', f);
    }
    const qs = params.toString();
    const target = qs ? `/?${qs}` : '/';
    setLocation(target);
  };

  const handleReset = () => {
    setLocation('/');
  };

  const handleSearchClear = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('search');
    const qs = params.toString();
    setLocation(qs ? `/?${qs}` : '/');
  };

  const activeContextLabel = () => {
    const parts = [];
    if (selectedGender !== 'all') {
      parts.push(selectedGender === 'men' ? t('nav.men') : t('nav.women'));
    }
    if (selectedCategory !== 'all') {
      const c = availableCategories.find((x) => x.key === selectedCategory);
      parts.push(c ? categoryLabel(c) : selectedCategory);
    }
    if (activeFilter) {
      if (activeFilter === 'new') parts.push(t('nav.new_arrivals'));
      else if (activeFilter === 'best') parts.push(t('nav.best_sellers'));
      else if (activeFilter === 'sale') parts.push(t('nav.sale'));
    }
    return parts.join(' • ');
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
          BEST ITEMS CAROUSEL (top, 6 items, pixel-step paging)
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
          Row 3 = quick filters (All / New / Best / Sale) + context
          ========================================================= */}
      <div
        className="noeul-category-bar home-filter-bar"
        style={{
          borderBottom: '1px solid #f0f0f0',
          padding: '8px 12px 10px',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 56,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '100%', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div style={{ flexShrink: 0 }}>
            <GenderSegmented
              value={selectedGender}
              ariaLabel={t('nav.all')}
              options={[
                { key: 'all', label: t('nav.all') },
                { key: 'men', label: t('nav.men') },
                { key: 'women', label: t('nav.women') },
              ]}
              onChange={handleGenderSwitch}
            />
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
              position: 'sticky',
              right: 0,
              backgroundColor: '#ffffff',
              paddingLeft: '12px',
              zIndex: 1,
            }}
          >
            {loading ? '...' : `${products.length} ${t('home.items')}`}
          </div>
        </div>

        {/* Row 2: category pills */}
        <div className="home-category-pills edge-fade" role="tablist" aria-label={t('home.shop_by_category')}>
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

        {/* Row 3: quick filters (same-page, mirrors drawer) + active chips */}
        <div className="home-quick-row">
          <div className="home-category-pills home-quick-pills" role="tablist" aria-label={t('shop.filters')}>
            {[
              { key: '', label: t('home.view_all') },
              { key: 'new', label: t('nav.new_arrivals') },
              { key: 'best', label: t('nav.best_sellers') },
              { key: 'sale', label: t('nav.sale') },
            ].map((f) => {
              const isSelected = (activeFilter || '') === f.key;
              return (
                <button
                  key={f.key || 'all'}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleFilterSelect(f.key)}
                  className={`home-pill home-chip${isSelected ? ' active' : ''}${f.key === 'sale' ? ' sale' : ''}`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          {activeContextLabel() && (
            <div className="home-context">
              <span>{activeContextLabel()}</span>
              <button type="button" onClick={handleReset} aria-label={t('shop.reset_filters')}>
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Row 4: active-filter chips with per-filter clear */}
        {(selectedGender !== 'all' || selectedCategory !== 'all' || activeFilter || searchQuery) && (
          <FilterChips
            chips={[
              ...(selectedGender !== 'all' ? [{
                key: 'gender',
                label: selectedGender === 'men' ? t('nav.men') : t('nav.women'),
                onClear: () => handleGenderSwitch('all'),
              }] : []),
              ...(selectedCategory !== 'all' ? [{
                key: 'category',
                label: (() => {
                  const c = availableCategories.find((x) => x.key === selectedCategory);
                  return c ? categoryLabel(c) : selectedCategory;
                })(),
                onClear: () => handleCategorySelect('all'),
              }] : []),
              ...(activeFilter ? [{
                key: 'filter',
                label: activeFilter === 'new' ? t('nav.new_arrivals') : activeFilter === 'best' ? t('nav.best_sellers') : t('nav.sale'),
                onClear: () => handleFilterSelect(''),
              }] : []),
              ...(searchQuery ? [{
                key: 'search',
                label: `“${searchQuery}”`,
                onClear: handleSearchClear,
              }] : []),
            ]}
            onResetAll={handleReset}
            resetLabel={t('shop.reset_filters')}
          />
        )}
      </div>

      {/* =========================================================
          PRODUCT GRID
          ========================================================= */}
      <main
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          padding: '0 0 40px',
          margin: 0,
          overflowX: 'hidden',
        }}
      >
        {loading ? (
          <div className="product-grid noeul-product-grid" aria-label={t('home.loading')}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
              <div key={k} className="best-skeleton-card" aria-hidden="true">
                <div className="best-skeleton-media" />
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
          <div key={`${selectedGender}-${selectedCategory}-${activeFilter}`} className="product-grid noeul-product-grid home-grid-animated">
            {products.map((prod, i) => (
              <ProductCard
                key={prod.id}
                product={prod}
                variant="overlay"
                eager={i < 3}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
