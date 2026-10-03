import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { CategorySidebar } from '../components/common/CategorySidebar.jsx';
import { CATEGORIES_BY_GENDER } from '../data/products.js';
import { api } from '../utils/api.js';
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

  // Fetch products via canonical api wrapper (credentials + CSRF handled)
  useEffect(() => {
    let cancelled = false;
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedGender !== 'all') params.append('gender', selectedGender);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        if (activeFilter === 'new') params.append('is_new', 'true');
        if (activeFilter === 'best') params.append('is_best', 'true');
        if (activeFilter === 'sale') params.append('is_sale', 'true');
        if (sortBy) params.append('sort', sortBy);

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

    fetchProducts();
    return () => { cancelled = true; };
  }, [selectedGender, selectedCategory, searchQuery, activeFilter, sortBy]);

  // Update URL helper — filter is cleared when category changes,
  // otherwise preserved so a filtered sort/view stays coherent.
  const updateUrl = (newGender, newCategory, newFilter, newSearch, newSort) => {
    const g = newGender !== undefined ? newGender : selectedGender;
    const c = newCategory !== undefined ? newCategory : selectedCategory;
    const f = newFilter !== undefined ? newFilter : activeFilter;
    const s = newSearch !== undefined ? newSearch : searchQuery;
    const sort = newSort !== undefined ? newSort : sortBy;
    const params = new URLSearchParams();
    if (g && g !== 'all') params.set('gender', g);
    if (c && c !== 'all') params.set('category', c);
    // Preserve filter/search across gender/category changes (same rule as
    // the homepage) so both storefronts behave identically.
    if (f && f !== '') params.set('filter', f);
    if (s) params.set('search', s);
    if (sort && sort !== 'newest') params.set('sort', sort);
    setSearchParams(params);
  };

  // Live categories from DB (creates if not present per Q2) — falls back to hardcoded
  const [liveCategories, setLiveCategories] = useState([]);
  useEffect(() => {
    let cancelled = false;
    api.get('/catalog/categories').then(res=>{
      if(!cancelled && res.success && Array.isArray(res.data) && res.data.length){
        // Map DB {slug, name_ko, name_en} -> {key, label, label_ko}
        setLiveCategories(res.data.map(c=>({ key: c.slug, label: c.name_en, label_ko: c.name_ko })));
      }
    }).catch(()=>{});
    return ()=>{ cancelled=true; };
  }, []);
  const availableCategories = useMemo(() => {
    if (liveCategories.length) {
      if (selectedGender === 'women') return liveCategories.filter(c=> ['tshirts','shirts','jeans','pants','underwear','socks','dresses','skirts','jackets','hoodies','accessories','bags'].includes(c.key));
      if (selectedGender === 'men') return liveCategories.filter(c=> ['tshirts','shirts','jeans','pants','underwear','socks','jackets','hoodies','accessories','bags'].includes(c.key));
      return liveCategories;
    }
    if (selectedGender === 'women') return CATEGORIES_BY_GENDER.women;
    if (selectedGender === 'men') return CATEGORIES_BY_GENDER.men;
    return [...CATEGORIES_BY_GENDER.women, ...CATEGORIES_BY_GENDER.men];
  }, [selectedGender, liveCategories]);

  // Title formatting
  const getPageHeading = () => {
    if (searchQuery) {
      return t('shop.search_results', { query: searchQuery });
    }
    if (activeFilter === 'new') return t('nav.new_arrivals');
    if (activeFilter === 'best') return t('nav.best_sellers');
    if (activeFilter === 'sale') return t('nav.sale');

    let prefix = '';
    if (selectedGender === 'women') prefix = t('nav.women');
    else if (selectedGender === 'men') prefix = t('nav.men');
    else prefix = t('nav.all');

    if (selectedCategory !== 'all') {
      const catObj = availableCategories.find((c) => c.key === selectedCategory);
      const catName = catObj ? (lang === 'ko' ? catObj.label_ko : catObj.label) : selectedCategory;
      return `${prefix} • ${catName}`;
    }

    return t('shop.collection', { prefix });
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Category Sub-Bar — sticky below header, same pattern as homepage */}
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
          top: 56,
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
        {/* Left: Category Navigation Bar (ALL / MEN / WOMEN — mirrors homepage) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {['all', 'men', 'women'].map((g) => {
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
                {g === 'all' ? t('nav.all') : g === 'men' ? t('nav.men') : t('nav.women')}
              </button>
            );
          })}
        </div>

        {/* Selected Subcategory Indicator */}
        {selectedCategory !== 'all' && (() => {
          const catObj = availableCategories.find((c) => c.key === selectedCategory);
          const catLabel = catObj ? `${catObj.label_ko} ${catObj.label}` : selectedCategory;
          return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#18181b', fontWeight: 600, flexShrink: 0 }}>
            <span>/</span>
            <span>{catLabel}</span>
            <button
              type="button"
              onClick={() => updateUrl(undefined, 'all', undefined, undefined, undefined)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#888888' }}
            >
              <X size={12} />
            </button>
          </div>
          );
        })()}

        {/* Right: Item Count & Sort Selector — pinned so it never
            scrolls off-canvas when the category chip is present */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: 'auto', position: 'sticky', right: 0, backgroundColor: '#ffffff', paddingLeft: '12px', zIndex: 1 }}>
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

      {/* Horizontal Category Bar (static: the gender sub-bar above stays sticky) */}
      <CategorySidebar
        sticky={false}
        categories={liveCategories}
        selectedCategory={selectedCategory}
        onSelect={(slug) => {
          const params = new URLSearchParams(searchParams.toString());
          if (slug === 'all') { params.delete('category'); } else { params.set('category', slug); }
          const qs = params.toString();
          setSearchParams(qs ? qs : '');
        }}
      />

      {/* Product Images Grid */}
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
            {activeFilter && selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => updateUrl(undefined, undefined, '', undefined, undefined)}
                style={{
                  marginTop: '8px',
                  padding: '8px 18px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                  color: '#18181b',
                  borderRadius: '2px',
                  border: '1px solid #e4e4e7',
                  cursor: 'pointer',
                }}
              >
                {t('shop.reset_filters')}
              </button>
            )}
          </div>
           ) : (
          <div className="noeul-product-grid product-grid">
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
