import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createPaymentService, createTossClient } from '../server/payments/toss.js';
import { registerPaymentRoutes } from '../server/payments/routes.js';

const input = { orderId: 'order_123', amount: 10000, paymentKey: 'payment_123' };
const payment = { ...input, totalAmount: 10000, currency: 'KRW', status: 'DONE' };
function fixture(overrides = {}) {
  let claimed = false;
  let paid = false;
  const store = {
    prepareAttempt: vi.fn(async () => {}), readAdminPayment: vi.fn(async () => null),
    claimRecoveryBatch: vi.fn(async () => []), deferRecovery: vi.fn(async () => {}),
    readOrder: vi.fn(async (_id, user) => user === 'owner' ? { ...input, status: 'pending_payment', canResume: true, currency: 'KRW', customerKey: 'customer_123' } : null),
    claimConfirmation: vi.fn(async () => { if (paid) return { state: 'paid' }; if (claimed) return { state: 'busy' }; claimed = true; return { state: 'claimed' }; }),
    completeConfirmation: vi.fn(async () => { paid = true; }),
    claimRefund: vi.fn(async () => ({ state: 'claimed', orderId: input.orderId, paymentKey: input.paymentKey, amount: 3000, originalAmount: 10000, balanceBefore: 10000 })),
    completeRefund: vi.fn(async () => {}),
    readPayment: vi.fn(async () => input),
    reconcile: vi.fn(async () => {}), ...overrides,
  };
  const client = { retrieveOrder: vi.fn(async () => payment), confirm: vi.fn(async () => payment), cancel: vi.fn(async () => ({ ...payment, status: 'PARTIAL_CANCELED', balanceAmount: 7000, lastTransactionKey:'cancel-001', cancels:[{transactionKey:'cancel-001',cancelStatus:'DONE',cancelAmount:3000,refundableAmount:7000}] })), retrieve: vi.fn(async () => payment) };
  const env = { TOSS_CLIENT_KEY: 'test_gck_fake', TOSS_SECRET_KEY: 'test_gsk_fake' };
  return { store, client, env, service: createPaymentService({ store, client, env }) };
}
describe('Toss module (mock provider; no actual payments)', () => {
  it('does not enable payments with keys alone or without keys', async () => {
    const { env, store } = fixture();
    expect(createPaymentService({ env, store: null }).configured()).toBe(false);
    const service = createPaymentService({ env: {}, store });
    expect(service.configured()).toBe(false);
    await expect(service.prepare(input.orderId,'owner')).rejects.toThrow('PAYMENTS_NOT_CONFIGURED');
  });
  it('does not enable a mixed test/live widget key pair or individual API keys', () => {
    const { store } = fixture();
    expect(createPaymentService({ env: { TOSS_CLIENT_KEY: 'test_gck_a', TOSS_SECRET_KEY: 'live_gsk_b' }, store }).configured()).toBe(false);
    expect(createPaymentService({ env: { TOSS_CLIENT_KEY: 'test_ck_a', TOSS_SECRET_KEY: 'test_sk_b' }, store }).configured()).toBe(false);
  });
  it('prepares authoritative amount and exposes no server secret', async () => {
    const { service } = fixture();
    const prepared = await service.prepare(input.orderId, 'owner');
    expect(prepared.amount).toBe(10000);
    expect(JSON.stringify(prepared)).not.toContain('test_sk');
  });
  it('rejects another owner or tampered amount before contacting Toss', async () => {
    const { service, client } = fixture();
    await expect(service.confirm(input,'attacker')).rejects.toThrow('ORDER_NOT_FOUND');
    await expect(service.confirm({ ...input, amount: 1 },'owner')).rejects.toThrow('AMOUNT_MISMATCH');
    expect(client.confirm).not.toHaveBeenCalled();
  });
  it('only approves once across concurrent requests and completed replays', async () => {
    const { service, client } = fixture();
    const results = await Promise.allSettled([service.confirm(input,'owner'), service.confirm(input,'owner')]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    await expect(service.confirm(input,'owner')).resolves.toEqual({ orderId: input.orderId, status: 'paid' });
    expect(client.confirm).toHaveBeenCalledTimes(1);
  });
  it('keeps a claimed order frozen after provider timeout', async () => {
    const { service, client, store } = fixture();
    client.confirm.mockRejectedValue(new Error('timeout'));
    await expect(service.confirm(input,'owner')).rejects.toThrow('PAYMENT_RECONCILIATION_REQUIRED');
    await expect(service.confirm(input,'owner')).rejects.toThrow('PAYMENT_RECONCILIATION_REQUIRED');
    expect(client.confirm).toHaveBeenCalledTimes(1);
    expect(store.completeConfirmation).not.toHaveBeenCalled();
  });
  it('does not reapprove after successful charge but failed persistence', async () => {
    const { service, client } = fixture({ completeConfirmation: vi.fn(async () => { throw new Error('db down'); }) });
    await expect(service.confirm(input,'owner')).rejects.toThrow('PAYMENT_RECONCILIATION_REQUIRED');
    await expect(service.confirm(input,'owner')).rejects.toThrow('PAYMENT_RECONCILIATION_REQUIRED');
    expect(client.confirm).toHaveBeenCalledTimes(1);
  });
  it.each([{ ...payment, totalAmount: 1 }, { ...payment, orderId: 'another' }, { ...payment, status: 'WAITING_FOR_DEPOSIT' }])('rejects invalid/unfinished provider result %#', async result => {
    const { service, client, store } = fixture();
    client.confirm.mockResolvedValue(result);
    await expect(service.confirm(input,'owner')).rejects.toThrow('PAYMENT_RECONCILIATION_REQUIRED');
    expect(store.completeConfirmation).not.toHaveBeenCalled();
  });
  it('supports partial refunds and requires stable operation IDs', async () => {
    const { service, client } = fixture();
    await expect(service.refund({ orderId: input.orderId, amount: 3000, reason:'반품' })).rejects.toThrow('INVALID_REFUND');
    await expect(service.refund({ orderId: input.orderId, amount: 3000, reason:'반품', operationId:'refund-001' })).resolves.toEqual({ status:'PARTIAL_CANCELED', balanceAmount:7000 });
    expect(client.cancel).toHaveBeenCalledWith(input.paymentKey,'반품',3000,'refund-001');
  });
  it('uses retrieved state rather than forged webhook status', async () => {
    const { service, store } = fixture();
    await service.webhook({ eventType:'PAYMENT_STATUS_CHANGED', data:{ paymentKey:input.paymentKey, status:'CANCELED', totalAmount:1 } });
    expect(store.reconcile).toHaveBeenCalledWith(payment);
  });
  it('retries failed webhook persistence instead of acknowledging success', async () => {
    const { service } = fixture({ reconcile: vi.fn(async () => { throw new Error('DB'); }) });
    const app = express(); app.use(express.json());
    registerPaymentRoutes(app, { service, authenticate:(_q,_s,n)=>n(), staff:()=> (_q,_s,n)=>n(), stepUp:(_q,_s,n)=>n(), limiter:(_q,_s,n)=>n() });
    await request(app).post('/api/v1/payments/toss/webhook').send({ eventType:'PAYMENT_STATUS_CHANGED', data:{paymentKey:input.paymentKey} }).expect(503);
  });
  it('does not contact Toss for an unknown webhook payment', async () => {
    const { service, client } = fixture({ readPayment: vi.fn(async () => null) });
    await expect(service.webhook({ eventType:'PAYMENT_STATUS_CHANGED', data:{ paymentKey:'unknown' } })).rejects.toThrow('PAYMENT_RECONCILIATION_REQUIRED');
    expect(client.retrieve).not.toHaveBeenCalled();
  });
  it('does not persist a failed or mismatched refund', async () => {
    const { service, client, store } = fixture();
    client.cancel.mockResolvedValue({ ...payment, status:'PARTIAL_CANCELED', balanceAmount:1 });
    await expect(service.refund({ orderId:input.orderId, amount:3000, reason:'반품', operationId:'refund-002' })).rejects.toThrow('PAYMENT_RECONCILIATION_REQUIRED');
    expect(store.completeRefund).not.toHaveBeenCalled();
  });
  it.each(['PENDING', 'FAILED'])('does not complete a refund with cancelStatus %s', async cancelStatus => {
    const { service, client, store } = fixture();
    client.cancel.mockResolvedValue({ ...payment, status:'PARTIAL_CANCELED',balanceAmount:7000,lastTransactionKey:'cancel-001',cancels:[{transactionKey:'cancel-001',cancelStatus,cancelAmount:3000,refundableAmount:7000}] });
    await expect(service.refund({orderId:input.orderId,amount:3000,reason:'반품',operationId:'refund-001'})).rejects.toThrow('PAYMENT_RECONCILIATION_REQUIRED');
    expect(store.completeRefund).not.toHaveBeenCalled();
  });
  it('does not contact provider for a disallowed partial cancellation', async () => {
    const {service,client} = fixture({claimRefund:vi.fn(async()=>({state:'claimed',amount:3000,balanceBefore:10000,isPartialCancelable:false}))});
    await expect(service.refund({orderId:input.orderId,amount:3000,reason:'반품',operationId:'refund-001'})).rejects.toThrow();
    expect(client.cancel).not.toHaveBeenCalled();
  });
  it('replays a completed refund without contacting provider again', async () => {
    const result = { status:'PARTIAL_CANCELED', balanceAmount:7000 };
    const { service, client } = fixture({ claimRefund:vi.fn(async () => ({ state:'completed', result })) });
    await expect(service.refund({ orderId:input.orderId, amount:3000, reason:'반품', operationId:'refund-002' })).resolves.toEqual(result);
    expect(client.cancel).not.toHaveBeenCalled();
  });
  it('enforces refund authentication, staff role and step-up before service call', async () => {
    const { service } = fixture();
    const refund = vi.spyOn(service,'refund');
    const app = express(); app.use(express.json());
    registerPaymentRoutes(app, { service,
      authenticate:(req,res,next) => req.get('X-Test-User') ? next() : res.sendStatus(401),
      staff:roles => (req,res,next) => roles.includes(req.get('X-Test-Role')) ? next() : res.sendStatus(403),
      stepUp:(req,res,next) => req.get('X-Test-MFA') === 'aal2' ? next() : res.sendStatus(403),
      limiter:(_q,_s,n) => n(),
    });
    await request(app).post('/api/v1/admin/payments/order_123/refunds').send({}).expect(401);
    await request(app).post('/api/v1/admin/payments/order_123/refunds').set('X-Test-User','owner').send({}).expect(403);
    await request(app).post('/api/v1/admin/payments/order_123/refunds').set('X-Test-User','owner').set('X-Test-Role','admin').send({}).expect(403);
    expect(refund).not.toHaveBeenCalled();
  });
  it('recovers a charge after browser exit without repeating confirmation', async () => {
    const { service, store, client } = fixture();
    store.readOrder.mockResolvedValueOnce({ ...input, recoveryRequired:true })
      .mockResolvedValueOnce({ ...input, status:'paid', recoveryRequired:false, balanceAmount:10000 });
    expect(await service.recover(input.orderId, 'owner')).toEqual({ orderId:input.orderId, status:'paid', balanceAmount:10000, isPartialCancelable:true, recoveryRequired:false, canResume:false });
    expect(store.reconcile).toHaveBeenCalledWith(payment);
    expect(client.confirm).not.toHaveBeenCalled();
  });
  it('can look up a persisted preparation by order ID when callback never arrived', async () => {
    const { service, store, client } = fixture();
    store.readOrder.mockResolvedValue({ orderId:input.orderId, amount:10000, recoveryRequired:true });
    await service.recover(input.orderId,'owner');
    expect(client.retrieveOrder).toHaveBeenCalledWith(input.orderId);
    expect(client.confirm).not.toHaveBeenCalled();
  });
  it('does not release an unresolved lookup or an in-progress payment', async () => {
    const { service, store, client } = fixture();
    store.readOrder.mockResolvedValue({ ...input, recoveryRequired:true });
    client.retrieve.mockRejectedValueOnce(new Error('404'));
    await expect(service.recover(input.orderId,'owner')).rejects.toThrow('404');
    client.retrieve.mockResolvedValue({ ...payment, status:'IN_PROGRESS' });
    await expect(service.recover(input.orderId,'owner')).rejects.toThrow('PAYMENT_RECONCILIATION_REQUIRED');
    expect(store.reconcile).not.toHaveBeenCalled();
  });
  it('does not expose or recover another owner order', async () => {
    const { service, client } = fixture();
    await expect(service.recover(input.orderId,'attacker')).rejects.toThrow('ORDER_NOT_FOUND');
    expect(client.retrieve).not.toHaveBeenCalled();
  });
  it('never prepares an uncertain payment even when its order status is pending', async () => {
    const { service, store } = fixture();
    store.readOrder.mockResolvedValue({ ...input, status:'pending_payment', canResume:true, recoveryRequired:true });
    await expect(service.prepare(input.orderId,'owner')).rejects.toThrow('ORDER_STATE_INVALID');
    expect(store.prepareAttempt).not.toHaveBeenCalled();
  });
  it('puts idempotency and Basic authentication in HTTP headers', async () => {
    const fetchImpl = vi.fn(async () => ({ ok:true, json:async () => payment }));
    const client = createTossClient({ secretKey:'fake-secret', fetchImpl });
    await client.confirm(input);
    await client.cancel(input.paymentKey,'반품',3000,'refund-001');
    const options = fetchImpl.mock.calls[1][1];
    expect(options.headers.Authorization).toBe(`Basic ${Buffer.from('fake-secret:').toString('base64')}`);
    expect(options.headers['Idempotency-Key']).toMatch(/^refund-/);
    expect(JSON.parse(options.body)).toEqual({ cancelReason:'반품', cancelAmount:3000 });
  });
});
