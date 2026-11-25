import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { GenderSegmented } from '../components/common/GenderSegmented.jsx';
import { Dropdown } from '../components/common/Dropdown.jsx';
import { FilterChips } from '../components/common/FilterChips.jsx';
import { CATEGORIES_BY_GENDER } from '../data/products.js';
import { PromoBanner } from '../components/home/PromoBanner.jsx';
import { api } from '../utils/api.js';
import { SlidersHorizontal, X } from 'lucide-react';

const MEN_ALLOW = ['tshirts', 'shirts', 'jeans', 'pants', 'underwear', 'socks', 'jackets', 'hoodies', 'accessories', 'bags'];
const WOMEN_ALLOW = ['tshirts', 'shirts', 'jeans', 'pants', 'underwear', 'socks', 'dresses', 'skirts', 'jackets', 'hoodies', 'accessories', 'bags'];

/**
 * Shop — the utility surface.
 *
 * All catalog filtering/sorting lives here: gender, category, price range,
 * quick flags (new/best/sale), search and sort. The homepage stays curated.
 */
export function ShopPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedGender = searchParams.get('gender') || 'all';
  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const activeFilter = searchParams.get('filter') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [limit, setLimit] = useState(24);
  const [total, setTotal] = useState(0);
  const PAGE_BATCH = 24;
  const observerTarget = useRef(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [priceDraft, setPriceDraft] = useState({ min: minPrice, max: maxPrice });
  const [liveCategories, setLiveCategories] = useState([]);
  const [shopTopBanner, setShopTopBanner] = useState(null);

  // Keep the price inputs in sync when the URL is changed by nav/back.
  useEffect(() => {
    setPriceDraft({ min: minPrice, max: maxPrice });
  }, [minPrice, maxPrice]);

  // Any filter change restarts paging from the first batch.
  useEffect(() => {
    setProducts([]);
    setLimit(24);
  }, [selectedGender, selectedCategory, searchQuery, activeFilter, sortBy, minPrice, maxPrice]);

  // Live categories from the DB, with the hardcoded taxonomy as fallback.
  // Fetch the (optional) shop_top banner from the storefront aggregate.
  useEffect(() => {
    let cancelled = false;
    api.get('/storefront/home').then((res) => {
      if (!cancelled && res?.success && res.data?.banners?.shop_top) {
        setShopTopBanner(res.data.banners.shop_top);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get('/catalog/categories').then((res) => {
      if (!cancelled && res.success && Array.isArray(res.data) && res.data.length) {
        setLiveCategories(res.data.map((c) => ({
          key: (c.slug || '').toLowerCase(),
          label: c.name_en || c.slug,
          label_ko: c.name_ko || c.slug,
        })));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const availableCategories = useMemo(() => {
    if (liveCategories.length) {
      if (selectedGender === 'women') return liveCategories.filter((c) => WOMEN_ALLOW.includes(c.key));
      if (selectedGender === 'men') return liveCategories.filter((c) => MEN_ALLOW.includes(c.key));
      return liveCategories;
    }
    if (selectedGender === 'women') return CATEGORIES_BY_GENDER.women;
    if (selectedGender === 'men') return CATEGORIES_BY_GENDER.men;
    const seen = new Map();
    [...CATEGORIES_BY_GENDER.women, ...CATEGORIES_BY_GENDER.men].forEach((c) => {
      if (!seen.has(c.key)) seen.set(c.key, c);
    });
    return [...seen.values()];
  }, [selectedGender, liveCategories]);

  // Fetch the current page of products.
  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      if (limit === 24 || products.length === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const params = new URLSearchParams();
        if (selectedGender !== 'all') params.append('gender', selectedGender);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        if (activeFilter === 'new') params.append('is_new', 'true');
        if (activeFilter === 'best') params.append('is_best', 'true');
        if (activeFilter === 'sale') params.append('is_sale', 'true');
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        if (sortBy) params.append('sort', sortBy);
        params.append('limit', String(limit));

        const json = await api.get(`/catalog/products?${params.toString()}`);
        if (cancelled) return;
        if (json.success && Array.isArray(json.data)) {
          setProducts(json.data);
          setTotal(Number(json.total ?? json.data.length) || 0);
        } else {
          setProducts([]);
          setTotal(0);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    fetchProducts();
    return () => { cancelled = true; };
  }, [selectedGender, selectedCategory, searchQuery, activeFilter, sortBy, minPrice, maxPrice, limit]);

  // Infinite scroll: load the next batch when the sentinel approaches.
  useEffect(() => {
    if (loading || loadingMore) return undefined;
    if (products.length >= total || total === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLimit((prev) => prev + PAGE_BATCH);
        }
      },
      { root: null, rootMargin: '400px', threshold: 0 },
    );

    const el = observerTarget.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [loading, loadingMore, products.length, total]);

  // Mobile filter sheet: lock background scroll + Escape to close.
  useEffect(() => {
    if (!filterOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setFilterOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [filterOpen]);

  const updateUrl = (next = {}) => {
    setProducts([]);
    setLimit(24);
    const g = next.gender !== undefined ? next.gender : selectedGender;
    const c = next.category !== undefined ? next.category : selectedCategory;
    const f = next.filter !== undefined ? next.filter : activeFilter;
    const s = next.search !== undefined ? next.search : searchQuery;
    const sort = next.sort !== undefined ? next.sort : sortBy;
    const min = next.min !== undefined ? next.min : minPrice;
    const max = next.max !== undefined ? next.max : maxPrice;
    const params = new URLSearchParams();
    if (g && g !== 'all') params.set('gender', g);
    if (c && c !== 'all') params.set('category', c);
    if (f && f !== '') params.set('filter', f);
    if (s) params.set('search', s);
    if (sort && sort !== 'newest') params.set('sort', sort);
    if (min) params.set('min_price', min);
    if (max) params.set('max_price', max);
    setSearchParams(params);
  };

  const resetAll = () => {
    setProducts([]);
    setLimit(24);
    setPriceDraft({ min: '', max: '' });
    setSearchParams(new URLSearchParams());
  };

  const categoryObj = availableCategories.find((c) => c.key === selectedCategory);
  const categoryLabel = categoryObj ? (categoryObj.label_ko || categoryObj.label) : selectedCategory;
  const filterLabel = activeFilter === 'new'
    ? t('nav.new_arrivals')
    : activeFilter === 'best'
      ? t('nav.best_sellers')
      : activeFilter === 'sale'
        ? t('nav.sale')
        : '';

  const pageTitle = searchQuery
    ? `“${searchQuery}”`
    : filterLabel || (selectedCategory !== 'all' ? categoryLabel : t('shop.title'));
  const pageEyebrow = searchQuery
    ? 'Search'
    : selectedCategory !== 'all'
      ? 'Category'
      : filterLabel
        ? 'Collection'
        : 'Collection';
  const pageSubtitle = selectedGender === 'men'
    ? '노을의 남성 컬렉션'
    : selectedGender === 'women'
      ? '노을의 여성 컬렉션'
      : t('shop.subtitle');

  const activeCount = [
    selectedGender !== 'all',
    selectedCategory !== 'all',
    Boolean(activeFilter),
    Boolean(searchQuery),
    Boolean(minPrice),
    Boolean(maxPrice),
  ].filter(Boolean).length;

  const renderFilters = () => (
    <>
      <div className="shop-filter-group">
        <span className="shop-filter-label">성별</span>
        <GenderSegmented
          value={selectedGender}
          ariaLabel="성별 필터"
          options={[
            { key: 'all', label: t('nav.all') },
            { key: 'men', label: t('nav.men') },
            { key: 'women', label: t('nav.women') },
          ]}
          onChange={(g) => updateUrl({ gender: g, category: 'all' })}
        />
      </div>

      <div className="shop-filter-group">
        <div className="shop-sidebar__head" style={{ borderBottom: 0, paddingBottom: 0 }}>
          <span className="shop-filter-label">카테고리</span>
          <button type="button" className="shop-sidebar__reset" onClick={() => updateUrl({ category: 'all' })}>
            전체
          </button>
        </div>
        <div className="shop-filter-list">
          <button
            type="button"
            className={`shop-filter-item${selectedCategory === 'all' ? ' is-active' : ''}`}
            onClick={() => updateUrl({ category: 'all' })}
          >
            <span>{t('shop.all_categories')}</span>
          </button>
          {availableCategories.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`shop-filter-item${selectedCategory === c.key ? ' is-active' : ''}`}
              onClick={() => updateUrl({ category: c.key })}
            >
              <span>{c.label_ko || c.label}</span>
              <span className="shop-filter-item__count">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="shop-filter-group">
        <span className="shop-filter-label">가격대 (원)</span>
        <div className="shop-price-row">
          <input
            className="shop-price-input"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="최소"
            value={priceDraft.min}
            onChange={(e) => setPriceDraft((p) => ({ ...p, min: e.target.value }))}
            aria-label="최소 가격"
          />
          <span style={{ color: 'var(--muted)' }}>–</span>
          <input
            className="shop-price-input"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="최대"
            value={priceDraft.max}
            onChange={(e) => setPriceDraft((p) => ({ ...p, max: e.target.value }))}
            aria-label="최대 가격"
          />
        </div>
        <button
          type="button"
          className="shop-price-apply"
          onClick={() => updateUrl({ min: priceDraft.min, max: priceDraft.max })}
        >
          적용
        </button>
      </div>
    </>
  );

  const chips = [
    ...(selectedGender !== 'all' ? [{
      key: 'gender',
      label: selectedGender === 'men' ? t('nav.men') : t('nav.women'),
      onClear: () => updateUrl({ gender: 'all', category: 'all' }),
    }] : []),
    ...(selectedCategory !== 'all' ? [{
      key: 'category',
      label: categoryLabel,
      onClear: () => updateUrl({ category: 'all' }),
    }] : []),
    ...(activeFilter ? [{
      key: 'filter',
      label: filterLabel,
      onClear: () => updateUrl({ filter: '' }),
    }] : []),
    ...(minPrice || maxPrice ? [{
      key: 'price',
      label: `${minPrice || 0} – ${maxPrice || '∞'}원`,
      onClear: () => updateUrl({ min: '', max: '' }),
    }] : []),
    ...(searchQuery ? [{
      key: 'search',
      label: `“${searchQuery}”`,
      onClear: () => updateUrl({ search: '' }),
    }] : []),
  ];

  return (
    <div className="shop-page">
      {shopTopBanner ? <PromoBanner banner={shopTopBanner} /> : null}
      <header className="shop-hero">
        <span className="lux-eyebrow">{pageEyebrow}</span>
        <h1 className="shop-title">{pageTitle}</h1>
        <div className="shop-sub">
          <p>{pageSubtitle}</p>
          <span className="shop-sub__count" aria-live="polite">
            {loading ? '—' : `${total} ${t('home.items')}`}
          </span>
        </div>
      </header>

      <div className="shop-toolbar">
        <div className="shop-toolbar__inner">
          <button
            type="button"
            className="shop-filter-btn shop-filter-btn--mobile"
            onClick={() => setFilterOpen(true)}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal size={14} aria-hidden />
            필터
            {activeCount > 0 ? <span className="shop-filter-btn__badge">{activeCount}</span> : null}
          </button>

          <div className="shop-quick" role="tablist" aria-label="빠른 필터">
            {[
              { key: '', label: t('nav.all') },
              { key: 'new', label: t('nav.new_arrivals') },
              { key: 'best', label: t('nav.best_sellers') },
              { key: 'sale', label: t('nav.sale') },
            ].map((f) => (
              <button
                key={f.key || 'all'}
                type="button"
                role="tab"
                aria-selected={(activeFilter || '') === f.key}
                onClick={() => updateUrl({ filter: f.key })}
                className={`shop-quick__btn${(activeFilter || '') === f.key ? ' is-active' : ''}${f.key === 'sale' ? ' is-sale' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="shop-toolbar__spacer" />

          <span className="shop-toolbar__count" aria-live="polite">
            {loading ? '...' : `${products.length} / ${total}`}
          </span>

          <Dropdown
            value={sortBy}
            ariaLabel={t('shop.sort_by')}
            options={[
              { value: 'newest', label: t('shop.sort_newest') },
              { value: 'best', label: t('shop.sort_best') },
              { value: 'price_asc', label: t('shop.sort_price_low') },
              { value: 'price_desc', label: t('shop.sort_price_high') },
            ]}
            onChange={(v) => updateUrl({ sort: v })}
          />
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="lux-container" style={{ paddingTop: 14 }}>
          <FilterChips
            chips={chips}
            onResetAll={resetAll}
            resetLabel={t('shop.reset_filters')}
          />
        </div>
      ) : null}

      <div className="shop-layout">
        <aside className="shop-sidebar" aria-label="필터">
          <div className="shop-sidebar__head">
            <span className="shop-sidebar__title">Filters</span>
            {activeCount > 0 ? (
              <button type="button" className="shop-sidebar__reset" onClick={resetAll}>
                {t('shop.reset_filters')}
              </button>
            ) : null}
          </div>
          {renderFilters()}
        </aside>

        <main>
          {loading && products.length === 0 ? (
            <div className="shop-grid" aria-label={t('home.loading')} aria-busy="true">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
                <div key={k} aria-hidden="true">
                  <div className="lux-skeleton" style={{ aspectRatio: '3 / 4' }} />
                  <div className="lux-skeleton" style={{ height: 12, marginTop: 14, width: '70%' }} />
                  <div className="lux-skeleton" style={{ height: 10, marginTop: 8, width: '36%' }} />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="shop-grid">
              <div className="shop-grid__empty">
                <h3>{t('shop.no_products')}</h3>
                <p>{t('shop.no_products_desc')}</p>
                <div className="shop-suggest">
                  <button type="button" onClick={() => updateUrl({ category: 'all' })}>전체 카테고리</button>
                  <button type="button" onClick={() => updateUrl({ filter: '' })}>필터 해제</button>
                  {selectedGender !== 'all' ? (
                    <button type="button" onClick={() => updateUrl({ gender: 'all' })}>성별 전체</button>
                  ) : null}
                </div>
                <button type="button" className="lux-btn lux-btn--solid" onClick={resetAll}>
                  {t('home.view_all_products')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="shop-grid">
                {products.map((prod, i) => (
                  <ProductCard key={prod.id} product={prod} variant="classic" eager={i < 4} />
                ))}
              </div>

              {products.length < total ? (
                <>
                  <div ref={observerTarget} style={{ height: 1 }} aria-hidden="true" />
                  <div className="shop-loadmore">
                    <button
                      type="button"
                      className="lux-btn"
                      onClick={() => setLimit((prev) => prev + PAGE_BATCH)}
                      disabled={loadingMore}
                    >
                      {loadingMore ? '불러오는 중...' : t('shop.load_more')}
                    </button>
                  </div>
                </>
              ) : (
                <p className="shop-end">— End of Collection —</p>
              )}

              {loadingMore ? (
                <div className="shop-loading-row" aria-live="polite">
                  <span className="infinite-scroll-spinner" />
                  <span>{t('home.loading')}</span>
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>

      {filterOpen ? (
        <div className="shop-sheet-backdrop" onClick={() => setFilterOpen(false)}>
          <div
            className="shop-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="필터"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shop-sheet__head">
              <h2>Filters</h2>
              <button type="button" className="lux-icon-btn" onClick={() => setFilterOpen(false)} aria-label="필터 닫기">
                <X size={18} aria-hidden />
              </button>
            </div>
            <div className="shop-sheet__body">{renderFilters()}</div>
            <div className="shop-sheet__foot">
              <button type="button" className="lux-btn" onClick={() => { resetAll(); setFilterOpen(false); }}>
                {t('shop.reset_filters')}
              </button>
              <button type="button" className="lux-btn lux-btn--solid" onClick={() => setFilterOpen(false)}>
                적용
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ShopPage;
