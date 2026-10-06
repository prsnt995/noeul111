import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProductForm, productErrorText } from '../src/utils/product.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

const GOOD_FORM = { name_ko: '노을 니트', category_id: 3, price: '89000', discount_price: '' };

describe('Product save — pre-flight validation', () => {
  it('accepts a valid form (string prices from inputs included)', () => {
    expect(validateProductForm(GOOD_FORM)).toEqual({ ok: true });
    expect(validateProductForm({ ...GOOD_FORM, price: 89000, discount_price: 79000 })).toEqual({ ok: true });
  });

  it('rejects missing name/category/price', () => {
    expect(validateProductForm({ ...GOOD_FORM, name_ko: '  ' }).code).toBe('NAME_CATEGORY_PRICE_REQUIRED');
    expect(validateProductForm({ ...GOOD_FORM, category_id: '' }).code).toBe('NAME_CATEGORY_PRICE_REQUIRED');
    expect(validateProductForm({ ...GOOD_FORM, price: '' }).code).toBe('NAME_CATEGORY_PRICE_REQUIRED');
  });

  it('rejects zero/negative/decimal prices before any network call', () => {
    for (const price of ['0', 0, -100, '12.5', 'abc']) {
      expect(validateProductForm({ ...GOOD_FORM, price }).code, String(price)).toBe('INVALID_PRICE');
    }
  });

  it('rejects discounts that are empty-safe but invalid when present', () => {
    expect(validateProductForm({ ...GOOD_FORM, discount_price: '' })).toEqual({ ok: true });
    expect(validateProductForm({ ...GOOD_FORM, discount_price: null })).toEqual({ ok: true });
    for (const d of ['0', 0, -5, '12.5', 89000, 99999]) {
      expect(validateProductForm({ ...GOOD_FORM, discount_price: d }).code, String(d)).toBe('INVALID_DISCOUNT');
    }
  });
});

describe('Product save — bilingual error map', () => {
  it('names the SKU retry trap and the check-the-list rescue in both languages', () => {
    expect(productErrorText('SKU_EXISTS', 'ko')).toMatch(/이미 존재하는 SKU/);
    expect(productErrorText('SKU_EXISTS', 'en')).toMatch(/already exists/);
    expect(productErrorText('VARIANT_FAILED', 'ko')).toMatch(/목록/);
    expect(productErrorText('MEDIA_FAILED', 'ko')).toMatch(/수정/);
  });

  it('falls back to a generic message that keeps the raw code for diagnosis', () => {
    expect(productErrorText('SOME_FUTURE_CODE', 'ko')).toMatch(/SOME_FUTURE_CODE/);
    expect(productErrorText('', 'ko')).toMatch(/등록에 실패/);
  });
});

describe('Product save — blocking loader (no clicks elsewhere, no double submit)', () => {
  it('BusyProvider renders a fullscreen pointer-blocking overlay above content', () => {
    const src = read('src/context/BusyContext.jsx');
    expect(src.includes('role="alertdialog"'), 'announced to AT').toBe(true);
    expect(src.includes('inset: 0') || src.includes('inset:0'), 'fullscreen').toBe(true);
    const m = src.match(/zIndex:\s*(\d+)/);
    expect(Number(m?.[1]), 'overlay z-index').toBeGreaterThan(1000);
    expect(src.includes("cursor: 'wait'"), 'wait cursor').toBe(true);
    expect(src.includes('busySpin'), 'self-contained spinner').toBe(true);
  });

  it('runBusy is re-entrant and always clears', () => {
    const src = read('src/context/BusyContext.jsx');
    expect(src.includes('setDepth'), 'counter-based').toBe(true);
    expect(src.includes('finally'), 'clears on error too').toBe(true);
  });

  it('App mounts the provider around all routes', () => {
    const src = read('src/App.jsx');
    expect(src.includes('BusyProvider'), 'provider wired').toBe(true);
    expect(src.indexOf('<BusyProvider>') < src.indexOf('<AppContent'), 'wraps content').toBe(true);
  });

  it('product save runs fenced and disables its buttons while saving', () => {
    const src = read('src/pages/admin/AdminProductsPage.jsx');
    expect(src.includes('runBusy('), 'save fenced').toBe(true);
    expect(src.includes('disabled={saving}'), 'buttons disabled').toBe(true);
    expect(src.includes('저장 중...'), 'saving label').toBe(true);
  });
});

describe('Product save — backend/frontend contract', () => {
  // Slice of api/admin.js covering only the POST /admin/products handler.
  const admin = read('api/admin.js');
  const start = admin.indexOf("app.post('/api/v1/admin/products'");
  const end = admin.indexOf("app.put('/api/v1/admin/products/:id'");
  const block = admin.slice(start, end);
  expect(start).toBeGreaterThan(-1);

  it('pre-checks duplicate SKU before inserting (breaks the retry loop)', () => {
    const skuCheck = block.indexOf('SKU_EXISTS');
    const insert = block.indexOf('.insert({');
    expect(skuCheck, 'pre-check exists').toBeGreaterThan(-1);
    expect(insert, 'insert exists').toBeGreaterThan(-1);
    expect(skuCheck, 'pre-check runs before insert').toBeLessThan(insert);
  });

  it('reports each failure stage distinctly instead of one blanket 503', () => {
    for (const code of ['SKU_EXISTS', 'CATEGORY_INVALID', 'VARIANT_FAILED', 'MEDIA_FAILED', 'PRODUCT_CREATE_FAILED', 'SCHEMA_MISMATCH', 'DB_PERMISSION']) {
      expect(block.includes(`'${code}'`), code).toBe(true);
    }
  });

  it('detects live-DB drift (undefined column) and denied writes (RLS) by code', () => {
    expect(block.includes('42703'), 'postgres undefined_column').toBe(true);
    expect(block.includes('42501'), 'postgres insufficient_privilege').toBe(true);
  });

  it('detects PostgREST-shaped drift and denial (schema cache, JWT/RLS wording)', () => {
    expect(block.includes('PGRST204'), 'postgrest missing-column code').toBe(true);
    expect(block.includes('schema cache'), 'postgrest schema-cache wording').toBe(true);
    expect(block.includes('could not find the'), 'postgrest column wording').toBe(true);
    expect(block.includes('DB_PERMISSION'), 'denial code present').toBe(true);
  });

  it('frontend pre-flights and maps every backend code the route can emit', () => {
    const page = read('src/pages/admin/AdminProductsPage.jsx');
    expect(page.includes('validateProductForm(formData)'), 'pre-flight call').toBe(true);
    expect(page.includes('productErrorText('), 'mapped toasts').toBe(true);
    const util = read('src/utils/product.js');
    for (const code of ['NAME_CATEGORY_PRICE_REQUIRED', 'INVALID_PRICE', 'INVALID_DISCOUNT', 'SKU_EXISTS', 'CATEGORY_INVALID', 'VARIANT_FAILED', 'MEDIA_FAILED', 'PRODUCT_CREATE_FAILED', 'SCHEMA_MISMATCH', 'DB_PERMISSION']) {
      expect(util.includes(code), `mapped: ${code}`).toBe(true);
    }
  });

  it('self-diagnosis endpoint probes the migrated columns and names the files', () => {
    const admin = read('api/admin.js');
    const marker = "app.get('/api/v1/admin/health/schema'";
    const idx = admin.indexOf(marker);
    expect(idx, 'health route').toBeGreaterThan(-1);
    const next = admin.indexOf('\n  app.', idx + marker.length);
    const route = admin.slice(idx, next === -1 ? undefined : next);
    for (const col of ['material_ko', 'best_rank', 'detail_blocks']) {
      expect(route.includes(col), `probes ${col}`).toBe(true);
    }
    expect(route.includes('202610050001_product_detail_blocks.sql'), 'names migration').toBe(true);
    expect(route.includes('missingMigrations'), 'reports files').toBe(true);
  });

  it('products page auto-diagnoses environment failures into a banner', () => {
    const page = read('src/pages/admin/AdminProductsPage.jsx');
    expect(page.includes("adminApi.get('/admin/health/schema')"), 'health call').toBe(true);
    expect(page.includes('setSchemaIssue'), 'diagnosis state').toBe(true);
    expect(page.includes('missingMigrations'), 'banner names files').toBe(true);
  });
});
