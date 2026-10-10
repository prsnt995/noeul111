import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  nextSku,
  normalizePrefix,
  suggestPrefix,
  validatePrefix,
  prefixErrorText,
} from '../src/utils/sku.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

describe('SKU system — generator', () => {
  it('formats TSH-00001 with zero-padded sequences', () => {
    expect(nextSku('TSH', 1)).toBe('TSH-00001');
    expect(nextSku('tsh', 42)).toBe('TSH-00042');
    expect(nextSku('JK', 99999)).toBe('JK-99999');
  });

  it('normalizes messy input and refuses to wrap past 99999', () => {
    expect(normalizePrefix(' tsh- ')).toBe('TSH');
    expect(() => nextSku('TSH', 0)).toThrow('SKU_SEQUENCE_EXHAUSTED');
    expect(() => nextSku('TSH', 100000)).toThrow('SKU_SEQUENCE_EXHAUSTED');
    expect(() => nextSku('!!!', 1)).toThrow('INVALID_PREFIX');
  });

  it('suggests prefixes from slugs', () => {
    expect(suggestPrefix('tshirts')).toBe('TSH');
    expect(suggestPrefix('outerwear')).toBe('OUT');
    expect(suggestPrefix('123')).toBe('');
  });

  it('validates format and collisions', () => {
    expect(validatePrefix('TSH', ['OUT', 'DRE'])).toEqual({ ok: true, prefix: 'TSH' });
    expect(validatePrefix('t', []).ok).toBe(false);
    // Overlong input normalizes to the first 6 chars (UI also caps at 6).
    expect(validatePrefix('TOOLONGPREFIX', [])).toEqual({ ok: true, prefix: 'TOOLON' });
    expect(validatePrefix('tsh', ['TSH']).code).toBe('PREFIX_EXISTS');
    expect(prefixErrorText('PREFIX_EXISTS', 'ko')).toMatch(/이미 사용 중/);
    expect(prefixErrorText('SKU_RETRY', 'en')).toMatch(/retry/i);
  });
});

describe('SKU system — storage contract', () => {
  it('migration adds prefix + sequence idempotently with a partial unique index', () => {
    const sql = read('supabase/migrations/202610080001_category_sku_prefix.sql');
    expect(sql.includes('sku_prefix'), 'prefix column').toBe(true);
    expect(sql.includes('sku_seq'), 'sequence column').toBe(true);
    expect(sql.includes('if not exists'), 'idempotent').toBe(true);
    expect(sql.includes('where sku_prefix is not null'), 'partial unique index').toBe(true);
  });
});

describe('SKU system — backend contract', () => {
  const admin = read('api/admin.js');

  it('category create/update accept, validate, and dedupe prefixes', () => {
    expect(admin.includes('INVALID_PREFIX'), 'format code').toBe(true);
    expect(admin.includes('PREFIX_EXISTS'), 'collision code').toBe(true);
    expect(admin.includes('categories_sku_prefix_idx'), 'constraint-aware mapping').toBe(true);
  });

  it('product create auto-assigns TSH-00001-style codes with conflict walk + retry code', () => {
    const start = admin.indexOf("app.post('/api/v1/admin/products'");
    const end = admin.indexOf("app.put('/api/v1/admin/products/:id'");
    const block = admin.slice(start, end);
    expect(block.includes('resolveCategoryPrefix'), 'prefix resolution').toBe(true);
    expect(block.includes('nextSku(prefix, seq)'), 'sequenced assignment').toBe(true);
    expect(block.includes('SKU_SEQUENCE_EXHAUSTED'), 'overflow guard').toBe(true);
    expect(block.includes("'SKU_RETRY'"), 'concurrency retry code').toBe(true);
    expect(block.includes('sku_seq: autoSeq'), 'sequence persisted').toBe(true);
  });

  it('typed SKUs keep the legacy path untouched', () => {
    const start = admin.indexOf("app.post('/api/v1/admin/products'");
    const block = admin.slice(start, admin.indexOf("app.put('/api/v1/admin/products/:id'"));
    expect(block.includes("'SKU_EXISTS'"), 'typed-duplicate code kept').toBe(true);
  });
});

describe('SKU system — frontend contract', () => {
  it('category form asks for the prefix and follows the slug until typed', () => {
    const src = read('src/pages/admin/AdminCategoriesPage.jsx');
    expect(src.includes('SKU 접두사'), 'prefix field').toBe(true);
    expect(src.includes('prefixDirty'), 'dirty tracking').toBe(true);
    expect(src.includes('suggestPrefix'), 'slug suggestion').toBe(true);
    expect(src.includes('SKU: {cat.sku_prefix'), 'list badge').toBe(true);
  });

  it('product form auto-suggests, regenerates, and defers to the server', () => {
    const src = read('src/pages/admin/AdminProductsPage.jsx');
    expect(src.includes('suggestSkuForCategory'), 'suggestion helper').toBe(true);
    expect(src.includes('setSkuDirty'), 'dirty tracking').toBe(true);
    expect(src.includes('다음 SKU:'), 'live preview').toBe(true);
    expect(src.includes("sku: skuDirty ? formData.sku : ''"), 'blank-unless-typed payload').toBe(true);
  });

  it('save error map covers the new auto-SKU codes', () => {
    const util = read('src/utils/product.js');
    for (const code of ['SKU_RETRY', 'SKU_SEQUENCE_EXHAUSTED']) {
      expect(util.includes(code), `mapped: ${code}`).toBe(true);
    }
  });
});

describe('SKU system — backfill safety', () => {
  it('backfill is dry-run by default, requires --apply, warns about backup', () => {
    const src = read('scripts/backfill-skus.mjs');
    expect(src.includes("process.argv.includes('--apply')"), 'explicit apply flag').toBe(true);
    expect(src.includes('DRY-RUN'), 'dry-run default messaging').toBe(true);
    expect(src.includes('backup.js'), 'backup reminder').toBe(true);
    expect(src.includes('--prefix-from-slug'), 'opt-in slug prefixes').toBe(true);
    expect(src.includes('audit_logs'), 'audit trail').toBe(true);
  });
});
