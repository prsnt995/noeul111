import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

function backendRoutes() {
  const src = read('api/admin.js') + read('api/app.js');
  const routes: { method: string; pattern: RegExp; raw: string }[] = [];
  for (const m of src.matchAll(/app\.(get|post|put|patch|delete)\('(\/api\/v1\/[^']+)'/g)) {
    const raw = m[2];
    const pattern = new RegExp('^' + raw.replace(/:[^/]+/g, '[^/]+') + '$');
    routes.push({ method: m[1].toUpperCase(), pattern, raw });
  }
  return routes;
}

function frontendCalls() {
  const calls: { method: string; path: string; file: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(jsx?|tsx?)$/.test(entry.name)) continue;
      const src = fs.readFileSync(full, 'utf8');
      for (const m of src.matchAll(/(?:api|customerApi|adminApi)\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g)) {
        // Keep dynamic segments as placeholders so /admin/products/${id}/stock
        // matches the backend /api/v1/admin/products/:id/stock route.
        // ${...} after a slash is a path segment (→ placeholder); anywhere
        // else it is a query string (→ dropped).
        let p = m[2].split('?')[0].replace(/([^/])\$\{[^}]*\}/g, '$1').replace(/\$\{[^}]*\}/g, ':p').replace(/\/+$/, '');
        if (!p.startsWith('/admin/')) continue;
        calls.push({ method: m[1].toUpperCase(), path: `/api/v1${p}`, file: path.relative(root, full) });
      }
    }
  };
  walk(path.join(root, 'src'));
  return calls;
}

describe('Wave 3 — Admin backend covers the admin UI', () => {
  it('every frontend /admin call has a backend route (no more 404s)', () => {
    const routes = backendRoutes();
    const missing = frontendCalls().filter(
      c => !routes.some(r => r.method === c.method && r.pattern.test(c.path))
    );
    expect(missing.map(m => `${m.method} ${m.path} (${m.file})`)).toEqual([]);
  });

  it('role policy: staff CRUD is super_admin-only with step-up', () => {
    const admin = read('api/admin.js');
    for (const route of [
      "post('/api/v1/admin/users/staff'",
      "put('/api/v1/admin/users/staff/:id'",
      "delete('/api/v1/admin/users/staff/:id'",
    ]) {
      const idx = admin.indexOf(route);
      expect(idx, route).toBeGreaterThan(-1);
      const head = admin.slice(Math.max(0, idx - 0), idx + 220);
      expect(head.includes("staff(['super_admin'])")).toBe(true);
      expect(head.includes('stepUp')).toBe(true);
    }
  });

  it('role policy: editor appears only in catalog/cms/dashboard sets', () => {
    const admin = read('api/admin.js');
    const sets: Record<string, string[]> = {};
    for (const m of admin.matchAll(/^\s{2}(\w+): \[([^\]]*)\],?$/gm)) {
      sets[m[1]] = [...m[2].matchAll(/'([^']+)'/g)].map(x => x[1]);
    }
    expect(Object.keys(sets).length).toBeGreaterThan(3);
    for (const [name, roles] of Object.entries(sets)) {
      if (roles.includes('editor')) {
        expect(['catalog', 'cms', 'dashboard'].includes(name), `editor in ${name}`).toBe(true);
      }
    }
    for (const group of ['orders', 'money', 'settings', 'customers']) {
      expect(sets[group].includes('editor'), `editor in ${group}`).toBe(false);
    }
    expect(admin.includes('need(R.orders)')).toBe(true);
    expect(admin.includes('need(R.customers)')).toBe(true);
    expect(admin.includes('need(R.settings)')).toBe(true);
  });

  it('no manual paid-marking anywhere in the admin surface', () => {
    const admin = read('api/admin.js');
    expect(admin.includes("update({ status: 'paid' })")).toBe(false);
    expect(admin.includes('VERIFY_NOT_APPLICABLE')).toBe(true);
  });

  it('verify-payment and settings mutations require step-up', () => {
    const admin = read('api/admin.js');
    expect(admin.includes("verify-payment', authenticate, staff(R.money), stepUp")).toBe(true);
    expect(admin.includes("content/settings', authenticate, staff(R.settings), stepUp")).toBe(true);
  });

  it('Wave 3b — dead provider/Bearer paths are gone from the UI', () => {
    expect(read('src/pages/AuthCallbackPage.jsx').includes('supabase')).toBe(false);
    expect(read('src/pages/AuthCallbackPage.jsx').includes('/api/v1/auth/google/start?staff=1')).toBe(false);
    expect(read('src/context/AuthContext.jsx').includes('?staff=1')).toBe(false);
    for (const f of ['src/components/common/MediaPickerModal.jsx', 'src/pages/admin/AdminMediaPage.jsx']) {
      expect(read(f).includes('noeul_auth_token'), f).toBe(false);
      expect(read(f).includes('Authorization'), f).toBe(false);
    }
    expect(fs.existsSync(path.join(root, 'src/lib/supabase.js'))).toBe(false);
  });

  it('Wave 3b — storefront review write path and summary exist', () => {
    const app = read('api/app.js');
    expect(app.includes("products/:id/reviews', checkoutLimiter")).toBe(true);
    expect(app.includes('is_approved: false')).toBe(true);
    expect(app.includes('totalReviews')).toBe(true);
  });
});
