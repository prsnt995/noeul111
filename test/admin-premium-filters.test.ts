import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Premium filters: custom dropdowns, chips, URL-persisted admin state.
// Static analysis (no runtime imports) per repo test conventions.

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

const ADMIN_LIST_PAGES = [
  'src/pages/admin/AdminOrdersPage.jsx',
  'src/pages/admin/AdminProductsPage.jsx',
  'src/pages/admin/AdminCustomersPage.jsx',
  'src/pages/admin/AdminReviewsPage.jsx',
  'src/pages/admin/AdminCouponsPage.jsx',
  'src/pages/admin/AdminCategoriesPage.jsx',
  'src/pages/admin/AdminMediaPage.jsx',
  'src/pages/admin/AdminAuditPage.jsx',
  'src/pages/admin/AdminPrivacyPage.jsx',
];

describe('Premium filters — shared primitives', () => {
  it('Dropdown implements the listbox keyboard contract', () => {
    const src = read('src/components/common/Dropdown.jsx');
    expect(src.includes('role="listbox"'), 'listbox role').toBe(true);
    expect(src.includes('role="option"'), 'option roles').toBe(true);
    expect(src.includes('aria-expanded'), 'expanded state').toBe(true);
    expect(src.includes('aria-selected'), 'selected state').toBe(true);
    for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape']) {
      expect(src.includes(`'${key}'`), `key ${key}`).toBe(true);
    }
    expect(src.includes('prefers-reduced-motion') || src.includes('fancy-select-pop'), 'animated popover').toBe(true);
  });

  it('FilterChips renders removable chips with reset and live count', () => {
    const src = read('src/components/common/FilterChips.jsx');
    expect(src.includes('onClear'), 'per-chip clear').toBe(true);
    expect(src.includes('onResetAll'), 'reset all').toBe(true);
    expect(src.includes('aria-live'), 'live region').toBe(true);
  });

  it('useListParams persists to URL, omits defaults, drops page on change', () => {
    const src = read('src/hooks/useListParams.js');
    expect(src.includes('useSearchParams'), 'wouter params').toBe(true);
    expect(src.includes('replace: true'), 'history replace').toBe(true);
    expect(src.includes("String(v) === '1'"), 'page=1 omitted').toBe(true);
    expect(src.includes('touchesFilter'), 'page reset on filter change').toBe(true);
  });

  it('premium CSS exists for pills, dropdown, and chips', () => {    const storefront = read('src/index.css');
    for (const cls of ['.pill-group', '.pill-indicator', '.fancy-select-pop', '.fancy-select-opt', '.filter-chip', '.edge-fade']) {
      expect(storefront.includes(cls), `index.css ${cls}`).toBe(true);
    }
    const admin = read('src/styles/admin.css');
    expect(admin.includes('.fancy-select-btn'), 'admin dropdown button').toBe(true);
    expect(admin.includes('.adm-filter-chips'), 'admin chips row').toBe(true);
  });
});

describe('Premium filters — storefront', () => {
  it('shop uses segmented control, custom sort, and chips (no native sort select)', () => {
    const src = read('src/pages/ShopPage.jsx');
    expect(src.includes('GenderSegmented'), 'segmented control').toBe(true);
    expect(src.includes('<Dropdown'), 'custom sort').toBe(true);
    expect(src.includes('<FilterChips'), 'chips row').toBe(true);
    expect(src.includes('<select'), 'no native select left').toBe(false);
  });

  it('home uses segmented control and per-filter chips', () => {
    const src = read('src/pages/HomePage.jsx');
    expect(src.includes('GenderSegmented'), 'segmented control').toBe(true);
    expect(src.includes('<FilterChips'), 'chips row').toBe(true);
    expect(src.includes('edge-fade'), 'edge fades').toBe(true);
  });

  it('category sidebar has edge fades', () => {
    expect(read('src/components/common/CategorySidebar.jsx').includes('edge-fade'), 'edge fade').toBe(true);
  });
});

describe('Premium filters — admin', () => {
  it('shared Filters renders custom dropdowns with labels and chips (no native select)', () => {
    const src = read('src/components/admin/ui/Filters.jsx');
    expect(src.includes('<Dropdown'), 'custom dropdown').toBe(true);
    expect(src.includes('FilterChips'), 'chips').toBe(true);
    expect(src.includes('<select'), 'no native select left').toBe(false);
    expect(src.includes('onReset'), 'reset wiring').toBe(true);
  });

  it.each(ADMIN_LIST_PAGES)('%s persists list state in the URL', (file) => {
    const src = read(file);
    expect(src.includes('useListParams'), `${file} hook`).toBe(true);
  });

  // Categories filters its full list client-side, so it has no page param.
  const SERVER_PAGED = ADMIN_LIST_PAGES.filter((f) => !f.includes('Categories'));
  it.each(SERVER_PAGED)('%s paginates via URL', (file) => {
    const src = read(file);
    expect(src.includes('listParams.set({ page:'), `${file} paginates via URL`).toBe(true);
  });

  it.each(ADMIN_LIST_PAGES)('%s labels every dropdown select', (file) => {
    const src = read(file);
    if (!src.includes('selects={')) return;
    const block = src.slice(src.indexOf('selects={'));
    const labels = (block.match(/label: '/g) || []).length;
    expect(labels, `${file} visible mini-labels`).toBeGreaterThan(0);
  });
});

describe('Premium filters — overlay stacking (no filter-over-modal overlap)', () => {
  it('dropdown closes when focus leaves it (keyboard-opened overlays)', () => {
    const src = read('src/components/common/Dropdown.jsx');
    expect(src.includes('focusin'), 'focus-loss close').toBe(true);
  });

  it('dropdown popover is portalled with viewport-fixed coords (never clipped, never over header)', () => {
    const src = read('src/components/common/Dropdown.jsx');
    expect(src.includes('createPortal'), 'body portal').toBe(true);
    expect(src.includes('getBoundingClientRect'), 'trigger measurement').toBe(true);
    expect(src.includes("'scroll', onScroll, true"), 'scroll-close listener').toBe(true);
    expect(src.includes('rect.bottom + 6'), 'opens downward only').toBe(true);
    expect(read('src/index.css').includes('.fancy-select-pop {\n  position: fixed;'), 'fixed CSS').toBe(true);
  });

  it('shop/home roots use overflow-x clip so sticky bars never ride over the header', () => {
    expect(read('src/pages/ShopPage.jsx').includes("overflowX: 'clip'"), 'shop clip').toBe(true);
    expect(read('src/pages/HomePage.jsx').includes("overflowX: 'clip'"), 'home clip').toBe(true);
  });

  it('admin overlays stack above filter popovers (120)', () => {
    const admin = read('src/styles/admin.css');
    const backdrop = admin.match(/\.adm-backdrop\s*\{[^}]*z-index:\s*(\d+)/);
    const modal = admin.match(/\.adm-modal\s*\{[^}]*z-index:\s*(\d+)/);
    const drawer = admin.match(/\.adm-drawer\s*\{[^}]*z-index:\s*(\d+)/);
    expect(Number(backdrop?.[1]), 'backdrop above popover').toBeGreaterThan(120);
    expect(Number(modal?.[1]), 'modal above popover').toBeGreaterThan(120);
    expect(Number(drawer?.[1]), 'drawer above popover').toBeGreaterThan(120);
  });
});
