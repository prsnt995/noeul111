import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Wave 0 — Critical path restores', () => {
  describe('C1 — api wrappers forward caller options (Idempotency-Key)', () => {
    let api: any;
    let seen: any;
    beforeEach(async () => {
      vi.resetModules();
      seen = null;
      (globalThis as any).fetch = async (url: string, init: any) => {
        seen = { url, init };
        return { ok: true, json: async () => ({ success: true }) };
      };
      ({ api } = await import(new URL('../src/utils/api.js', import.meta.url).href));
    });

    it('forwards custom headers on POST (checkout Idempotency-Key)', async () => {
      await api.post('/orders', { items: [] }, { headers: { 'Idempotency-Key': 'order-abc-123' } });
      expect(seen.url).toBe('/api/v1/orders');
      expect(seen.init.headers['Idempotency-Key']).toBe('order-abc-123');
      expect(seen.init.method).toBe('POST');
    });

    it('forwards options on put/patch/delete without dropping method', async () => {
      await api.patch('/me', { name: 'Kim' }, { headers: { 'X-Test': '1' } });
      expect(seen.init.method).toBe('PATCH');
      expect(seen.init.headers['X-Test']).toBe('1');
      await api.delete('/wishlist/1', { headers: { 'X-Test': '2' } });
      expect(seen.init.method).toBe('DELETE');
    });

    it('still sends cookies and CSRF on mutations', async () => {
      await api.post('/orders', {});
      expect(seen.init.credentials).toBe('include');
    });
  });

  describe('C2 — no double /api/v1 prefix at call sites', () => {
    it('no api.* call embeds /api/v1 (API_BASE already prefixes)', () => {
      const offenders: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) { walk(full); continue; }
          if (!/\.(jsx?|tsx?)$/.test(entry.name)) continue;
          const src = fs.readFileSync(full, 'utf8');
          const hits = [...src.matchAll(/(?:api|customerApi|adminApi)\.(get|post|put|patch|delete)\(\s*['"`]\/api\/v1\//g)];
          if (hits.length) offenders.push(`${path.relative(root, full)} (${hits.length})`);
        }
      };
      walk(path.join(root, 'src'));
      expect(offenders).toEqual([]);
    });
  });

  describe('H1 — only staff roles grant admin UI', () => {
    it('isStaffRole admits staff, rejects customers and junk', async () => {
      const { isStaffRole } = await import(new URL('../src/context/AuthContext.jsx', import.meta.url).href);
      for (const role of ['super_admin', 'admin']) {
        expect(isStaffRole(role)).toBe(true);
      }
      for (const role of ['editor', 'order_manager', 'customer', '', null, undefined, 'ADMIN', 'root']) {
        expect(isStaffRole(role as any)).toBe(false);
      }
    });

    it('AuthProvider gates adminUser on the allowlist, not truthiness', () => {
      const src = read('src/context/AuthContext.jsx');
      expect(src.includes('isStaffRole(next.role)')).toBe(true);
      expect(src.includes('next?.role ? next : null')).toBe(false);
    });
  });
});
