// Smart related-product scoring for "You May Also Like".
// Pure functions — no DB access, so they are directly unit-testable.
// Signals: same category (+3), same gender (+1), price within ±30% (+2),
// best seller (+2), new arrival (+1), approved-review average ≥ 4.0 (+1).
// In-stock candidates always rank before sold-out ones; callers backfill
// thin pools with best sellers and slice to the display limit.

export function effectivePrice(p) {
  if (!p) return 0;
  return Number(p.discount_price || p.price || 0);
}

export function scoreCandidate(current, candidate, avgRating = null) {
  if (!current || !candidate) return 0;
  let score = 0;
  if (candidate.category_id && current.category_id && candidate.category_id === current.category_id) {
    score += 3;
  }
  if (candidate.gender && current.gender && candidate.gender === current.gender) {
    score += 1;
  }
  const base = effectivePrice(current);
  const price = effectivePrice(candidate);
  if (base > 0 && price > 0 && Math.abs(price - base) / base <= 0.3) {
    score += 2;
  }
  if (candidate.is_best) score += 2;
  if (candidate.is_new) score += 1;
  if (avgRating !== null && avgRating !== undefined && Number(avgRating) >= 4) score += 1;
  return score;
}

export function averageRatings(reviews) {
  const agg = {};
  for (const r of reviews || []) {
    if (r.product_id === undefined || r.product_id === null) continue;
    const a = agg[r.product_id] || { sum: 0, n: 0 };
    a.sum += Number(r.rating || 0);
    a.n += 1;
    agg[r.product_id] = a;
  }
  const out = {};
  for (const [id, a] of Object.entries(agg)) {
    out[id] = a.n ? a.sum / a.n : null;
  }
  return out;
}

export function rankRelated(current, candidates, options = {}) {
  const limit = Number(options.limit || 4);
  const ratings = options.ratings || {};
  const pool = (candidates || []).filter(
    (p) => p && p.id !== current.id && p.is_active !== false
  );
  const scored = pool.map((p) => ({
    product: p,
    score: scoreCandidate(current, p, ratings[p.id] ?? null),
    inStock: Number(p.stock || 0) > 0,
    created: p.created_at || '',
  }));
  scored.sort((a, b) => {
    if (b.inStock !== a.inStock) return b.inStock - a.inStock;
    if (b.score !== a.score) return b.score - a.score;
    if (a.created === b.created) return 0;
    return a.created < b.created ? 1 : -1;
  });
  return scored.slice(0, Math.max(1, limit)).map((s) => s.product);
}
