import { PaymentError } from './toss.js';

export function registerPaymentRoutes(app, { service, authenticate, staff, stepUp, limiter, webhookLimiter, auditLog }) {
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
  app.post('/api/v1/admin/payments/:id/recover', authenticate, staff(['super_admin','admin']), stepUp,
    run(req => service.recover(req.params.id, req.locals.session.user_id, true)));

  // Payment health: makes missing production secrets and the size of the
  // stuck-payment queue visible in the admin console.
  app.get('/api/v1/admin/payments/health', authenticate, staff(['super_admin','admin']), async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    let ready = false;
    try { ready = await service.available(); } catch { ready = false; }
    let queue = { confirmingStale: 0, recoveryRequired: 0, needsReview: 0 };
    try {
      if (typeof service.storeHealth === 'function') queue = await service.storeHealth();
    } catch { /* health is best-effort */ }
    res.json({
      success: true,
      data: {
        configured: service.configured(),
        ready,
        production: process.env.NODE_ENV === 'production',
        secrets: {
          toss: Boolean(process.env.TOSS_CLIENT_KEY && process.env.TOSS_SECRET_KEY),
          webhook: Boolean(process.env.TOSS_WEBHOOK_SECRET),
          cron: Boolean(process.env.PAYMENTS_CRON_SECRET || process.env.CRON_SECRET),
        },
        queue,
      },
    });
  });

  // One-click repair for rows left behind by a lost confirm response or a
  // disabled recovery worker. Re-queries the PG only (no charge/refund).
  app.post('/api/v1/admin/payments/reconcile-stale', authenticate, staff(['super_admin','admin']), stepUp, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const limit = Math.min(Math.max(Number(req.body?.limit) || 10, 1), 20);
      const olderThanMinutes = Math.min(Math.max(Number(req.body?.olderThanMinutes) || 5, 1), 1440);
      const result = await service.reconcileStale({ limit, olderThanMinutes });
      await auditLog?.(req, 'PAYMENT_RECONCILE_STALE', {
        table: 'payments', id: 'batch',
        after: { limit, olderThanMinutes, scanned: result.scanned, recovered: result.recovered, pending: result.pending },
      });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(err instanceof PaymentError ? err.status : 503).json({
        success: false,
        code: err instanceof PaymentError ? err.code : 'PAYMENT_RECOVERY_UNAVAILABLE',
      });
    }
  });

  // Finish a captured-but-unfinalized payment after stock/coupon is corrected.
  app.post('/api/v1/admin/payments/:id/resolve-review', authenticate, staff(['super_admin','admin']), stepUp, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const data = await service.resolveReview(req.params.id);
      await auditLog?.(req, 'PAYMENT_REVIEW_RESOLVE', { table: 'payments', id: req.params.id, after: data });
      res.json({ success: true, message: '결제 확인 대기 항목을 정리했습니다.', data });
    } catch (err) {
      res.status(err instanceof PaymentError ? err.status : 503).json({
        success: false,
        code: err instanceof PaymentError ? err.code : 'PAYMENT_REVIEW_UNAVAILABLE',
        message: err instanceof PaymentError ? err.code : 'PAYMENT_REVIEW_UNAVAILABLE',
      });
    }
  });

  app.post('/api/v1/payments/toss/confirm', authenticate, limiter, run(req => service.confirm(req.body || {}, req.locals.session.user_id)));
  app.post('/api/v1/admin/payments/:id/refunds', authenticate, staff(['super_admin','admin']), stepUp,
    run(req => service.refund({ actorId: req.locals.session.user_id, orderId: req.params.id, reason: req.body?.reason, amount: req.body?.amount, operationId: req.get('Idempotency-Key') })));
  // Webhook is reconciliation-only (payload re-verified against the PG via
  // retrieve; unknown keys fail closed) but each hit costs a PG call. It uses a
  // dedicated limiter so Toss retries are not throttled by customer traffic.
  // Every production deployment must set TOSS_WEBHOOK_SECRET; without it the
  // endpoint is disabled (a missing secret is a misconfiguration, not a
  // silent downgrade to an unauthenticated public endpoint).
  app.post('/api/v1/payments/toss/webhook', webhookLimiter || limiter, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const expected = process.env.TOSS_WEBHOOK_SECRET;
      if (!expected) {
        if (process.env.NODE_ENV === 'production') {
          res.status(503).json({ success: false, code: 'WEBHOOK_NOT_CONFIGURED' });
          return;
        }
      } else if (req.get('x-webhook-secret') !== expected) {
        res.status(401).json({ success: false, code: 'WEBHOOK_UNAUTHORIZED' });
        return;
      }
      res.json({ success: true, data: await service.webhook(req.body || {}) });
    } catch (err) {
      res.status(err instanceof PaymentError ? err.status : 503).json({ success: false, code: err instanceof PaymentError ? err.code : 'PAYMENTS_UNAVAILABLE' });
    }
  });
}
