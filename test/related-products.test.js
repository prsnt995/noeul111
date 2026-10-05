import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreCandidate, rankRelated, averageRatings, effectivePrice } from '../api/related.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const base = {
  id: 1, category_id: 10, gender: 'women', price: 10000, discount_price: null,
  is_best: false, is_new: false, stock: 5, is_active: true, created_at: '2026-09-01T00:00:00Z',
};
const mk = (over) => ({ ...base, ...over });

describe('Related products — scoring', () => {
  it('weights category highest, then price affinity', () => {
    const current = mk({});
    expect(scoreCandidate(current, mk({ id: 2, category_id: 10 })) >= 3).toBe(true);
    expect(scoreCandidate(current, mk({ id: 3, category_id: 99, price: 10500 }))).toBeLessThan(
      scoreCandidate(current, mk({ id: 4, category_id: 10, price: 50000 }))
    );
  });

  it('rewards gender match, best sellers, new arrivals, and high ratings', () => {
    const current = mk({});
    const plain = scoreCandidate(current, mk({ id: 2, category_id: 99, gender: 'men', price: 50000 }));
    const boosted = scoreCandidate(
      current,
      mk({ id: 3, category_id: 99, gender: 'women', price: 50000, is_best: true, is_new: true }),
      4.5
    );
    expect(boosted).toBeGreaterThan(plain);
    expect(boosted).toBe(1 + 2 + 1 + 1); // gender + best + new + rating
  });

  it('price affinity uses sale price within ±30%', () => {
    const current = mk({ price: 10000 });
    expect(scoreCandidate(current, mk({ id: 2, price: 12000 }))).toBeGreaterThanOrEqual(2);
    expect(scoreCandidate(current, mk({ id: 3, price: 20000, category_id: 99, gender: 'men' }))).toBe(0);
  });

  it('effectivePrice prefers discount_price', () => {
    expect(effectivePrice(mk({ price: 10000, discount_price: 8000 }))).toBe(8000);
    expect(effectivePrice(mk({ price: 10000, discount_price: null }))).toBe(10000);
  });

  it('averageRatings aggregates per product', () => {
    expect(averageRatings([
      { product_id: 2, rating: 5 },
      { product_id: 2, rating: 3 },
      { product_id: 3, rating: 4 },
    ])).toEqual({ 2: 4, 3: 4 });
    expect(averageRatings([])).toEqual({});
  });
});

describe('Related products — ranking', () => {
  it('excludes self and inactive products', () => {
    const current = mk({ id: 1 });
    const out = rankRelated(current, [
      mk({ id: 1 }), mk({ id: 2, is_active: false }), mk({ id: 3 }),
    ], { limit: 4 });
    expect(out.map((p) => p.id)).toEqual([3]);
  });

  it('ranks in-stock before sold-out, then by score', () => {
    const current = mk({ id: 1, category_id: 10 });
    const out = rankRelated(current, [
      mk({ id: 2, category_id: 10, stock: 0 }),
      mk({ id: 3, category_id: 99, gender: 'men', price: 50000, stock: 5 }),
      mk({ id: 4, category_id: 10, stock: 2 }),
    ], { limit: 4 });
    // In-stock first (4 before 3 by score), sold-out last.
    expect(out.map((p) => p.id)).toEqual([4, 3, 2]);
  });

  it('fills thin pools from best sellers and respects the limit', () => {
    const current = mk({ id: 1, category_id: 10 });
    const pool = [
      mk({ id: 2, category_id: 10, stock: 1 }),
      mk({ id: 3, category_id: 99, is_best: true, stock: 4 }),
      mk({ id: 4, category_id: 99, stock: 4, created_at: '2026-09-20T00:00:00Z' }),
      mk({ id: 5, category_id: 99, stock: 4, created_at: '2026-09-10T00:00:00Z' }),
      mk({ id: 6, category_id: 99, stock: 4, created_at: '2026-09-12T00:00:00Z' }),
    ];
    const out = rankRelated(current, pool, { limit: 4 });
    expect(out).toHaveLength(4);
    expect(out[0].id).toBe(2); // same category wins
    expect(out[1].id).toBe(3); // best seller backfill next
  });

  it('applies rating averages by product id', () => {
    const current = mk({ id: 1, category_id: 99, gender: 'men', price: 50000 });
    const a = mk({ id: 2, category_id: 99, gender: 'men', price: 50000, stock: 3 });
    const b = mk({ id: 3, category_id: 99, gender: 'men', price: 50000, stock: 3 });
    const out = rankRelated(current, [a, b], { limit: 2, ratings: { 3: 5.0 } });
    expect(out[0].id).toBe(3);
  });
});

describe('Related products — wiring', () => {
  it('storefront detail uses scored ranking with backfill fallback', () => {
    const app = read('api/app.js');
    expect(app.includes("from './related.js'")).toBe(true);
    const idx = app.indexOf('/catalog/products/:id');
    const block = app.slice(idx, idx + 2600);
    expect(block.includes('rankRelated')).toBe(true);
    expect(block.includes('averageRatings')).toBe(true);
    expect(block.includes('is_best')).toBe(true);
    // Legacy same-category fallback survives ranking failures.
    expect(block.includes('limit(4)')).toBe(true);
  });

  it('legacy dev route shares the same ranking', () => {
    const routes = read('server/routes/products.js');
    expect(routes.includes('../../api/related.js')).toBe(true);
    expect(routes.includes('rankRelated')).toBe(true);
  });

  it('storefront grid and sold-out badge need no changes', () => {
    const page = read('src/pages/ProductDetailPage.jsx');
    expect(page.includes('YOU MAY ALSO LIKE')).toBe(true);
    const card = read('src/components/common/ProductCard.jsx');
    expect(card.includes('sold_out')).toBe(true);
  });
});
