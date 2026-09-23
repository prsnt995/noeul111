import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// Fail-closed gating tests. Supabase env is blanked BEFORE the app module
// loads (dotenv never overrides existing vars), so every database-backed
// path must 503 while auth-gated paths 401 — both without network access.
describe('Phase 1-4 — Auth gating and fail-closed behavior', () => {
  let app: any;
  beforeAll(async () => {
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SECRET_KEY = '';
    process.env.SUPABASE_PUBLISHABLE_KEY = '';
    process.env.WORKERS_ENABLED = '0';
    // Runtime-only URL: keeps TypeScript from mapping '../api/app.js' to the
    // git-ignored api/*.ts reference tree (NodeNext .js->.ts resolution).
    const mod = await import(new URL('../api/app.js', import.meta.url).href);
    app = mod.default;
  });

  it('rejects unauthenticated identity access', async () => {
    await request(app).get('/api/v1/me').expect(401);
  });

  it('rejects unauthenticated order creation (no guest checkout)', async () => {
    await request(app)
      .post('/api/v1/orders')
      .set('Idempotency-Key', 'test-key-12345')
      .send({ items: [] })
      .expect(401);
  });

  it('rejects unauthenticated order reads', async () => {
    await request(app).get('/api/v1/orders').expect(401);
    await request(app).get('/api/v1/orders/NE123').expect(401);
  });

  it('rejects unauthenticated cart and wishlist writes', async () => {
    await request(app).post('/api/v1/cart/items').send({}).expect(401);
    await request(app).post('/api/v1/wishlist/toggle').send({}).expect(401);
  });

  it('rejects unauthenticated admin access', async () => {
    await request(app).get('/api/v1/admin/audit-logs').expect(401);
  });

  it('keeps payment endpoints fail-closed without a session', async () => {
    await request(app).post('/api/v1/payments/toss/prepare').send({}).expect(401);
    await request(app).post('/api/v1/payments/toss/confirm').send({}).expect(401);
  });

  it('fails closed (503) on database paths without Supabase', async () => {
    await request(app).get('/api/v1/catalog/products').expect(503);
    await request(app).get('/api/v1/store/settings/public').expect(503);
    await request(app).get('/health/ready').expect(503);
  });

  it('health/live stays green without dependencies', async () => {
    await request(app).get('/health/live').expect(200);
  });
});
