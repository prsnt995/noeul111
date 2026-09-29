import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerAdminRoutes } from '../api/admin.js';

describe('legacy admin routes cannot bypass PG cancellation', () => {
  it.each(['paid', 'processing'])('rejects direct cancellation of %s orders', async status => {
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { id: 'order-uuid', status } }) };
    const releaseHoldRpc = vi.fn();
    const app = express(); app.use(express.json());
    const next = (_req, _res, n) => n();
    registerAdminRoutes(app, {
      database: () => ({ from: () => query }),
      error: (res, code, message) => res.status(code).json({ message }),
      auditLog: vi.fn(), authenticate: next, staff: () => next, stepUp: next, releaseHoldRpc,
    });
    await request(app).patch('/api/v1/admin/orders/order-uuid/status').send({ order_status: 'canceled' }).expect(409);
    await request(app).patch('/api/v1/admin/orders/order-uuid/verify-payment').send({ action: 'reject' }).expect(409);
    expect(releaseHoldRpc).not.toHaveBeenCalled();
  });
});
