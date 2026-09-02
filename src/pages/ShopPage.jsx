import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { Filter, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export function ShopPage() {
  const { lang, t, formatKRW } = useLanguage();
  const [location] = useLocation();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [bestOnly, setBestOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(400000);
  const [sortBy, setSortBy] = useState('newest');

  // Parse URL query params if any
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const cat = searchParams.get('category');
    const filter = searchParams.get('filter');

    if (cat) setSelectedCategory(cat);
    if (filter === 'new') setNewOnly(true);
    if (filter === 'best') setBestOnly(true);
  }, [location]);

  // Fetch categories & products
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        if (catData.success) setCategories(catData.data);

        // Build product query URL
        const params = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
        if (selectedSize) params.append('size', selectedSize);
        if (selectedColor) params.append('color', selectedColor);
        if (inStockOnly) params.append('inStock', 'true');
        if (newOnly) params.append('isNew', 'true');
        if (bestOnly) params.append('isBest', 'true');
        if (maxPrice < 400000) params.append('maxPrice', String(maxPrice));
        if (sortBy) params.append('sort', sortBy);

        const prodRes = await fetch(`/api/products?${params.toString()}`);
        const prodData = await prodRes.json();
        if (prodData.success) setProducts(prodData.data);
      } catch (err) {
        console.error('Shop load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCategory, selectedSize, selectedColor, inStockOnly, newOnly, bestOnly, maxPrice, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedSize('');
    setSelectedColor('');
    setInStockOnly(false);
    setNewOnly(false);
    setBestOnly(false);
    setMaxPrice(400000);
    setSortBy('newest');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedSize || selectedColor || inStockOnly || newOnly || bestOnly || maxPrice < 400000;

  const sizeOptions = ['S', 'M', 'L', 'XL', 'FREE'];
  const colorOptions = [
    { name_ko: '블랙', name_en: 'Black', hex: '#111112' },
    { name_ko: '화이트', name_en: 'White', hex: '#FFFFFF' },
    { name_ko: '차콜', name_en: 'Charcoal', hex: '#3b3b3d' },
    { name_ko: '베이지', name_en: 'Beige', hex: '#D2B48C' },
    { name_ko: '블루', name_en: 'Blue', hex: '#445D78' },
    { name_ko: '올리브', name_en: 'Olive', hex: '#636b56' },
  ];

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Page Title & Breadcrumb */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            {t('shop.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '4px' }}>
            {t('shop.subtitle')}
          </p>
        </div>

        {/* Toolbar: Filter Toggle & Sort Dropdown */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-light)',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Mobile filter button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="btn-secondary mobile-only"
            style={{ display: 'none', padding: '10px 16px', fontSize: '0.875rem' }}
          >
            <SlidersHorizontal size={16} />
            <span>{t('shop.filters')}</span>
          </button>

          {/* Product Counter */}
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t('shop.total_count', { count: products.length })}
          </span>

          {/* Sorting Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={14} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{
                width: 'auto',
                padding: '8px 14px',
                fontSize: '0.875rem',
                backgroundColor: 'transparent',
                borderRadius: '4px',
              }}
            >
              <option value="newest">{t('shop.sort_newest')}</option>
              <option value="popular">{t('shop.sort_popular')}</option>
              <option value="sales">{t('shop.sort_best')}</option>
              <option value="price_asc">{t('shop.sort_price_low')}</option>
              <option value="price_desc">{t('shop.sort_price_high')}</option>
            </select>
          </div>
        </div>

        {/* Main Grid with Sidebar Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '48px', alignItems: 'start' }} className="shop-layout">
          {/* Desktop Filter Sidebar */}
          <aside className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Active Filters Reset */}
            {hasActiveFilters && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t('shop.filters')}</span>
                <button
                  onClick={resetFilters}
                  style={{ fontSize: '0.75rem', color: 'var(--accent-sunset)', textDecoration: 'underline' }}
                >
                  {t('shop.reset_filters')}
                </button>
              </div>
            )}

            {/* 1. Category Filter */}
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                {t('shop.category')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                <button
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    textAlign: 'left',
                    color: selectedCategory === 'all' ? 'var(--accent-sunset)' : 'var(--text-secondary)',
                    fontWeight: selectedCategory === 'all' ? 600 : 400,
                  }}
                >
                  {t('shop.all_categories')}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.slug)}
                    style={{
                      textAlign: 'left',
                      color: selectedCategory === c.slug ? 'var(--accent-sunset)' : 'var(--text-secondary)',
                      fontWeight: selectedCategory === c.slug ? 600 : 400,
                      transition: 'color 0.15s',
                    }}
                  >
                    {lang === 'ko' ? c.name_ko : c.name_en}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Badges Filter */}
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                {lang === 'ko' ? '컬렉션 구분' : 'Tags & Badges'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newOnly}
                    onChange={(e) => setNewOnly(e.target.checked)}
                  />
                  <span>{t('shop.new_only')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bestOnly}
                    onChange={(e) => setBestOnly(e.target.checked)}
                  />
                  <span>{t('shop.best_only')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                  />
                  <span>{t('shop.in_stock_only')}</span>
                </label>
              </div>
            </div>

            {/* 3. Price Range Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('shop.price_range')}
                </h4>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  ~ {formatKRW(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min="30000"
                max="400000"
                step="10000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-sunset)' }}
              />
            </div>

            {/* 4. Size Filter */}
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                {t('shop.size')}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {sizeOptions.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                    style={{
                      border: selectedSize === sz ? '1px solid var(--text-primary)' : '1px solid var(--border-light)',
                      backgroundColor: selectedSize === sz ? 'var(--text-primary)' : 'transparent',
                      color: selectedSize === sz ? '#ffffff' : 'var(--text-primary)',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Color Filter */}
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                {t('shop.color')}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {colorOptions.map((col, idx) => {
                  const active = selectedColor === col.name_ko || selectedColor === col.name_en;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(active ? '' : (lang === 'ko' ? col.name_ko : col.name_en))}
                      title={lang === 'ko' ? col.name_ko : col.name_en}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: col.hex,
                        border: col.hex === '#FFFFFF' ? '1px solid #ccc' : 'none',
                        outline: active ? '2px solid var(--accent-sunset)' : 'none',
                        outlineOffset: '2px',
                        cursor: 'pointer',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
                <p>{lang === 'ko' ? '상품을 불러오는 중입니다...' : 'Loading collection...'}</p>
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <Filter size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '6px' }}>
                  {t('shop.no_products')}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
                  {t('shop.no_products_desc')}
                </p>
                <button onClick={resetFilters} className="btn-secondary">
                  {t('shop.reset_filters')}
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '32px 20px',
                }}
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="backdrop" onClick={() => setMobileFilterOpen(false)} style={{ zIndex: 100 }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '85%',
              maxWidth: '360px',
              height: '100%',
              backgroundColor: '#ffffff',
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('shop.filters')}</h3>
                <button onClick={() => setMobileFilterOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Filter content mirroring desktop */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>{t('shop.category')}</h4>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">{t('shop.all_categories')}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {lang === 'ko' ? c.name_ko : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>{t('shop.price_range')} (~{formatKRW(maxPrice)})</h4>
                  <input
                    type="range"
                    min="30000"
                    max="400000"
                    step="10000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', gap: '10px' }}>
              <button onClick={resetFilters} className="btn-secondary" style={{ flex: 1 }}>
                {t('shop.reset_filters')}
              </button>
              <button onClick={() => setMobileFilterOpen(false)} className="btn-primary" style={{ flex: 1 }}>
                {lang === 'ko' ? '적용하기' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive layout CSS */}
      <style>{`
        @media (max-width: 900px) {
          .shop-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
