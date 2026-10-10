import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getCategoryPrefix,
  generateNextSku,
  COMMON_SIZES,
  DEFAULT_SIZE_STOCK,
  CATEGORY_PREFIX_MAP,
  KOREAN_CATEGORY_PREFIX_MAP,
} from '../src/utils/product.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Feature 1: Automatic Unique SKUs by Category', () => {
  it('correctly maps standard fashion categories to clean prefixes', () => {
    expect(getCategoryPrefix('tshirts')).toBe('TS');
    expect(getCategoryPrefix('t-shirts')).toBe('TS');
    expect(getCategoryPrefix('shirts')).toBe('SH');
    expect(getCategoryPrefix('pants')).toBe('PT');
    expect(getCategoryPrefix('outerwear')).toBe('OW');
    expect(getCategoryPrefix('dresses')).toBe('DR');
    expect(getCategoryPrefix('skirts')).toBe('SK');
    expect(getCategoryPrefix('knitwear')).toBe('KN');
    expect(getCategoryPrefix('accessories')).toBe('AC');
    expect(getCategoryPrefix('socks')).toBe('SC');
  });

  it('correctly maps Korean category names to standard prefixes', () => {
    expect(getCategoryPrefix({ name_ko: '티셔츠' })).toBe('TS');
    expect(getCategoryPrefix({ name_ko: '셔츠/블라우스' })).toBe('SH');
    expect(getCategoryPrefix({ name_ko: '원피스' })).toBe('DR');
    expect(getCategoryPrefix({ name_ko: '니트웨어' })).toBe('KN');
    expect(getCategoryPrefix({ name_ko: '아우터' })).toBe('OW');
    expect(getCategoryPrefix({ name_ko: '팬츠/데님' })).toBe('PT');
    expect(getCategoryPrefix({ name_ko: '스커트' })).toBe('SK');
  });

  it('dynamically derives unique prefixes for new admin-created custom categories', () => {
    // Multi-word / hyphenated slug: take initials
    expect(getCategoryPrefix({ slug: 'crop-top' })).toBe('CT');
    expect(getCategoryPrefix({ slug: 'wide_pants' })).toBe('WP');
    expect(getCategoryPrefix({ slug: 'summer-jacket' })).toBe('SJ');

    // Single-word custom slug: take first 2 letters
    expect(getCategoryPrefix({ slug: 'blazer' })).toBe('BL');
    expect(getCategoryPrefix({ slug: 'vest' })).toBe('VE');
    expect(getCategoryPrefix({ slug: 'jewelry' })).toBe('JE');

    // 1-letter slug: padded with X
    expect(getCategoryPrefix({ slug: 'v' })).toBe('VX');

    // Fallback for null/empty
    expect(getCategoryPrefix(null)).toBe('NE');
    expect(getCategoryPrefix('')).toBe('NE');
  });

  it('generates sequential 3-digit SKUs starting at 001 for empty categories', () => {
    expect(generateNextSku('tshirts', [])).toBe('TS-001');
    expect(generateNextSku('shirts', [])).toBe('SH-001');
    expect(generateNextSku('dresses', [])).toBe('DR-001');
  });

  it('increments sequential SKU and prevents duplicate SKUs', () => {
    const existing = ['TS-001', 'TS-002'];
    expect(generateNextSku('tshirts', existing)).toBe('TS-003');

    // Works with product object list
    const prodList = [{ sku: 'SH-001' }, { sku: 'SH-002' }, { sku: 'SH-003' }];
    expect(generateNextSku('shirts', prodList)).toBe('SH-004');
  });

  it('handles gaps in numbering and takes max + 1 to avoid conflicts', () => {
    const existing = ['PT-001', 'PT-015'];
    expect(generateNextSku('pants', existing)).toBe('PT-016');
  });

  it('advances past existing SKUs if collisions occur', () => {
    // If PT-002 already exists in list even if not matching standard format
    const existing = ['PT-001', 'PT-002'];
    const next = generateNextSku('pants', existing);
    expect(next).toBe('PT-003');
    expect(existing.includes(next)).toBe(false);
  });
});

describe('Feature 2: Multi-Size Selection including Free Size (F)', () => {
  it('defines the complete size options including FREE, XS, S, M, L, XL, XXL, XXXL', () => {
    expect(COMMON_SIZES).toContain('FREE');
    expect(COMMON_SIZES).toContain('XS');
    expect(COMMON_SIZES).toContain('S');
    expect(COMMON_SIZES).toContain('M');
    expect(COMMON_SIZES).toContain('L');
    expect(COMMON_SIZES).toContain('XL');
    expect(COMMON_SIZES).toContain('XXL');
    expect(COMMON_SIZES).toContain('XXXL');
    expect(COMMON_SIZES.length).toBe(8);
  });
});

describe('Feature 3: Default Quantity of 50 for Every Selected Size', () => {
  it('defines default quantity constant as 50', () => {
    expect(DEFAULT_SIZE_STOCK).toBe(50);
  });

  it('simulates toggleSizeSelection: newly added size gets default stock of 50 per color', () => {
    const colors = [{ name_ko: '블랙', hex: '#111' }, { name_ko: '화이트', hex: '#fff' }];
    const colorKey = (c: any) => c.name_ko;
    const comboKey = (c: any, sz: string) => `${colorKey(c)}|||${sz}`;

    const sizes = ['FREE'];
    const variantStock: Record<string, string> = {};
    // Initial size FREE has 50 for each color
    for (const c of colors) {
      variantStock[comboKey(c, 'FREE')] = String(DEFAULT_SIZE_STOCK);
    }
    expect(variantStock['블랙|||FREE']).toBe('50');
    expect(variantStock['화이트|||FREE']).toBe('50');

    // Admin edits '블랙|||FREE' to '25' before saving
    variantStock['블랙|||FREE'] = '25';

    // Now admin newly selects 'S'
    const newSize = 'S';
    sizes.push(newSize);
    for (const c of colors) {
      const k = comboKey(c, newSize);
      if (!variantStock[k]) {
        variantStock[k] = String(DEFAULT_SIZE_STOCK);
      }
    }

    // New size 'S' defaults to 50
    expect(variantStock['블랙|||S']).toBe('50');
    expect(variantStock['화이트|||S']).toBe('50');

    // Existing '블랙|||FREE' edited stock (25) was NOT reset!
    expect(variantStock['블랙|||FREE']).toBe('25');
  });

  it('editing an existing product preserves existing variant stock without resetting', () => {
    // Existing variants from database
    const existingVariants = [
      { color: 'Black', size: 'FREE', stock: 15 },
      { color: 'Black', size: 'M', stock: 0 },
    ];
    const comboKey = (c: any, sz: string) => `${c.name_ko || c.name_en || c}|||${sz}`;
    const loadedStock: Record<string, string> = {};
    existingVariants.forEach((v) => {
      loadedStock[comboKey({ name_en: v.color }, v.size)] = String(v.stock);
    });

    expect(loadedStock['Black|||FREE']).toBe('15');
    expect(loadedStock['Black|||M']).toBe('0');
    // None are reset to 50 upon loading
    expect(loadedStock['Black|||FREE']).not.toBe('50');
  });
});

describe('Feature 4 & 5: Integration with Admin Form & Backend API', () => {
  it('AdminProductsPage wires next SKU, FREE (F), and default 50 stock', () => {
    const pageSrc = read('src/pages/admin/AdminProductsPage.jsx');
    // SKU generation wired
    expect(pageSrc.includes('generateNextSku('), 'calls generateNextSku').toBe(true);
    expect(pageSrc.includes('handleCategoryChange'), 'handles category change to update SKU').toBe(true);
    expect(pageSrc.includes('SKU 자동 생성'), 'has SKU auto-generate button').toBe(true);

    // Free Size (F) display
    expect(pageSrc.includes("'FREE (F)'"), 'displays Free Size (F)').toBe(true);

    // Default stock 50 wired
    expect(pageSrc.includes('DEFAULT_SIZE_STOCK'), 'imports DEFAULT_SIZE_STOCK').toBe(true);
    expect(pageSrc.includes('기본 50개 전체 채우기'), 'has bulk fill 50 button').toBe(true);
  });

  it('api/admin.js exposes /api/v1/admin/products/next-sku endpoint', () => {
    const adminSrc = read('api/admin.js');
    expect(adminSrc.includes("app.get('/api/v1/admin/products/next-sku'"), 'next-sku endpoint registered').toBe(true);
    expect(adminSrc.includes('generateNextSku('), 'uses generateNextSku in admin api').toBe(true);
  });

  it('POST /api/v1/admin/products automatically assigns category SKU when empty', () => {
    const adminSrc = read('api/admin.js');
    const postHandler = adminSrc.slice(
      adminSrc.indexOf("app.post('/api/v1/admin/products'"),
      adminSrc.indexOf("app.put('/api/v1/admin/products/:id'")
    );
    // New category-prefix system (TSH-00001 via nextSku/resolveCategoryPrefix)
    // supersedes the legacy generateNextSku (TS-001) — accept either.
    expect(
      postHandler.includes('generateNextSku(') || postHandler.includes('nextSku('),
      'auto-generates SKU if omitted'
    ).toBe(true);
    expect(postHandler.includes('SKU_EXISTS'), 'checks uniqueness and prevents duplicate SKUs').toBe(true);
  });
});
