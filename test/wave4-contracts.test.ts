import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Wave 4 — Frontend↔API contract alignment', () => {
  describe('H7 — product detail by id or slug with related', () => {
    it('backend resolves numeric id and slug and returns related', () => {
      const app = read('api/app.js');
      expect(app.includes("isNumeric")).toBe(true);
      expect(app.includes('related:')).toBe(true);
    });

    it('frontend resets all selection state and has no fixture fallback', () => {
      const page = read('src/pages/ProductDetailPage.jsx');
      expect(page.includes("setSelectedSize('')")).toBe(true);
      expect(page.includes('setSelectedColor(null)')).toBe(true);
      expect(page.includes('data/products.js')).toBe(false);
      expect(page.includes('getRelatedProducts')).toBe(false);
    });
  });

  describe('H8 — shop params and sorts match the contract', () => {
    it('frontend sends canonical names; backend covers aliases and sorts', () => {
      const shop = read('src/pages/ShopPage.jsx');
      expect(shop.includes("params.append('is_new'")).toBe(true);
      expect(shop.includes("params.append('is_best'")).toBe(true);
      expect(shop.includes("params.append('isNew'")).toBe(false);
      expect(shop.includes("params.append('isBest'")).toBe(false);
      const app = read('api/app.js');
      expect(app.includes('isNew')).toBe(true);
      expect(app.includes('isBest')).toBe(true);
      expect(app.includes("'best'")).toBe(true);
    });

    it('category filters through a two-step id lookup, not embedded join', () => {
      const app = read('api/app.js');
      expect(app.includes("eq('categories.slug'")).toBe(false);
      expect(app.includes("in('category_id'")).toBe(true);
    });
  });

  describe('M8 — account page reads canonical order fields', () => {
    it('orders embed items; frontend uses status/amount/address', () => {
      const app = read('api/app.js');
      expect(app.includes('enrichOrders')).toBe(true);
      const page = read('src/pages/CustomerAccountPage.jsx');
      for (const legacy of ['order.order_status', 'order.total_amount', 'order.payment_status', '영수증', '무통장']) {
        expect(page.includes(legacy), `legacy reference remains: ${legacy}`).toBe(false);
      }
      expect(page.includes('order.status')).toBe(true);
      expect(page.includes('order.amount')).toBe(true);
      expect(page.includes('order.address')).toBe(true);
    });

    it('status map covers canonical fulfillment states', () => {
      const fmt = read('src/utils/formatters.js');
      for (const key of ['pending_payment', 'confirming', 'paid', 'canceled', 'expired', 'refund_pending']) {
        expect(fmt.includes(`${key}:`), `missing status key: ${key}`).toBe(true);
      }
    });
  });

  describe('M9 — site seed, minimum policy, idempotency scope, cart clamp', () => {
    it('site seed migration exists and settings read it', () => {
      expect(fs.existsSync(path.join(root, 'supabase/migrations/202609180011_site_seed.sql'))).toBe(true);
      expect(read('api/app.js').includes("in('key', ['shipping','site'])")).toBe(true);
    });

    it('zero-amount orders rejected at quote and create time', () => {
      const app = read('api/app.js');
      expect(app.split('MINIMUM_AMOUNT').length - 1).toBeGreaterThanOrEqual(2);
    });

    it('idempotency hash covers address; cart clamps races', () => {
      const app = read('api/app.js');
      expect(app.includes('coupon_code: coupon_code || null, address: address || null')).toBe(true);
      expect(app.includes('maxAllowed')).toBe(true);
    });
  });
});

describe('Wave 5 — Legacy lockdown', () => {
  describe('Admin order state-machine guards', () => {
    it('verify-payment blocks paid orders and uses role allowlist', () => {
      const admin = read('server/routes/admin/orders.js');
      expect(admin.includes('const UNSETTLED =')).toBe(true);
      expect(admin.includes("existing.payment_status === 'paid'")).toBe(true);
      expect(admin.includes("verifyRole")).toBe(true);
    });

    it('status route has transition allowlist and blocks paid/confirmed assignment', () => {
      const admin = read('server/routes/admin/orders.js');
      expect(admin.includes("const allowed =")).toBe(true);
      expect(admin.includes("'paid', 'confirmed'")).toBe(true);
      expect(admin.includes('order_status = ?')).toBe(true);
    });

    it('tracking route requires paid/confirmed, courier, and tracking number', () => {
      const admin = read('server/routes/admin/orders.js');
      expect(admin.includes("verifyRole")).toBe(true);
      expect(admin.includes('const { courier_name, tracking_number } = req.body')).toBe(true);
      expect(admin.includes("['paid', 'confirmed', 'processing'].includes")).toBe(true);
    });
  });

  describe('Receipt: file-only, webhook order check', () => {
    it('receipt route accepts multipart upload only (no receipt_url body)', () => {
      const orders = read('server/routes/orders.js');
      expect(orders.includes('req.file && !req.body.receipt_url')).toBe(false);
      expect(orders.includes('!req.file')).toBe(true);
      expect(orders.includes("req.body.receipt_url")).toBe(false);
    });

    it('webhook verifies order exists before inserting webhook_events', () => {
      const app = read('api/app.js');
      expect(app.includes("from('orders').select('id,order_number').eq('order_number', body.orderId)")).toBe(true);
      expect(app.includes('order_id: order.id')).toBe(true);
    });
  });

  describe('Outbox: lease cleanup and dead-letter surface', () => {
    it('success path clears lease_token and lease_until', () => {
      const worker = read('server/workers/outbox.js');
      expect(worker.includes("lease_until: null, lease_token: null")).toBe(true);
      // Success path must clear lease too
      const donePath = worker.includes("done_at: new Date().toISOString(), last_error: null, lease_until: null, lease_token: null");
      expect(donePath).toBe(true);
    });

    it('unknown outbox kinds surface as dead-letter with alertOps', () => {
      const worker = read('server/workers/outbox.js');
      expect(worker.includes("Unknown outbox kind")).toBe(true);
      expect(worker.includes("alertOps('outbox.dead_letter'")).toBe(true);
    });
  });
});
