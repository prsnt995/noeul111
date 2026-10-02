import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ORDER_SOURCES,
  normalizeOrderSource,
  isValidOrderSource,
  sourceLabel,
  buildSalesBySource,
  salesBySourceToCsv,
} from '../api/orderSources.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Manual / external orders — channel helpers', () => {
  it('supports website + instagram + tiktok + other', () => {
    expect(ORDER_SOURCES).toEqual(['website', 'instagram', 'tiktok', 'other']);
    expect(normalizeOrderSource('Instagram')).toBe('instagram');
    expect(normalizeOrderSource('TIKTOK')).toBe('tiktok');
    expect(normalizeOrderSource('bogus')).toBe('website');
    expect(normalizeOrderSource('whatsapp')).toBe('website');
    expect(isValidOrderSource('tiktok')).toBe(true);
    expect(isValidOrderSource('phone')).toBe(false);
    expect(isValidOrderSource('whatsapp')).toBe(false);
  });

  it('labels are bilingual KR/EN', () => {
    expect(sourceLabel('instagram', 'ko')).toBe('인스타그램');
    expect(sourceLabel('instagram', 'en')).toBe('Instagram');
    expect(sourceLabel('tiktok', 'ko')).toBe('틱톡');
    expect(sourceLabel('tiktok', 'en')).toBe('TikTok');
  });

  it('aggregates revenue only for paid statuses, unpaid tracked separately', () => {
    const rows = buildSalesBySource([
      { order_source: 'instagram', status: 'paid', amount: 50000 },
      { order_source: 'instagram', status: 'pending_payment', amount: 30000 },
      { order_source: 'website', status: 'delivered', amount: 20000 },
      { order_source: 'tiktok', status: 'canceled', amount: 10000 },
      { order_source: undefined, status: 'paid', amount: 7000 },
    ]);
    const ig = rows.find((r) => r.source === 'instagram');
    expect(ig.order_count).toBe(2);
    expect(ig.paid_count).toBe(1);
    expect(ig.unpaid_count).toBe(1);
    expect(ig.revenue_paid).toBe(50000);
    const web = rows.find((r) => r.source === 'website');
    // undefined source defaults to website: 1 delivered + 1 paid
    expect(web.order_count).toBe(2);
    expect(web.revenue_paid).toBe(27000);
  });

  it('CSV has header + one row per source', () => {
    const rows = buildSalesBySource([{ order_source: 'tiktok', status: 'paid', amount: 1000 }]);
    const csv = salesBySourceToCsv(rows);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('source,order_count,paid_count,unpaid_count,revenue_paid,refunded_amount');
    expect(lines).toHaveLength(5);
    expect(csv).toContain('tiktok,1,1,0,1000,0');
  });
});

describe('Manual / external orders — backend wiring', () => {
  it('Supabase admin surface has manual create + reports + source filter', () => {
    const admin = read('api/admin.js');
    expect(admin.includes("post('/api/v1/admin/orders/manual'")).toBe(true);
    expect(admin.includes("get('/api/v1/admin/reports/sales'")).toBe(true);
    expect(admin.includes('order_source')).toBe(true);
    // Manual orders start unpaid (bank-transfer verify flow), never paid.
    const manualIdx = admin.indexOf("orders/manual");
    const manualBlock = admin.slice(manualIdx, manualIdx + 6000);
    expect(manualBlock.includes("status: 'pending_payment'")).toBe(true);
    expect(manualBlock.includes("status: 'paid'")).toBe(false);
    // Stock is reserved with compensation, like the storefront fallback.
    expect(manualBlock.includes('reserved')).toBe(true);
    expect(manualBlock.includes('INSUFFICIENT_STOCK')).toBe(true);
  });

  it('Supabase migration adds order_source with check constraint', () => {
    const sql = read('supabase/migrations/202610020001_order_source.sql');
    expect(sql.includes('order_source')).toBe(true);
    expect(sql.includes('instagram')).toBe(true);
  });

  it('Supabase TikTok migration swaps whatsapp/phone for tiktok', () => {
    const sql = read('supabase/migrations/202610040001_order_source_tiktok.sql');
    expect(sql.includes('tiktok')).toBe(true);
    expect(sql.includes('orders_order_source_check')).toBe(true);
  });

  it('coupon pre-check endpoint exists and shares manual-create rules', () => {
    const admin = read('api/admin.js');
    expect(admin.includes("get('/api/v1/admin/coupons/validate'")).toBe(true);
    const idx = admin.indexOf('coupons/validate');
    const block = admin.slice(idx, idx + 1500);
    expect(block.includes('COUPON_MINIMUM_NOT_MET')).toBe(true);
    expect(block.includes('COUPON_LIMIT_REACHED')).toBe(true);
  });

  it('admin products expose per-variant stock for the picker', () => {
    const admin = read('api/admin.js');
    expect(admin.includes('reserved: v.reserved')).toBe(true);
  });

  it('legacy SQLite backend mirrors manual + reports + source filter', () => {
    const orders = read('server/routes/admin/orders.js');
    expect(orders.includes("post('/orders/manual'")).toBe(true);
    expect(orders.includes("get('/reports/sales'")).toBe(true);
    expect(orders.includes('order_source')).toBe(true);
    expect(orders.includes('UPDATE products SET stock = stock -')).toBe(true);
    const coupons = read('server/routes/admin/coupons.js');
    expect(coupons.includes("get('/coupons/validate'")).toBe(true);
    const db = read('server/db/database.js');
    expect(db.includes('order_source')).toBe(true);
    const dash = read('server/routes/admin/dashboard.js');
    expect(dash.includes('salesBySource')).toBe(true);
  });

  it('every new frontend /admin call has a backend route', () => {
    const backend = read('api/admin.js');
    for (const route of [
      "post('/api/v1/admin/orders/manual'",
      "get('/api/v1/admin/reports/sales'",
      "get('/api/v1/admin/coupons/validate'",
      "get('/api/v1/admin/dashboard/stats'",
    ]) {
      expect(backend.includes(route), route).toBe(true);
    }
  });
});

describe('Manual / external orders — admin UI + i18n', () => {
  it('orders page has channel filter, badge, and manual modal', () => {
    const page = read('src/pages/admin/AdminOrdersPage.jsx');
    expect(page.includes('ManualOrderModal')).toBe(true);
    expect(page.includes('selectedSource')).toBe(true);
    expect(page.includes('sourceLabel')).toBe(true);
    expect(page.includes('/admin/orders/manual')).toBe(false); // modal owns the POST
    const modal = read('src/components/admin/ManualOrderModal.jsx');
    expect(modal.includes("post('/admin/orders/manual'")).toBe(true);
    expect(modal.includes('order_source')).toBe(true);
    expect(modal.includes('/admin/customers?search=')).toBe(true);
    expect(modal.includes('/admin/products?search=')).toBe(true);
  });

  it('picker uses separate color/size selects and hides sold-out combos', () => {
    const modal = read('src/components/admin/ManualOrderModal.jsx');
    expect(modal.includes('selectedColor')).toBe(true);
    expect(modal.includes('selectedSize')).toBe(true);
    expect(modal.includes('colorOptions')).toBe(true);
    expect(modal.includes('sizeOptions')).toBe(true);
    expect(modal.includes('currentAvailable')).toBe(true);
    expect(modal.includes('totalAvailable(p) > 0')).toBe(true);
    expect(modal.includes('개 가능')).toBe(true);
  });

  it('coupon has a pre-save Check button with discount preview', () => {
    const modal = read('src/components/admin/ManualOrderModal.jsx');
    expect(modal.includes('/admin/coupons/validate')).toBe(true);
    expect(modal.includes('handleCouponCheck')).toBe(true);
    expect(modal.includes('appliedCoupon')).toBe(true);
    expect(modal.includes('couponDiscount')).toBe(true);
  });

  it('no whatsapp/phone channel references remain in order sources', () => {
    for (const f of ['api/orderSources.js', 'server/lib/orderSources.js', 'src/utils/orderSources.js']) {
      const src = read(f);
      expect(src.includes("'whatsapp'"), f).toBe(false);
      expect(src.includes("'phone'"), f).toBe(false);
      expect(src.includes('tiktok'), f).toBe(true);
    }
  });

  it('dashboard shows sales by channel and reports page exists with CSV', () => {
    expect(read('src/pages/admin/AdminDashboardPage.jsx').includes('salesBySource')).toBe(true);
    expect(fs.existsSync(path.join(root, 'src/pages/admin/AdminReportsPage.jsx'))).toBe(true);
    expect(read('src/pages/admin/AdminReportsPage.jsx').includes('/admin/reports/sales')).toBe(true);
    expect(read('src/pages/admin/AdminReportsPage.jsx').includes('csv')).toBe(true);
    expect(read('src/App.jsx').includes('/admin/reports')).toBe(true);
    expect(read('src/components/admin/AdminLayout.jsx').includes('/admin/reports')).toBe(true);
  });

  it('locales cover new admin strings in KR and EN', () => {
    for (const f of ['src/locales/ko.json', 'src/locales/en.json']) {
      const j = JSON.parse(read(f));
      for (const key of ['reports', 'manual_order', 'channel', 'sales_by_channel', 'channel_instagram', 'channel_tiktok']) {
        expect(j.admin[key], `${f} admin.${key}`).toBeTruthy();
      }
    }
    const src = read('src/utils/orderSources.js');
    expect(src.includes('instagram')).toBe(true);
  });
});
