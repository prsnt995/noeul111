import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { fileURLToPath } from 'node:url';

// Cache-header contract tests. Supabase env is blanked BEFORE the app module
// loads (dotenv never overrides existing vars), so every database-backed path
// 503s without network access while the middleware headers remain observable.
const PUBLIC_CACHE = 'public, max-age=30, s-maxage=60, stale-while-revalidate=120';

describe('API cache headers', () => {
  let app: any;

  beforeAll(async () => {
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SECRET_KEY = '';
    process.env.SUPABASE_PUBLISHABLE_KEY = '';
    process.env.WORKERS_ENABLED = '0';
    // Filesystem path (not URL href) so workspaces with spaces resolve.
    const mod = await import(fileURLToPath(new URL('../api/app.js', import.meta.url)));
    app = mod.default;
  });

  it.each([
    '/api/v1/catalog/products',
    '/api/v1/catalog/categories',
    '/api/v1/content/home',
    '/api/v1/content/menu',
    '/api/v1/pages/about',
    '/api/v1/store/settings/public',
    '/api/v1/products/1/reviews',
  ])('edge-caches public GET %s', async (path: string) => {
    const res = await request(app).get(path);
    expect(res.headers['cache-control']).toBe(PUBLIC_CACHE);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it.each([
    '/api/v1/me',
    '/api/v1/me/addresses',
    '/api/v1/cart',
    '/api/v1/wishlist',
    '/api/v1/orders',
    '/api/v1/admin/products',
    '/api/v1/admin/audit-logs',
  ])('keeps user-specific GET %s private', async (path: string) => {
    const res = await request(app).get(path);
    expect(res.headers['cache-control']).toBe('private, max-age=0');
  });

  it('never publicly caches review submission', async () => {
    const res = await request(app).post('/api/v1/products/1/reviews').send({});
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('never publicly caches writes under public prefixes', async () => {
    const put = await request(app).put('/api/v1/catalog/products').send({});
    expect(put.headers['cache-control']).toBe('no-store');
    const del = await request(app).delete('/api/v1/catalog/products');
    expect(del.headers['cache-control']).toBe('no-store');
  });

  it('never edge-caches oauth start', async () => {
    const res = await request(app).get('/api/v1/auth/google/start');
    expect(res.headers['cache-control']).toBe('private, max-age=0');
  });
});
