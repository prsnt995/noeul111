import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// PR2 — Admin list pagination contract (static analysis: no runtime imports,
// so this file is immune to the workspace-path module-resolution issue).
// Contract: every admin list endpoint accepts modern `page`/`pageSize` plus
// legacy `limit`/`offset` aliases, honors `sort`/`order` allowlists, and
// returns `pagination: { page, pageSize, total, totalPages }` alongside
// legacy `count`/`total` fields.

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const admin = fs.readFileSync(path.join(root, 'api/admin.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/components/admin/ui/index.js'), 'utf8');

// Slice of api/admin.js for a single route registration: from the route's
// `app.METHOD('...'` marker to the next `app.METHOD('...'` at 2-space indent.
function endpointBlock(method: string, route: string) {
  const marker = `app.${method}('${route}'`;
  const idx = admin.indexOf(marker);
  expect(idx, marker).toBeGreaterThan(-1);
  const next = admin.indexOf('\n  app.', idx + marker.length);
  return admin.slice(idx, next === -1 ? undefined : next);
}

const LIST_ROUTES: [string, string][] = [
  ['get', '/api/v1/admin/products'],
  ['get', '/api/v1/admin/orders'],
  ['get', '/api/v1/admin/customers'],
  ['get', '/api/v1/admin/reviews'],
  ['get', '/api/v1/admin/coupons'],
  ['get', '/api/v1/admin/media'],
  ['get', '/api/v1/admin/content/banners'],
];

describe('PR2 — Admin list pagination contract', () => {
  it.each(LIST_ROUTES)('%s %s returns a pagination envelope', (method, route) => {
    const block = endpointBlock(method, route);
    expect(block.includes('pageEnvelope'), `${route} envelope`).toBe(true);
    expect(block.includes('parseListQuery'), `${route} parses page/pageSize`).toBe(true);
    expect(block.includes('page, pageSize'), `${route} echoes page params`).toBe(true);
  });

  it.each(LIST_ROUTES)('%s %s ranges the query (no unbounded fetch)', (method, route) => {
    const block = endpointBlock(method, route);
    const ranged = block.includes('.range(') || block.includes('.slice(offset');
    expect(ranged, `${route} range/slice`).toBe(true);
  });

  it('legacy limit/offset aliases are still honored by the parser', () => {
    expect(admin.includes('query.limit'), 'limit alias').toBe(true);
    expect(admin.includes('query.offset'), 'offset alias').toBe(true);
    // offset derives the page so old clients land on the right page
    expect(admin.includes('/ pageSize) + 1'), 'offset→page derivation').toBe(true);
  });

  it('pageSize is capped and page defaults are safe', () => {
    expect(admin.includes('maxPageSize'), 'cap').toBe(true);
    expect(admin.includes('totalPages'), 'totalPages').toBe(true);
  });

  it('sort keys are allowlisted per endpoint (no arbitrary column order)', () => {
    expect(admin.includes('pickSort('), 'pickSort helper').toBe(true);
    for (const [method, route] of LIST_ROUTES.slice(0, 5)) {
      const block = endpointBlock(method, route);
      expect(block.includes('pickSort'), `${route} allowlist`).toBe(true);
    }
  });

  it('products stock filter resolves variant aggregates before range (no post-page filtering)', () => {
    const block = endpointBlock('get', '/api/v1/admin/products');
    expect(block.includes('variantStockSums'), 'pre-range stock resolution').toBe(true);
    expect(block.includes('composed.filter'), 'post-page stock filter removed').toBe(false);
    // out-of-stock includes products with no variant rows (read as zero stock)
    expect(block.includes('?? 0) <= 0'), 'variant-less products count as out-of-stock').toBe(true);
  });

  it('products supports new/best/sale filters server-side (no client-side accumulation)', () => {
    const block = endpointBlock('get', '/api/v1/admin/products');
    expect(block.includes("filterType === 'new'"), 'new filter').toBe(true);
    expect(block.includes("filterType === 'best'"), 'best filter').toBe(true);
    expect(block.includes("filterType === 'sale'"), 'sale filter').toBe(true);
  });

  it('reviews supports status + search filters alongside pagination', () => {
    const block = endpointBlock('get', '/api/v1/admin/reviews');
    expect(block.includes("status === 'approved'"), 'approved filter').toBe(true);
    expect(block.includes("status === 'pending'"), 'pending filter').toBe(true);
    expect(block.includes("ilike('comment'"), 'comment search').toBe(true);
  });

  it('dashboard recentOrders honors a bounded recent param (default 8)', () => {
    const block = endpointBlock('get', '/api/v1/admin/dashboard/stats');
    expect(block.includes('recentLimit'), 'recent param').toBe(true);
    expect(block.includes('Number(req.query.recent) || 8'), 'default 8').toBe(true);
    expect(block.includes('slice(0, recentLimit)'), 'bounded slice').toBe(true);
    expect(block.includes('slice(0, 8)'), 'no hardcoded slice left').toBe(false);
  });

  it('frontend list helper sends both modern + legacy params and reads pagination.total', () => {
    expect(ui.includes("sp.set('page'"), 'page param').toBe(true);
    expect(ui.includes("sp.set('pageSize'"), 'pageSize param').toBe(true);
    expect(ui.includes("sp.set('limit'"), 'legacy limit alias').toBe(true);
    expect(ui.includes("sp.set('offset'"), 'legacy offset alias').toBe(true);
    expect(ui.includes('json?.pagination'), 'reads pagination envelope').toBe(true);
    expect(ui.includes('json?.total'), 'legacy total fallback').toBe(true);
    expect(ui.includes('json?.count'), 'legacy count fallback').toBe(true);
  });
});
