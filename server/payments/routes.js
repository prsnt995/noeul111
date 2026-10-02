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
  app.post('/api/v1/payments/toss/webhook', limiter, run(req => service.webhook(req.body || {})));
}
