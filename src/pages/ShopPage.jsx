import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { ProductPreviewModal } from '../components/common/ProductPreviewModal.jsx';
import { CATEGORIES_BY_GENDER, getFilteredProducts, PRODUCTS } from '../data/products.js';
import { SlidersHorizontal, X, ChevronRight } from 'lucide-react';

export function ShopPage() {
  const { lang, t } = useLanguage();
  const [location, setLocation] = useLocation();

  // Filters parsed from URL query
  const [selectedGender, setSelectedGender] = useState('all'); // 'all' | 'men' | 'women'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(''); // 'new' | 'best' | 'sale' | ''
  const [sortBy, setSortBy] = useState('newest');

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
        if (activeFilter === 'sale') params.append('isSale', 'true');
        if (sortBy) params.append('sort', sortBy);

        const res = await fetch(`/api/products?${params.toString()}`);
        const json = await res.json();

        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setProducts(json.data);
        } else {
          // Fallback to local master dataset
          const fallback = getFilteredProducts({
            gender: selectedGender,
            category: selectedCategory,
            search: searchQuery,
            filter: activeFilter,
            sort: sortBy,
          });
          setProducts(fallback);
        }
      } catch (err) {
        // Fallback to local master dataset
        const fallback = getFilteredProducts({
          gender: selectedGender,
          category: selectedCategory,
          search: searchQuery,
          filter: activeFilter,
          sort: sortBy,
        });
        setProducts(fallback);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedGender, selectedCategory, searchQuery, activeFilter, sortBy]);

  // Update URL helper without full page reload
  const updateUrl = (newGender, newCategory, newFilter, newSearch, newSort) => {
    const params = new URLSearchParams();
    const g = newGender !== undefined ? newGender : selectedGender;
    const c = newCategory !== undefined ? newCategory : selectedCategory;
    const f = newFilter !== undefined ? newFilter : activeFilter;
    const s = newSearch !== undefined ? newSearch : searchQuery;
    const sort = newSort !== undefined ? newSort : sortBy;

    if (g && g !== 'all') params.set('gender', g);
    if (c && c !== 'all') params.set('category', c);
    if (f) params.set('filter', f);
    if (s) params.set('search', s);
    if (sort && sort !== 'newest') params.set('sort', sort);

    const qs = params.toString();
    const target = `/shop${qs ? `?${qs}` : ''}`;
    window.history.pushState({}, '', target);
    setLocation(target);
  };

  // Available categories based on selected gender
  const availableCategories = useMemo(() => {
    if (selectedGender === 'men') {
      return CATEGORIES_BY_GENDER.men;
    }
    if (selectedGender === 'women') {
      return CATEGORIES_BY_GENDER.women;
    }
    // All categories combined unique
    const set = new Map();
    [...CATEGORIES_BY_GENDER.women, ...CATEGORIES_BY_GENDER.men].forEach((item) => {
      if (!set.has(item.key)) set.set(item.key, item);
    });
    return Array.from(set.values());
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
    <div style={{ backgroundColor: '#ffffff', minHeight: '80vh', padding: '32px 0 80px' }}>
      <div className="container">
        {/* Top Breadcrumb & Clean Heading */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#8c8984', marginBottom: '8px' }}>
            <span>NOEUL</span>
            <ChevronRight size={12} />
            <span style={{ textTransform: 'uppercase' }}>{selectedGender}</span>
            {selectedCategory !== 'all' && (
              <>
                <ChevronRight size={12} />
                <span style={{ textTransform: 'capitalize' }}>{selectedCategory}</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1
                className="font-serif"
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: '#18181b',
                  lineHeight: 1.2,
                }}
              >
                {getPageHeading()}
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '4px' }}>
                {products.length} {lang === 'ko' ? '개의 에센셜 아이템' : t('shop.total_count', { count: '' }).replace('{count} ', '')}
              </p>
            </div>

            {/* Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{t('shop.sort_by')}:</span>
              <select
                value={sortBy}
                onChange={(e) => updateUrl(undefined, undefined, undefined, undefined, e.target.value)}
                style={{
                  padding: '6px 10px',
                  fontSize: '0.8125rem',
                  border: '1px solid #e4e4e7',
                  borderRadius: '3px',
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
        </div>

        {/* =========================================================
            DYNAMIC GENDER SELECTOR TABS (ALL | MEN | WOMEN)
            ========================================================= */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid #f0f0f1',
            paddingBottom: '12px',
            marginBottom: '16px',
          }}
        >
          {['all', 'women'].map((g) => {
            const isSelected = selectedGender === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => updateUrl(g, 'all', undefined, undefined, undefined)}
                style={{
                  padding: '6px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 700 : 500,
                  letterSpacing: '0.04em',
                  borderRadius: '2px',
                  border: isSelected ? '1px solid #18181b' : '1px solid #e4e4e7',
                  backgroundColor: isSelected ? '#18181b' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#52525b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textTransform: 'uppercase',
                }}
              >
                {g === 'all' ? t('nav.all') : t('nav.women')}
              </button>
            );
          })}
        </div>

        {/* =========================================================
            DYNAMIC CATEGORY FILTER PILLS (T-Shirts, Jeans, etc.)
            ========================================================= */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '16px',
            marginBottom: '28px',
            scrollbarWidth: 'none',
          }}
        >
          {/* 'All' subcategory button */}
          <button
            type="button"
            onClick={() => updateUrl(undefined, 'all', undefined, undefined, undefined)}
            style={{
              padding: '5px 12px',
              fontSize: '0.75rem',
              fontWeight: selectedCategory === 'all' ? 600 : 400,
              borderRadius: '16px',
              border: selectedCategory === 'all' ? '1px solid #18181b' : '1px solid #f0f0f1',
              backgroundColor: selectedCategory === 'all' ? '#f4f4f5' : '#ffffff',
              color: selectedCategory === 'all' ? '#18181b' : '#71717a',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {t('shop.all_categories')}
          </button>

          {availableCategories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => updateUrl(undefined, cat.key, undefined, undefined, undefined)}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 600 : 400,
                  borderRadius: '16px',
                  border: isSelected ? '1px solid #18181b' : '1px solid #f0f0f1',
                  backgroundColor: isSelected ? '#18181b' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#71717a',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {lang === 'ko' ? cat.label_ko : cat.label}
              </button>
            );
          })}
        </div>

        {/* Active Filter Chips (if any search or active filter applied) */}
        {(selectedCategory !== 'all' || selectedGender !== 'all' || searchQuery || activeFilter) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#8c8984', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('shop.filters')}:
            </span>

            {selectedGender !== 'all' && (
              <span
                onClick={() => updateUrl('all', undefined, undefined, undefined, undefined)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  backgroundColor: '#f4f4f5',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                <span>{selectedGender.toUpperCase()}</span>
                <X size={12} />
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span
                onClick={() => updateUrl(undefined, 'all', undefined, undefined, undefined)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  backgroundColor: '#f4f4f5',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                <span>{selectedCategory}</span>
                <X size={12} />
              </span>
            )}

            {searchQuery && (
              <span
                onClick={() => updateUrl(undefined, undefined, undefined, '', undefined)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  backgroundColor: '#f4f4f5',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                <span>"{searchQuery}"</span>
                <X size={12} />
              </span>
            )}

            <button
              type="button"
              onClick={() => updateUrl('all', 'all', '', '', 'newest')}
              style={{
                fontSize: '0.6875rem',
                color: '#ef4444',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginLeft: '6px',
              }}
            >
              {t('shop.reset_filters')}
            </button>
          </div>
        )}

        {/* =========================================================
            RESPONSIVE PRODUCT GRID (4 Cols Desktop, 3 Cols Tablet, 2 Cols Mobile)
            ========================================================= */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
            <p>{t('home.loading')}</p>
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '90px 0',
              border: '1px dashed #e4e4e7',
              borderRadius: '4px',
              backgroundColor: '#fafafa',
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
          <div className="noeul-product-grid product-grid">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={(p) => setPreviewProduct(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* STEP 2: First Click Preview Modal */}
      <ProductPreviewModal
        product={previewProduct}
        isOpen={!!previewProduct}
        onClose={() => setPreviewProduct(null)}
      />
    </div>
  );
}
