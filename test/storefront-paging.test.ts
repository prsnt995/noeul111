import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Storefront paging: home + shop grids page through the catalog 24 at a
// time via the existing limit/offset/total contract (no backend change).
// Static analysis (no runtime imports) per repo test conventions.

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

const GRID_PAGES = [
  'src/pages/ShopPage.jsx',
];

describe('Storefront paging — load more', () => {
  it.each(GRID_PAGES)('%s sends a limit param and tracks the response total', (file) => {
    const src = read(file);
    expect(src.includes("params.append('limit'"), `${file} sends limit`).toBe(true);
    expect(src.includes('json.total'), `${file} reads total`).toBe(true);
    expect(src.includes('setTotal'), `${file} tracks total`).toBe(true);
  });

  it.each(GRID_PAGES)('%s renders infinite scroll sentinel and loading indicator', (file) => {
    const src = read(file);
    expect(src.includes('observerTarget') || src.includes('IntersectionObserver'), `${file} sentinel target`).toBe(true);
    expect(src.includes('loadingMore'), `${file} tracks loadingMore`).toBe(true);
  });

  it.each(GRID_PAGES)('%s restarts paging when filters change', (file) => {
    const src = read(file);
    expect(src.includes('setLimit(24)'), `${file} resets to first batch`).toBe(true);
  });

  it('load-more copy exists in ko locale', () => {
    for (const f of ['src/locales/ko.json']) {
      const json = JSON.parse(read(f));
      expect(json.shop.load_more, `${f} load_more`).toBeTruthy();
    }
  });

  it('home uses the storefront aggregate for BEST + category rows', () => {
    const src = read('src/pages/HomePage.jsx');
    expect(src.includes('useStorefrontHome'), 'aggregate hook').toBe(true);
    expect(src.includes('<BestSellersCarousel'), 'BEST rail').toBe(true);
    expect(src.includes('<CategoryRow'), 'category rows').toBe(true);
    expect(src.includes('<PromoBanner'), 'banner slots').toBe(true);
  });

  it('backend still honors limit/offset with a total for the grids', () => {    const app = read('api/app.js');
    const idx = app.indexOf("app.get('/api/v1/catalog/products'");
    expect(idx, 'catalog route').toBeGreaterThan(-1);
    const block = app.slice(idx, idx + 6000);
    expect(block.includes('req.query.limit'), 'limit param').toBe(true);
    expect(block.includes('req.query.offset'), 'offset param').toBe(true);
    expect(block.includes('total:'), 'total response').toBe(true);
  });
});
