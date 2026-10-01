// Local provider test only: real Toss test SDK/API, memory store, no production DB.
import dotenv from 'dotenv';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createLab } from '../test/pg-lab/fixture.js';
import { createPaymentService } from '../server/payments/toss.js';
import { registerPaymentRoutes } from '../server/payments/routes.js';

const env = dotenv.config({ path: '.env.pg-test' }).parsed || {};
if (!/^test_gck_/.test(env.TOSS_CLIENT_KEY || '') || !/^test_gsk_/.test(env.TOSS_SECRET_KEY || '')) {
  throw new Error('Set matching widget test keys in ignored .env.pg-test. Live/API-individual keys are rejected.');
}
const lab = createLab();
lab.order.orderId = `noeul_test_${randomUUID()}`;
const service = createPaymentService({ env, store: lab.store });
const app = express();
app.use(express.json());
app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const pass = (_req, _res, next) => next();
app.get('/', (_req, res) => res.redirect(`/checkout/toss?order=${lab.order.orderId}`));
app.get('/api/v1/me', (_req, res) => res.json({ success: true, csrf: 'sandbox-only' }));
app.get('/sandbox/state', (_req, res) => res.json({ environment: 'toss-test-memory-store', order: lab.order }));
registerPaymentRoutes(app, { service, authenticate: (req, _res, next) => {
  req.locals = { session: { user_id: 'lab-user' } }; next();
}, staff: () => pass, stepUp: pass, limiter: pass });
const vite = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, appType: 'custom' });
app.use(vite.middlewares);
app.use(async (req, res, next) => {
  try {
    res.type('html').send(await vite.transformIndexHtml(req.originalUrl,
      '<!doctype html><html lang="ko"><meta charset="UTF-8"><title>Toss test sandbox</title><div id="root"></div><script type="module" src="/test/pg-sandbox/ui.jsx"></script></html>'));
  } catch (error) { next(error); }
});
// Auth is deliberately replaced. Never expose this harness on a server or tunnel.
app.listen(5192, '127.0.0.1', () => console.log('Toss test only / volatile memory store: http://127.0.0.1:5192'));
