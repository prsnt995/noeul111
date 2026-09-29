import { PaymentError } from './toss.js';

export function registerPaymentRoutes(app, { service, authenticate, staff, stepUp, limiter }) {
  const run = action => async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { res.json({ success: true, data: await action(req) }); }
    catch (err) { res.status(err instanceof PaymentError ? err.status : 503).json({ success: false, code: err instanceof PaymentError ? err.code : 'PAYMENTS_UNAVAILABLE' }); }
  };
  app.get('/api/v1/payments/toss/config', (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ success: true, data: { enabled: service.configured() } });
  });
  app.post('/api/v1/payments/toss/prepare', authenticate, limiter, run(req => service.prepare(req.body?.orderId, req.locals.session.user_id)));
  app.post('/api/v1/payments/toss/recover', authenticate, limiter, run(req => service.recover(req.body?.orderId, req.locals.session.user_id)));
  app.post('/api/v1/admin/payments/:id/recover', authenticate, staff(['super_admin','admin','order_manager']), stepUp,
    run(req => service.recover(req.params.id, req.locals.session.user_id, true)));
  app.post('/api/v1/payments/toss/confirm', authenticate, limiter, run(req => service.confirm(req.body || {}, req.locals.session.user_id)));
  app.post('/api/v1/admin/payments/:id/refunds', authenticate, staff(['super_admin','admin','order_manager']), stepUp,
    run(req => service.refund({ actorId: req.locals.session.user_id, orderId: req.params.id, reason: req.body?.reason, amount: req.body?.amount, operationId: req.get('Idempotency-Key') })));
  app.post('/api/v1/payments/toss/webhook', run(req => service.webhook(req.body || {})));
}
