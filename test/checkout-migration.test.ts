import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Checkout/order corrective migration (202611160001)', () => {
  const sql = read('supabase/migrations/202611160001_checkout_and_order_fixes.sql');
  const body = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  it('aggregates order_items per variant (the GROUP BY 1 runtime bug)', () => {
    expect(body).toContain("group by (x->>'variant_id')::uuid");
    expect(body).not.toMatch(/group by 1\b/i);
    // The constant order id must never be the grouping key.
    expect(body).not.toMatch(/select\s+v_order_id[\s\S]{0,200}group by 1/i);
  });

  it('snapshots customer contact on orders and backfills it', () => {
    for (const col of ['customer_name', 'customer_email', 'customer_phone']) {
      expect(sql).toContain(`add column if not exists ${col}`);
    }
    expect(sql).toContain("o.address->>'recipient'");
    expect(sql).toContain("p_address->>'email'");
    expect(sql).toContain('v_profile.email');
  });

  it('stamps paid_at for every entering transition, without overwriting it', () => {
    expect(sql).toContain('create trigger orders_stamp_paid_at');
    expect(sql).toContain("new.status in ('paid','processing','shipped','delivered')");
    expect(sql).toContain('old.status is distinct from new.status');
  });

  it('reports exact net-of-refund revenue keyed by payment date', () => {
    expect(sql).toContain('from app.payment_refunds');
    expect(sql).toContain('coalesce(o.paid_at, o.created_at)');
    expect(sql).toContain('o.amount - coalesce(r.refunded, 0)');
  });

  it('guards refunds against unknown or insufficient balance', () => {
    expect(sql).toContain('create trigger payment_refunds_guard_balance');
    expect(sql).toContain('v_balance is null or v_balance < new.amount');
    expect(sql).toContain("raise exception 'REFUND_EXCEEDS_BALANCE'");
  });

  it('adds case-insensitive email uniqueness without failing on duplicates', () => {
    expect(sql).toContain('create unique index if not exists profiles_email_ci_idx on app.profiles(lower(email))');
    expect(sql).toContain('raise notice');
  });
});
