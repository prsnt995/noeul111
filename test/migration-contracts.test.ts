import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

function migrationTables() {
  const tables = new Set();
  for (const m of fs.readdirSync(path.join(root, 'supabase/migrations')).filter(f => f.endsWith('.sql'))) {
    const sql = read(path.join('supabase/migrations', m));
    for (const match of sql.matchAll(/create table (?:if not exists )?app\.(\w+)/gi)) {
      tables.add(match[1]);
    }
  }
  return tables;
}

describe('Phase 5-7 — Code↔migration contract alignment', () => {
  const app = read('api/app.js');

  it('only references migrated tables', () => {
    const allowed = migrationTables();
    expect(allowed.size).toBeGreaterThan(10);
    const referenced = new Set([...app.matchAll(/\.from\('([a-z_]+)'\)/g)].map(m => m[1]));
    for (const table of referenced) {
      expect(allowed.has(table), `api/app.js references unmigrated table: ${table}`).toBe(true);
    }
  });

  it('uses migration column names (no retired identifiers)', () => {
    const retired = [
      "from('outbox_events')", "from('site_settings')", "from('carts')",
      "from('homepage_sections')", "from('menu_items')",
      'discount_amount', 'payment_status',
      'payment_method', 'discount_value', 'discount_type', 'start_date',
      'end_date', 'existing.length', 'order.total_amount',
    ];
    for (const token of retired) {
      expect(app.includes(token), `retired identifier still in api/app.js: ${token}`).toBe(false);
    }
    // order_status is retired as a column; order_status_history (table) is current.
    expect(/\border_status\b(?!_history)/.test(app), 'retired order_status column still used').toBe(false);
    // total_amount survives only as a cart response key (frontend contract),
    // never as a database column.
    const totalUses = [...app.matchAll(/total_amount/g)].length;
    expect(totalUses).toBe(1);
    expect(app.includes('CART_UNAVAILABLE')).toBe(true);
  });

  it('uses the transactional outbox table with jsonb payloads', () => {
    expect(app.includes("from('outbox')")).toBe(true);
    expect(app.includes('effect_key')).toBe(true);
    expect(app.includes('idempotency_key')).toBe(true);
  });

  it('seed creates no identities, credentials, or orders (finding #3)', () => {
    const seed = read('server/db/seed.js');
    for (const token of ['password_hash', 'INTO users', 'INTO orders', 'admin1234', 'bcrypt']) {
      expect(seed.includes(token), `seed contains forbidden token: ${token}`).toBe(false);
    }
  });

  it('dual-write sync module is gone (finding #22)', () => {
    expect(fs.existsSync(path.join(root, 'server/lib/supabaseSync.js'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'server/lib/supabase.js'))).toBe(false);
    for (const f of ['server/routes/orders.js', 'server/routes/admin/products.js', 'server/routes/admin/orders.js', 'server/routes/admin/categories.js', 'server/routes/admin/coupons.js']) {
      expect(read(f).includes('supabaseSync'), `${f} still references supabaseSync`).toBe(false);
    }
  });

  it('outbox worker uses lease protocol on app.outbox', () => {
    const worker = read('server/workers/outbox.js');
    expect(worker.includes("from('outbox')")).toBe(true);
    expect(worker.includes('lease_until')).toBe(true);
    expect(worker.includes('dead_at')).toBe(true);
  });

  it('expiry sweeper claims before releasing (finding #21)', () => {
    const worker = read('server/workers/expiry.js');
    expect(worker.includes("'expired'")).toBe(true);
    expect(worker.includes('ORDER_EXPIRED')).toBe(true);
  });

  it('uploads reject active content (finding #7)', () => {
    for (const f of ['server/utils/uploader.js', 'server/routes/admin/upload.js']) {
      const src = read(f);
      expect(/svg/i.test(src), `${f} never mentions SVG handling`).toBe(true);
      expect(/ALLOWED_EXTS[^;]*\.svg/i.test(src), `${f} allowlists svg`).toBe(false);
      expect(src.includes('image/svg+xml'), `${f} maps svg MIME`).toBe(false);
    }
  });
});
