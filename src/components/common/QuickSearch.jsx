import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../utils/api.js';
import { Search, X, TrendingUp, ArrowRight } from 'lucide-react';
import { useDialogFocus } from '../../utils/dialogFocus.js';

export function QuickSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { lang, t, formatKRW } = useLanguage();
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const [, setLocation] = useLocation();
  useDialogFocus(isOpen, dialogRef);

  const goToResults = (e) => {
    e?.preventDefault?.();
    const q = query.trim();
    if (!q) return;
    onClose?.();
    setLocation(`/shop?search=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get(`/catalog/products?search=${encodeURIComponent(query.trim())}&limit=6`);
        if (cancelled) return;
        if (data.success) {
          setResults(data.data);
          setTotal(Number(data.total) || data.data.length);
        }
      } catch (err) {
        console.error('Quick search error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const popularTags = [
    { ko: '울 블레이저', en: 'Wool Blazer' },
    { ko: '박시 티셔츠', en: 'Boxy Tee' },
    { ko: '와이드 데님', en: 'Wide Denim' },
    { ko: '모헤어 가디건', en: 'Mohair Cardigan' },
    { ko: '트렌치 코트', en: 'Trench Coat' },
    { ko: '레더 백', en: 'Leather Bag' },
  ];

  return (
    <div className="backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.search')}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          margin: '60px auto 0',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          animation: 'slideUp 0.2s ease forwards',
        }}
      >
        {/* Search Input Bar — submit goes to full results on /shop */}
        <form
          onSubmit={goToResults}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light)',
            gap: '12px',
          }}
        >
          <Search size={22} color="var(--text-muted)" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('shop.search_placeholder')}
            aria-label={t('nav.search')}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1.125rem',
              backgroundColor: 'transparent',
            }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('shop.clear')} style={{ color: 'var(--text-muted)' }}>
              <X size={18} aria-hidden />
            </button>
          )}
          <button type="button" onClick={onClose} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '8px' }}>
            {t('nav.close')}
          </button>
        </form>

        {/* Popular Tags */}
        {!query && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <TrendingUp size={14} color="var(--accent-sunset)" />
              <span>{t('shop.trending')}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {popularTags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(lang === 'ko' ? tag.ko : tag.en)}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e5de')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                >
                  #{lang === 'ko' ? tag.ko : tag.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {query && (
          <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '16px 24px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                {t('shop.loading')}
              </div>
            ) : results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {t('shop.no_products')}
                </p>
                <p style={{ fontSize: '0.875rem' }}>{t('shop.no_products_desc')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug || product.id}`}
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '10px',
                      borderRadius: '8px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <img
                      src={product.images?.[0] || ''}
                      alt={product.name_ko}
                      style={{ width: '56px', height: '68px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {lang === 'ko' ? product.category_name_ko : product.category_name_en}
                      </span>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '2px 0' }}>
                        {lang === 'ko' ? product.name_ko : product.name_en}
                      </h4>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--accent-sunset)' }}>
                          {formatKRW(product.discount_price || product.price)}
                        </span>
                        {product.discount_price && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {formatKRW(product.price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Full results on /shop */}
        {query.trim() && !loading && results.length > 0 && (
          <button
            type="button"
            onClick={goToResults}
            style={{
              width: '100%',
              padding: '14px',
              borderTop: '1px solid var(--border-light)',
              backgroundColor: '#18181b',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>{t('shop.view_all_results', { count: total })}</span>
            <ArrowRight size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
