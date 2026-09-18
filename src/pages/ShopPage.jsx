import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { ProductPreviewModal } from '../components/common/ProductPreviewModal.jsx';
import { SlidersHorizontal, X, ChevronRight } from 'lucide-react';

export function ShopPage() {
  const { lang, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGender = searchParams.get('gender') || 'all';
  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const activeFilter = searchParams.get('filter') || '';
  const sortBy = searchParams.get('sort') || 'newest';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewProduct, setPreviewProduct] = useState(null);

  // 1. Sync state with URL query parameters
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const g = sp.get('gender') || 'all';
    const c = sp.get('category') || 'all';
    const s = sp.get('search') || '';
    const f = sp.get('filter') || '';
    const sort = sp.get('sort') || 'newest';

    setSelectedGender(g.toLowerCase());
    setSelectedCategory(c.toLowerCase());
    setSearchQuery(s);
    setActiveFilter(f.toLowerCase());
    setSortBy(sort);
  }, [location]);

  // 2. Fetch or compute products dynamically without reloading
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedGender !== 'all') params.append('gender', selectedGender);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        if (activeFilter === 'new') params.append('isNew', 'true');
        if (activeFilter === 'best') params.append('isBest', 'true');
        if (activeFilter === 'sale') params.append('sale', 'true');
        if (sortBy) params.append('sort', sortBy);

        const res = await fetch(`/api/v1/catalog/products?${params.toString()}`);
        const json = await res.json();

        if (res.ok && json.success && Array.isArray(json.data)) {
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

    fetchProducts();
  }, [selectedGender, selectedCategory, searchQuery, activeFilter, sortBy]);

  // Update URL helper without full page reload
  const updateUrl = (newGender, newCategory, newFilter, newSearch, newSort) => {
    const g = newGender !== undefined ? newGender : selectedGender;
    const c = newCategory !== undefined ? newCategory : selectedCategory;
    const f = newFilter !== undefined ? newFilter : activeFilter;
    const s = newSearch !== undefined ? newSearch : searchQuery;
    const sort = newSort !== undefined ? newSort : sortBy;
    const params = new URLSearchParams();
    if (g && g !== 'all') params.set('gender', g);
    if (c && c !== 'all') params.set('category', c);
    if (f) params.set('filter', f);
    if (s) params.set('search', s);
    if (sort && sort !== 'newest') params.set('sort', sort);
    setSearchParams(params);
  };

  // Available categories based on selected gender
  const availableCategories = useMemo(() => {
    return [];
  }, [selectedGender]);

  // Title formatting
  const getPageHeading = () => {
    if (searchQuery) {
      return lang === 'ko' ? `"${searchQuery}" 검색 결과` : `Search: "${searchQuery}"`;
    }
    if (activeFilter === 'new') return t('nav.new_arrivals');
    if (activeFilter === 'best') return t('nav.best_sellers');
    if (activeFilter === 'sale') return t('nav.sale');

    let prefix = '';
    if (selectedGender === 'women') prefix = lang === 'ko' ? '여성' : 'Women';
    else prefix = t('nav.all');

    if (selectedCategory !== 'all') {
      const catObj = availableCategories.find((c) => c.key === selectedCategory);
      const catName = catObj ? (lang === 'ko' ? catObj.label_ko : catObj.label) : selectedCategory;
      return `${prefix} • ${catName}`;
    }

    return lang === 'ko' ? `${prefix} 컬렉션` : `${prefix} Collection`;
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Category Sub-Bar */}
      <div
        className="noeul-category-bar"
        style={{
          borderBottom: '1px solid #f0f0f0',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: '56px',
          zIndex: 95,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          gap: '8px',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {/* Left: Category Navigation Bar (전체 / 여성) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {['all', 'women'].map((g) => {
            const isSelected = selectedGender === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => updateUrl(g, 'all', undefined, undefined, undefined)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 700 : 500,
                  letterSpacing: '0.08em',
                  color: isSelected ? '#000000' : '#888888',
                  borderBottom: isSelected ? '1.5px solid #000000' : '1.5px solid transparent',
                  paddingBottom: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {g === 'all' ? t('nav.all') : t('nav.women')}
              </button>
            );
          })}
        </div>

        {/* Selected Subcategory Indicator */}
        {selectedCategory !== 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#18181b', fontWeight: 600, flexShrink: 0 }}>
            <span>/</span>
            <span>{selectedCategory}</span>
            <button
              type="button"
              onClick={() => updateUrl(undefined, 'all', undefined, undefined, undefined)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#888888' }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Right: Item Count & Sort Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.6875rem', color: '#888888', fontWeight: 500 }}>
            {loading ? '...' : `${products.length} ${t('home.items')}`}
          </span>
          <select
            value={sortBy}
            onChange={(e) => updateUrl(undefined, undefined, undefined, undefined, e.target.value)}
            style={{
              padding: '2px 6px',
              fontSize: '0.75rem',
              border: '1px solid #e4e4e7',
              borderRadius: '2px',
              backgroundColor: '#ffffff',
              color: '#18181b',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="newest">{t('shop.sort_newest')}</option>
            <option value="best">{t('shop.sort_best')}</option>
            <option value="price_asc">{t('shop.sort_price_low')}</option>
            <option value="price_desc">{t('shop.sort_price_high')}</option>
          </select>
        </div>
      </div>

      {/* Product Images Grid directly below category sub-bar */}
      <main
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          padding: '4px 4px 60px',
          margin: 0,
          overflowX: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888888' }}>
            <p style={{ fontSize: '0.875rem' }}>{t('home.loading')}</p>
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#666666',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#18181b', marginBottom: '8px' }}>
              {t('shop.no_products')}
            </h3>
            <p style={{ color: '#71717a', fontSize: '0.8125rem', marginBottom: '20px' }}>
              {t('shop.no_products_desc')}
            </p>
            <button
              type="button"
              onClick={() => updateUrl('all', 'all', '', '', 'newest')}
              style={{
                padding: '8px 18px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: '#18181b',
                color: '#ffffff',
                borderRadius: '2px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t('home.view_all_products')}
            </button>
          </div>
        ) : (
          <div className="noeul-product-grid product-grid" style={{ margin: 0, padding: 0 }}>
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={(p) => setPreviewProduct(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* STEP 2: First Click Preview Modal */}
      <ProductPreviewModal
        product={previewProduct}
        isOpen={!!previewProduct}
        onClose={() => setPreviewProduct(null)}
      />
    </div>
  );
}
