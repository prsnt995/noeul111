import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';

const EMPTY = {
  mode: 'sparse',
  total: 0,
  maxRows: 0,
  best: [],
  new: [],
  categories: [],
  banners: {},
  header_config: {},
  site: {},
};

function modeFor(total) {
  if (total < 12) return 'sparse';
  if (total <= 30) return 'standard';
  return 'rich';
}

function rowsFor(mode) {
  if (mode === 'sparse') return 0;
  if (mode === 'standard') return 3;
  return 6;
}

function fill(list, pool, limit) {
  const out = [...list];
  if (out.length >= limit) return out.slice(0, limit);
  for (const p of pool) {
    if (out.length >= limit) break;
    if (!out.some((x) => x.id === p.id)) out.push(p);
  }
  return out.slice(0, limit);
}

/**
 * Storefront home aggregate with a graceful fallback.
 *
 * The dedicated `/storefront/home` endpoint returns the whole page model in
 * one round trip. If it is unavailable (older deploy, cold DB, network blip)
 * we compose the same shape from the public catalog endpoints so the home
 * page never renders empty.
 */
export function useStorefrontHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fallback() {
      const [catsRes, prodsRes] = await Promise.all([
        api.get('/catalog/categories'),
        api.get('/catalog/products?limit=200'),
      ]);
      const products = Array.isArray(prodsRes?.data) ? prodsRes.data : [];
      const total = Number(prodsRes?.total ?? products.length) || products.length;
      const mode = modeFor(total);
      const maxRows = rowsFor(mode);

      const rank = (p) => (Number.isFinite(Number(p.best_rank)) ? Number(p.best_rank) : 9999);
      const best = fill(
        products.filter((p) => p.is_best).sort((a, b) => rank(a) - rank(b)),
        products,
        8,
      );
      const fresh = fill(products.filter((p) => p.is_new), products, 8);

      const byCat = new Map();
      for (const p of products) {
        const slug = p.categories?.slug || p.category || '';
        if (!slug) continue;
        if (!byCat.has(slug)) byCat.set(slug, []);
        byCat.get(slug).push(p);
      }

      const categories = (Array.isArray(catsRes?.data) ? catsRes.data : [])
        .map((c) => ({
          slug: c.slug,
          name_ko: c.name_ko,
          name_en: c.name_en,
          image_url: c.image_url || '',
          description_ko: c.description_ko || '',
          gender: c.gender || 'unisex',
          count: (byCat.get(c.slug) || []).length,
          products: (byCat.get(c.slug) || []),
        }))
        .filter((c) => c.count > 0);

      return { ...EMPTY, mode, total, maxRows, best, new: fresh, categories };
    }

    async function load() {
      setLoading(true);
      try {
        const res = await api.get('/storefront/home');
        if (cancelled) return;
        if (res?.success && res.data) {
          setData(res.data);
          setError('');
        } else {
          throw new Error('STORE_FRONT_EMPTY');
        }
      } catch (err) {
        try {
          const composed = await fallback();
          if (cancelled) return;
          setData(composed);
          setError('');
        } catch (fallbackErr) {
          if (!cancelled) {
            setData(EMPTY);
            setError(fallbackErr?.message || err?.message || 'STORE_FRONT_UNAVAILABLE');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

export default useStorefrontHome;
