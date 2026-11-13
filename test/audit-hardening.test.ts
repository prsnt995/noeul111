import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Audit hardening regressions', () => {
  const app = read('api/app.js');
  const admin = read('api/admin.js');
  const vercel = JSON.parse(read('vercel.json'));

  it('does not use the broken double-escaped numeric product regex', () => {
    expect(app.includes('/^\\\\d+$/')).toBe(false);
    expect(app.includes('const isNumeric = /^\\d+$/.test(raw)')).toBe(true);
  });

  it('serves the Meta feed from an /api path with real schema fields', () => {
    expect(app.includes("app.get('/api/v1/feed/meta.xml'")).toBe(true);
    expect(app.includes("app.get('/feed/meta.xml', metaFeedHandler)")).toBe(true);
    expect(app.includes(".select('*,categories(slug),product_variants(*),product_media(*)')\n      .eq('is_active', true)")).toBe(true);
    expect(app.includes('g:sale_price')).toBe(true);
  });

  it('fails the ads cron closed and compares secrets in constant time', () => {
    expect(app.includes('function cronSecretMatches')).toBe(true);
    expect(app.includes('if (production || env.ADS_CRON_SECRET)')).toBe(true);
    expect(app.includes("cronSecretMatches(req, 'ADS_CRON_SECRET')")).toBe(true);
    expect(app.includes('timingSafeEqual')).toBe(true);
  });

  it('checks CAPI order ownership and trusts the stored amount', () => {
    expect(app.includes(".eq('order_number', order_number.trim())")).toBe(true);
    expect(app.includes(".eq('id', order.id)")).toBe(true);
    expect(app.includes('const amount = Number(order.amount) || 0;')).toBe(true);
    expect(app.includes('normalizeOrderSource')).toBe(true);
  });

  it('persists UTM attribution on the atomic RPC path too', () => {
    expect(app.includes("placedOutcome === 'created' && utm_params")).toBe(true);
    expect(app.includes("['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']")).toBe(true);
  });

  it('drains outbox/expiry workers from a serverless cron', () => {
    expect(app.includes("app.get('/api/v1/cron/workers'")).toBe(true);
    expect(app.includes('runOutboxBatch')).toBe(true);
    expect(app.includes('runExpiryBatch')).toBe(true);
    expect(vercel.crons.some((c: any) => c.path === '/api/v1/cron/workers')).toBe(true);
    expect(vercel.rewrites.some((r: any) => r.source === '/health/(.*)')).toBe(true);
  });

  it('clears the React cart after a confirmed payment', () => {
    const page = read('src/pages/TossPaymentPage.jsx');
    expect(page.includes('clearCartRef.current()')).toBe(true);
    expect(page.includes('const { clearCart } = useCart()')).toBe(true);
  });

  it('carries the applied coupon from cart to checkout', () => {
    const cart = read('src/context/CartContext.jsx');
    const checkout = read('src/pages/CheckoutPage.jsx');
    expect(cart.includes('appliedCoupon')).toBe(true);
    expect(cart.includes('setAppliedCoupon')).toBe(true);
    expect(checkout.includes("coupon_code: appliedCoupon?.code || null")).toBe(true);
  });

  it('removes fabricated coupon and review claims', () => {
    const authPage = read('src/pages/CustomerAuthPage.jsx');
    const reviews = read('src/components/common/ProductReviews.jsx');
    expect(authPage.includes('웰컴 쿠폰')).toBe(false);
    expect(reviews.includes('<strong>98%</strong>')).toBe(false);
    expect(reviews.includes('summary.satisfaction')).toBe(true);
  });

  it('makes ad spend idempotent with a sync_key', () => {
    const migration = read('supabase/migrations/202611130001_ad_spend_sync_key.sql');
    expect(migration.includes('sync_key')).toBe(true);
    expect(migration.includes('unique index')).toBe(true);
    expect(app.includes("onConflict: 'sync_key'")).toBe(true);
  });

  it('reads low stock from variants, not non-existent product columns', () => {
    expect(admin.includes("from('products').select('id,name,sku,stock')")).toBe(false);
    expect(admin.includes("from('product_variants')")).toBe(true);
    expect(app.includes("from('products').select('id,sku,name').eq('stock', 0)")).toBe(false);
    expect(app.includes('.lte(\'stock\', 10)')).toBe(true);
  });

  it('soft-deletes deselected variants instead of hitting the order FK', () => {
    expect(admin.includes("from('product_variants').delete().eq('id', v.id)")).toBe(false);
    expect(admin.includes("update({ active: false }).eq('id', v.id)")).toBe(true);
  });

  it('audits media create/upload/delete', () => {
    expect(admin.includes("auditLog(req, 'MEDIA_CREATE'")).toBe(true);
    expect(admin.includes("auditLog(req, 'MEDIA_UPLOAD'")).toBe(true);
    expect(admin.includes("auditLog(req, 'MEDIA_DELETE'")).toBe(true);
  });

  it('pins search_path on claim_coupon', () => {
    const migration = read('supabase/migrations/202611130002_claim_coupon_search_path.sql');
    expect(migration.includes('set search_path = app, pg_temp')).toBe(true);
  });

  it('documents the SESSION_KEY hex format', () => {
    const envExample = read('.env.example');
    expect(envExample.includes('openssl rand -hex 32')).toBe(true);
    expect(envExample.includes('64 hex chars')).toBe(true);
  });

  it('enables a CSP on API responses and Vercel-served assets', () => {
    expect(app.includes('contentSecurityPolicy: {')).toBe(true);
    expect(app.includes('frameAncestors: ["\'self\'"]')).toBe(true);
    const globalHeaders = vercel.headers.find((h: any) => h.source === '/(.*)').headers;
    expect(globalHeaders.some((h: any) => h.key === 'Content-Security-Policy')).toBe(true);
  });

  it('keeps all four staff roles aligned between UI and API', () => {
    expect(app.includes("const STAFF_ROLES = ['super_admin', 'admin', 'order_manager', 'editor'];")).toBe(true);
    const authContext = read('src/context/AuthContext.jsx');
    expect(authContext.includes("const STAFF_ROLES = ['super_admin', 'admin', 'order_manager', 'editor'];")).toBe(true);
  });
});
