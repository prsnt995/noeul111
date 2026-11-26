import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPaymentService } from '../server/payments/toss.js';
import { runPaymentRecoveryBatch } from '../server/payments/recovery.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

function serviceFixture() {
  let reconciled = false;
  const reconcile = vi.fn(async () => { reconciled = true; });
  const store = {
    readOrder: async () => null,
    readAdminPayment: async () => ({
      orderId: 'NOEUL-1', amount: 10000, paymentKey: 'pk_test',
      status: reconciled ? 'paid' : 'confirming',
      balanceAmount: reconciled ? 10000 : 0,
      recoveryRequired: !reconciled, canResume: false,
    }),
    prepareAttempt: async () => {},
    claimConfirmation: async () => ({ state: 'busy' }),
    completeConfirmation: async () => {},
    claimRefund: async () => ({ state: 'busy' }),
    completeRefund: async () => {},
    readPayment: async () => null,
    reconcile,
    claimRecoveryBatch: async () => [],
    deferRecovery: async () => {},
    listStalePayments: async () => [{ order_id: 'order-uuid-1' }],
    paymentHealth: async () => ({ confirmingStale: 1, recoveryRequired: 1, needsReview: 0 }),
  };
  const client = {
    confirm: async () => ({}),
    retrieveOrder: async () => ({}),
    retrieve: async () => ({
      orderId: 'NOEUL-1', paymentKey: 'pk_test', totalAmount: 10000,
      currency: 'KRW', status: 'DONE', balanceAmount: 10000,
    }),
    cancel: async () => ({}),
  };
  const service = createPaymentService({
    env: { TOSS_CLIENT_KEY: 'test_gck_lab', TOSS_SECRET_KEY: 'test_gsk_lab' },
    store,
    client,
  });
  return { service, store, reconcile };
}

describe('captured payment review flow', () => {
  it('reconciles stale rows by re-querying the PG only', async () => {
    const { service, reconcile } = serviceFixture();
    const result = await service.reconcileStale({ limit: 5, olderThanMinutes: 5 });
    expect(result).toMatchObject({ scanned: 1, recovered: 1, pending: 0 });
    expect(reconcile).toHaveBeenCalledTimes(1);
  });

  it('maps a blocked review resolution to a 409 PaymentError', async () => {
    const service = createPaymentService({
      env: { TOSS_CLIENT_KEY: 'test_gck_lab', TOSS_SECRET_KEY: 'test_gsk_lab' },
      store: { resolveReview: async () => ({ ok: false, reason: 'INVENTORY_MISMATCH' }) },
      client: {
        confirm: async () => ({}),
        retrieveOrder: async () => ({}),
        retrieve: async () => ({}),
        cancel: async () => ({}),
      },
    });
    await expect(service.resolveReview('order-uuid-1')).rejects.toMatchObject({
      code: 'INVENTORY_MISMATCH', status: 409,
    });
  });

  it('passes a bounded batch size to the recovery claim', async () => {
    const claimRecoveryBatch = vi.fn(async () => []);
    await runPaymentRecoveryBatch({
      service: { configured: () => true },
      store: { claimRecoveryBatch, deferRecovery: async () => {} },
      limit: 7,
    });
    expect(claimRecoveryBatch).toHaveBeenCalledWith(expect.objectContaining({ limit: 7 }));
  });
});

describe('payment review migration contracts', () => {
  const sql = read('supabase/migrations/202611250002_payment_review_flow.sql');

  it('adds a review reason and the resolve action', () => {
    expect(sql.includes('add column if not exists review_reason')).toBe(true);
    expect(sql.includes("p_action = 'resolve_review'")).toBe(true);
    expect(sql.includes("'PAYMENT_NEEDS_REVIEW'")).toBe(true);
    expect(sql.includes('needs_review=true')).toBe(true);
  });

  it('records captured money before finalization instead of raising', () => {
    expect(sql.includes("raise exception 'PAYMENT_INVENTORY_MISMATCH'")).toBe(false);
    expect(sql.includes("raise exception 'PAYMENT_COUPON_MISMATCH'")).toBe(false);
    expect(sql.includes("v_reason := case")).toBe(true);
    expect(sql.includes("return jsonb_build_object('ok',true,'needsReview',true,'reason',v_reason)")).toBe(true);
  });

  it('releases a terminal non-captured attempt instead of leaving it confirming', () => {
    expect(sql.includes("v_provider->>'status' in ('ABORTED','EXPIRED','CANCELED')")).toBe(true);
    expect(sql.includes("set status='failed'")).toBe(true);
  });

  it('routes the review event to an ops alert instead of the dead-letter path', () => {
    expect(read('server/workers/outbox.js').includes("case 'PAYMENT_NEEDS_REVIEW'")).toBe(true);
    expect(read('server/workers/outbox.js').includes("alertOps('payment.needs_review'")).toBe(true);
  });

  it('is idempotent for a retried captured confirmation', () => {
    expect(sql.includes("'needsReview',v_payment.needs_review,'reason',v_payment.review_reason")).toBe(true);
  });
});

describe('admin payment actionability contracts', () => {
  const api = read('api/admin.js');
  const routes = read('server/payments/routes.js');
  const store = read('server/payments/store.js');
  const orders = read('src/pages/admin/AdminOrdersPage.jsx');
  const dashboard = read('src/pages/admin/AdminDashboardPage.jsx');

  it('projects needs_review and the reason into admin orders', () => {
    expect(api.includes('payment_needs_review: !!pay?.needs_review')).toBe(true);
    expect(api.includes('payment_review_reason: pay?.review_reason || null')).toBe(true);
    expect(api.includes("payment_status === 'needs_review'")).toBe(true);
  });

  it('exposes health, stale reconcile and review resolution endpoints', () => {
    expect(routes.includes("'/api/v1/admin/payments/health'")).toBe(true);
    expect(routes.includes("'/api/v1/admin/payments/reconcile-stale'")).toBe(true);
    expect(routes.includes("'/api/v1/admin/payments/:id/resolve-review'")).toBe(true);
    expect(routes.includes('PAYMENT_RECONCILE_STALE')).toBe(true);
    expect(store.includes('listStalePayments')).toBe(true);
    expect(store.includes('paymentHealth')).toBe(true);
    expect(store.includes("action('resolve_review'")).toBe(true);
  });

  it('makes stuck rows actionable in the orders UI', () => {
    expect(orders.includes('PG 결제 상태 확인')).toBe(true);
    expect(orders.includes('payment_needs_review')).toBe(true);
    expect(orders.includes('/resolve-review')).toBe(true);
    expect(orders.includes('disabled={locked}')).toBe(true);
    expect(orders.includes('PG 결제 확인 중에는 상태를 바꿀 수 없습니다')).toBe(true);
  });

  it('surfaces review/config alerts and a bounded repair action on the dashboard', () => {
    expect(dashboard.includes('alerts.needsReview')).toBe(true);
    expect(dashboard.includes('/admin/payments/reconcile-stale')).toBe(true);
    expect(dashboard.includes('paymentConfigWarning')).toBe(true);
    expect(dashboard.includes('TOSS_WEBHOOK_SECRET')).toBe(true);
    expect(dashboard.includes('PAYMENTS_CRON_SECRET')).toBe(true);
  });
});
