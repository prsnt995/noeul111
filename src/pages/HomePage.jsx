import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { ProductPreviewModal } from '../components/common/ProductPreviewModal.jsx';
import { getFilteredProducts } from '../data/products.js';

export function HomePage() {
  const { lang, t } = useLanguage();
  const [location, setLocation] = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewProduct, setPreviewProduct] = useState(null);

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

  // 2. Fetch products dynamically
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

    loadProducts();
  }, [selectedGender, selectedCategory, activeFilter, searchQuery]);

  // Handle switching gender filter smoothly without reload
  const handleGenderSwitch = (gender) => {
    const params = new URLSearchParams(window.location.search);
    if (gender === 'all') {
      params.delete('gender');
    } else {
      params.set('gender', gender);
    }
    // reset category when gender switches
    params.delete('category');
    const qs = params.toString();
    const target = qs ? `/?${qs}` : '/';
    window.history.pushState({}, '', target);
    setLocation(target);
  };

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
          3. MINIMAL CATEGORY SUB-BAR (전체 / 여성)
          Full width, responsive, item count aligned on the right
          ========================================================= */}
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
        }}
      >
        {/* Left: Interactive Category Navigation Bar (전체 / 여성) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {[
            { key: 'all', label: t('nav.all') },
            { key: 'women', label: t('nav.women') },
          ].map((item) => {
            const isSelected = selectedGender === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleGenderSwitch(item.key)}
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

        {/* Right: Item Count */}
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

      {/* =========================================================
          4. DIRECT PRODUCT GRID (Zero whitespace gap)
          Starts immediately below category navigation bar
          ========================================================= */}
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
            <p style={{ fontSize: '0.875rem', letterSpacing: '0.04em' }}>{t('home.loading')}</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#666666' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>{t('home.no_products')}</p>
            <p style={{ fontSize: '0.8125rem', color: '#888888', marginBottom: '20px' }}>
              {t('home.no_products_desc')}
            </p>
            <button
              type="button"
              onClick={() => handleGenderSwitch('all')}
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
          <div className="product-grid noeul-product-grid" style={{ margin: 0, padding: 0 }}>
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
