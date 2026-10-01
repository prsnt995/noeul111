// 테스트 전용. 서버 운영 어댑터로 가져오지 마세요. 외부 통신/실결제 없음.
import { createPaymentService, PaymentError } from '../../server/payments/toss.js';
export function createLab(scenario = 'normal') {
  const order = { orderId:'lab_order_001', amount:10000, currency:'KRW', customerKey:'lab_customer_001', status:'pending_payment', canResume:true, recoveryRequired:false, balanceAmount:0 };
  let provider = null;
  let confirmClaim = false;
  let pendingRefund = null;
  const refunds = new Map();
  const counters = { confirm:0, cancel:0, reconcile:0 };
  const apply = p => {
    order.paymentKey = p.paymentKey; order.balanceAmount = p.balanceAmount;
    order.status = p.status === 'DONE' ? 'paid'
      : ['CANCELED','PARTIAL_CANCELED'].includes(p.status) && p.balanceAmount === 0 ? 'refunded' : 'partially_refunded';
    order.canResume = false; order.recoveryRequired = false;
  };
  const store = {
    readOrder: async (_id, user) => _id === order.orderId && user === 'lab-user' ? { ...order } : null,
    readAdminPayment: async id => id === 'lab-uuid' ? { ...order } : null,
    prepareAttempt: async () => { if (!order.canResume || order.recoveryRequired) throw new PaymentError('BUSY',409); },
    claimConfirmation: async input => {
      if (order.status === 'paid' && order.paymentKey === input.paymentKey) return { state:'paid' };
      if (confirmClaim) return { state:'busy' };
      confirmClaim = true; order.paymentKey = input.paymentKey; order.recoveryRequired = true; order.canResume = false;
      return { state:'claimed' };
    },
    completeConfirmation: async (_input, p) => { if (scenario === 'db-failure') throw new Error('DB unavailable'); apply(p); },
    claimRefund: async input => {
      const old = refunds.get(input.operationId);
      if (old && (old.amount !== input.amount || old.reason !== input.reason)) throw new PaymentError('IDEMPOTENCY_CONFLICT',409);
      if (old?.result) return { state:'completed',result:old.result };
      if (pendingRefund || order.recoveryRequired) return { state:'busy' };
      if (input.amount > order.balanceAmount) throw new PaymentError('REFUND_EXCEEDS_BALANCE',409);
      refunds.set(input.operationId, input); pendingRefund = input; order.recoveryRequired = true;
      return { state:'claimed', orderId:order.orderId, paymentKey:order.paymentKey, amount:input.amount, originalAmount:order.amount, balanceBefore:order.balanceAmount };
    },
    completeRefund: async (input,p) => {
      apply(p); refunds.set(input.operationId,{...input,result:{status:p.status,balanceAmount:p.balanceAmount}}); pendingRefund = null;
    },
    readPayment: async key => key === order.paymentKey ? {...order} : null,
    reconcile: async p => {
      counters.reconcile++; apply(p);
      if (pendingRefund && p.lastTransactionKey === pendingRefund.operationId) await store.completeRefund(pendingRefund,p);
      else if (pendingRefund) order.recoveryRequired = true;
    },
    claimRecoveryBatch: async () => order.recoveryRequired ? [{id:'lab-job',orderId:'lab-uuid',leaseToken:'lab-lease',attempts:0}] : [],
    deferRecovery: async () => {},
  };
  const client = {
    confirm: async input => {
      counters.confirm++; provider = { ...input,totalAmount:input.amount,currency:'KRW',balanceAmount:input.amount,status:'DONE' };
      if (scenario === 'timeout') throw new Error('response lost');
      return {...provider};
    },
    retrieve: async () => { if (!provider) throw new Error('not found'); return {...provider}; },
    retrieveOrder: async () => { if (!provider) throw new Error('not found'); return {...provider}; },
    cancel: async (_key,reason,amount,operationId) => {
      counters.cancel++; const balanceAmount = provider.balanceAmount - amount;
      // Multiple partial cancellations may retain PARTIAL_CANCELED at zero balance.
      provider = {...provider,balanceAmount,status:'PARTIAL_CANCELED',lastTransactionKey:operationId,
        cancels:[...(provider.cancels || []),{transactionKey:operationId,cancelStatus:'DONE',cancelAmount:amount,refundableAmount:balanceAmount,cancelReason:reason}]};
      if (scenario === 'refund-timeout') throw new Error('response lost');
      return {...provider};
    },
  };
  const service = createPaymentService({env:{TOSS_CLIENT_KEY:scenario === 'disabled' ? '' : 'test_gck_lab',TOSS_SECRET_KEY:scenario === 'disabled' ? '' : 'test_gsk_lab'},store,client});
  return { service,store,client,counters,order };
}
