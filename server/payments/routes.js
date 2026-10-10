import { PaymentError } from './toss.js';

export function registerPaymentRoutes(app, { service, authenticate, staff, stepUp, limiter }) {
  const run = action => async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { res.json({ success: true, data: await action(req) }); }
    catch (err) { res.status(err instanceof PaymentError ? err.status : 503).json({ success: false, code: err instanceof PaymentError ? err.code : 'PAYMENTS_UNAVAILABLE' }); }
  };
  app.get('/api/v1/payments/toss/config', async (_req, res) => {
    let enabled = false;
    try { enabled = await service.available(); } catch { /* DB schema/network not ready */ }
    res.set('Cache-Control', 'no-store').json({ success: true, data: { enabled } });
  });
  app.post('/api/v1/payments/toss/prepare', authenticate, limiter, run(req => service.prepare(req.body?.orderId, req.locals.session.user_id)));
  app.post('/api/v1/payments/toss/recover', authenticate, limiter, run(req => service.recover(req.body?.orderId, req.locals.session.user_id)));
  app.post('/api/v1/admin/payments/:id/recover', authenticate, staff(['super_admin','admin','order_manager']), stepUp,
    run(req => service.recover(req.params.id, req.locals.session.user_id, true)));
  app.post('/api/v1/payments/toss/confirm', authenticate, limiter, run(req => service.confirm(req.body || {}, req.locals.session.user_id)));
  app.post('/api/v1/admin/payments/:id/refunds', authenticate, staff(['super_admin','admin','order_manager']), stepUp,
    run(req => service.refund({ actorId: req.locals.session.user_id, orderId: req.params.id, reason: req.body?.reason, amount: req.body?.amount, operationId: req.get('Idempotency-Key') })));
  // Webhook is reconciliation-only (payload re-verified against the PG via
  // retrieve; unknown keys fail closed) but each hit costs a PG call, so it
  // shares the payment rate limiter — Toss retries delivery on 429.
  // Optional shared-secret: set TOSS_WEBHOOK_SECRET to require
  // x-webhook-secret header (fail-closed when configured, open otherwise
  // for backwards compat — reconcile still never trusts the payload).
  app.post('/api/v1/payments/toss/webhook', limiter, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const expected = process.env.TOSS_WEBHOOK_SECRET;
      if (expected && req.get('x-webhook-secret') !== expected) {
        res.status(401).json({ success: false, code: 'WEBHOOK_UNAUTHORIZED' });
        return;
      }
      res.json({ success: true, data: await service.webhook(req.body || {}) });
    } catch (err) {
      res.status(err instanceof PaymentError ? err.status : 503).json({ success: false, code: err instanceof PaymentError ? err.code : 'PAYMENTS_UNAVAILABLE' });
    }
  });
}
