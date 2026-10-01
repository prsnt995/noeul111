import { createHash } from 'node:crypto';

// 공식 API 계약: https://docs.tosspayments.com/reference
// 키나 DB 구현, 가짜 결제 성공을 내장하지 않습니다.
export class PaymentError extends Error {
  constructor(code, status = 503) { super(code); this.code = code; this.status = status; }
}
const fail = (code, status) => { throw new PaymentError(code, status); };
const id = value => typeof value === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(value);
const key = value => typeof value === 'string' && value.length > 0 && value.length <= 200;
const money = value => Number.isSafeInteger(value) && value > 0;
const digest = value => createHash('sha256').update(value).digest('hex');

export function createTossClient({ secretKey, fetchImpl = fetch, timeoutMs = 65000 }) {
  async function call(path, body, idempotencyKey) {
    if (!secretKey) fail('PAYMENTS_NOT_CONFIGURED');
    const controller = new globalThis.AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`https://api.tosspayments.com/v1/payments${path}`, {
        method: body ? 'POST' : 'GET', signal: controller.signal,
        headers: { Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json', ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const result = await response.json();
      // 오류·시간 초과만으로 실제 청구되지 않았다고 판단할 수 없습니다.
      if (!response.ok) fail('PAYMENT_RECONCILIATION_REQUIRED');
      return result;
    } catch { fail('PAYMENT_RECONCILIATION_REQUIRED'); }
    finally { clearTimeout(timeout); }
  }
  return {
    confirm: input => call('/confirm', input, `confirm-${digest(input.orderId)}`),
    retrieveOrder: orderId => call(`/orders/${encodeURIComponent(orderId)}`),
    retrieve: paymentKey => call(`/${encodeURIComponent(paymentKey)}`),
    cancel: (paymentKey, reason, amount, operationId) => call(`/${encodeURIComponent(paymentKey)}/cancel`,
      { cancelReason: reason, cancelAmount: amount }, `refund-${digest(operationId)}`),
  };
}

// Every external call follows a durable claim; ambiguous responses keep the DB lock.
export function createPaymentService({ env, store, client = createTossClient({ secretKey: env.TOSS_SECRET_KEY }) }) {
  const required = ['readOrder','claimConfirmation','completeConfirmation','claimRefund','completeRefund','readPayment','reconcile','prepareAttempt','readAdminPayment','claimRecoveryBatch','deferRecovery'];
  const clientMode = /^(test|live)_gck_/.exec(env.TOSS_CLIENT_KEY || '')?.[1];
  const secretMode = /^(test|live)_gsk_/.exec(env.TOSS_SECRET_KEY || '')?.[1];
  const configured = () => Boolean(clientMode && clientMode === secretMode)
    && required.every(name => typeof store?.[name] === 'function');
  const available = async () => configured() && (!store.checkReady || await store.checkReady());
  const ready = async () => { if (!await available()) fail('PAYMENTS_NOT_CONFIGURED'); };
  const verify = (p, expected) => {
    if (!p || p.orderId !== expected.orderId || p.paymentKey !== expected.paymentKey || p.totalAmount !== expected.amount || p.currency !== 'KRW') fail('PAYMENT_RECONCILIATION_REQUIRED');
  };
  return {
    configured,
    available,
    async prepare(orderId, userId) {
      await ready(); if (!id(orderId)) fail('INVALID_ORDER_ID', 400);
      const order = await store.readOrder(orderId, userId);
      if (!order) fail('ORDER_NOT_FOUND', 404);
      if (order.status !== 'pending_payment' || order.recoveryRequired || order.canResume !== true) fail('ORDER_STATE_INVALID', 409);
      if (!money(order.amount) || order.currency !== 'KRW' || order.orderId !== orderId || !key(order.customerKey)) fail('ORDER_NOT_READY', 409);
      await store.prepareAttempt(order);
      return { orderId, amount: order.amount, currency: 'KRW', orderName: String(order.orderName || 'NOEUL 주문').slice(0,100),
        customerKey: order.customerKey, clientKey: env.TOSS_CLIENT_KEY,
        variantKey: env.TOSS_WIDGET_VARIANT_KEY || 'DEFAULT', agreementVariantKey: env.TOSS_AGREEMENT_VARIANT_KEY || 'AGREEMENT' };
    },
    // 조회 실패는 미결제 증거가 아닙니다. 신규 승인/환불 호출 없이 조회만 수행합니다.
    async recover(orderId, userId, admin = false) {
      await ready();
      const known = admin ? await store.readAdminPayment(orderId) : await store.readOrder(orderId, userId);
      if (!known) fail('ORDER_NOT_FOUND', 404);
      if (known.recoveryRequired) {
        const payment = known.paymentKey ? await client.retrieve(known.paymentKey) : await client.retrieveOrder(known.orderId);
        verify(payment, { ...known, paymentKey: known.paymentKey || payment.paymentKey });
        if (!['DONE','CANCELED','PARTIAL_CANCELED','ABORTED','EXPIRED'].includes(payment.status)) fail('PAYMENT_RECONCILIATION_REQUIRED',409);
        await store.reconcile(payment);
      }
      const current = admin ? await store.readAdminPayment(orderId) : await store.readOrder(orderId, userId);
      if (!current) fail('ORDER_NOT_FOUND',404);
      return { orderId: current.orderId, status: current.status, balanceAmount: current.balanceAmount, isPartialCancelable: current.isPartialCancelable !== false,
        recoveryRequired: Boolean(current.recoveryRequired), canResume: current.status === 'pending_payment' && current.canResume === true && !current.recoveryRequired };
    },
    async confirm(input, userId) {
      await ready(); const { orderId, amount, paymentKey } = input;
      if (!id(orderId) || !money(amount) || !key(paymentKey)) fail('INVALID_PAYMENT', 400);
      const order = await store.readOrder(orderId, userId);
      if (!order) fail('ORDER_NOT_FOUND', 404);
      if (order.amount !== amount || order.currency !== 'KRW') fail('AMOUNT_MISMATCH', 400);
      const claim = await store.claimConfirmation({ orderId, amount, paymentKey, userId });
      if (claim?.state === 'paid') return { orderId, status: 'paid' };
      if (claim?.state !== 'claimed') fail('PAYMENT_RECONCILIATION_REQUIRED', 409);
      try {
        const payment = await client.confirm({ orderId, amount, paymentKey });
        verify(payment, { orderId, amount, paymentKey });
        // 가상계좌는 별도 입금·만료 계약 구현 전 비활성화합니다. 입금 대기는 성공이 아닙니다.
        if (payment.status !== 'DONE') fail('PAYMENT_RECONCILIATION_REQUIRED');
        await store.completeConfirmation({ orderId, amount, paymentKey, userId }, payment);
        return { orderId, status: 'paid' };
      } catch { fail('PAYMENT_RECONCILIATION_REQUIRED'); }
    },
    async refund(input) {
      await ready();
      if (!key(input.orderId) || !money(input.amount) || !/^[A-Za-z0-9._:-]{8,200}$/.test(input.operationId || '') || typeof input.reason !== 'string' || !input.reason.trim() || input.reason.length > 200) fail('INVALID_REFUND',400);
      const claim = await store.claimRefund(input);
      if (claim?.state === 'completed') return claim.result;
      if (claim?.state !== 'claimed') fail('PAYMENT_RECONCILIATION_REQUIRED',409);
      try {
        if (claim.isPartialCancelable === false && input.amount !== claim.balanceBefore) fail('FULL_REFUND_ONLY',409);
        if (claim.amount !== input.amount || !money(claim.balanceBefore) || input.amount > claim.balanceBefore) fail('PAYMENT_RECONCILIATION_REQUIRED');
        const payment = await client.cancel(claim.paymentKey, input.reason, input.amount, input.operationId);
        verify(payment, { orderId: claim.orderId, amount: claim.originalAmount, paymentKey: claim.paymentKey });
        if (!['CANCELED','PARTIAL_CANCELED'].includes(payment.status) || payment.balanceAmount !== claim.balanceBefore - input.amount) fail('PAYMENT_RECONCILIATION_REQUIRED');
        const cancel = payment.cancels?.find(item => item.transactionKey === payment.lastTransactionKey);
        if (!cancel || cancel.cancelStatus !== 'DONE' || cancel.cancelAmount !== input.amount || cancel.refundableAmount !== payment.balanceAmount) fail('PAYMENT_RECONCILIATION_REQUIRED');
        await store.completeRefund(input, payment);
        return { status: payment.status, balanceAmount: payment.balanceAmount };
      } catch { fail('PAYMENT_RECONCILIATION_REQUIRED'); }
    },
    async webhook(body) {
      await ready();
      if (body.eventType !== 'PAYMENT_STATUS_CHANGED') return;
      const paymentKey = body.data?.paymentKey;
      if (!key(paymentKey)) fail('INVALID_WEBHOOK',400);
      const known = await store.readPayment(paymentKey);
      // 웹훅 입력의 상태·금액을 믿지 않고 PG에 직접 조회합니다.
      // 모르는 시도나 DB 저장 실패를 성공 응답으로 처리하지 않습니다.
      if (!known) fail('PAYMENT_RECONCILIATION_REQUIRED');
      const payment = await client.retrieve(paymentKey);
      verify(payment, { ...known, paymentKey });
      await store.reconcile(payment);
    },
  };
}
