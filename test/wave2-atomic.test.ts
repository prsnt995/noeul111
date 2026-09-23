import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Wave 2 — Atomicity and money-state guards', () => {
  describe('Atomic RPC migration', () => {
    it('migration 009 defines locked single-transaction functions', () => {
      const sql = read('supabase/migrations/202609180009_atomic_orders.sql');
      expect(sql.includes('app.place_order')).toBe(true);
      expect(sql.includes('app.release_hold')).toBe(true);
      expect(sql.includes('for update')).toBe(true);
      expect(sql.includes('on conflict (effect_key) do nothing')).toBe(true);
      expect(sql.includes('grant execute')).toBe(true);
    });
  });

  describe('RPC-first wiring with JS fallback', () => {
    it('order create tries place_order before the JS path', () => {
      const app = read('api/app.js');
      expect(app.includes("rpc('place_order'")).toBe(true);
      expect(app.includes('tryPlaceOrderRpc')).toBe(true);
      expect(app.includes('COUPON_INVALID')).toBe(true);
    });

    it('cancel and expiry use release_hold', () => {
      const app = read('api/app.js');
      expect(app.includes("rpc('release_hold'")).toBe(true);
      const expiry = read('server/workers/expiry.js');
      expect(expiry.includes("rpc('release_hold'")).toBe(true);
    });
  });

  describe('H3 — refund cannot mark refunded on provider failure', () => {
    it('checks Toss result, dedups, and keys provider idempotency', () => {
      const app = read('api/app.js');
      expect(app.includes('if (!tossRes.ok)')).toBe(true);
      expect(app.includes("payment.status === 'refunded'")).toBe(true);
      expect(app.includes("'Idempotency-Key': String(payment.cancel_key")).toBe(true);
      expect(app.includes('REFUND_FAILED')).toBe(true);
    });
  });

  describe('H6/M1 — terminal writes are state-qualified', () => {
    it('paid write and reverts require confirming; cancel claims its transition', () => {
      const app = read('api/app.js');
      expect(app.includes("update({ status: 'paid' }).eq('id', order.id).eq('status', 'confirming')")).toBe(true);
      expect(app.includes('payment.state_conflict')).toBe(true);
      expect(app.includes(".in('status', ['pending_payment','paid'])")).toBe(true);
      expect(app.includes('claimedCancel')).toBe(true);
    });
  });
});
