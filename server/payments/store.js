// The database functions in supabase/migrations/202610010001_toss_payment_store.sql
// own every state transition. Never replace them with separate JS updates.
const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export function createPaymentStore({ database }) {
  const db = () => database();
  const action = (name, input = {}) => db().rpc('pg_payment_action', { p_action: name, p_input: input }).then(unwrap);

  async function readOrder(orderId, userId, admin = false) {
    let query = db().from('orders').select('id,user_id,order_number,status,amount,expires_at,created_at').eq(admin ? 'id' : 'order_number', orderId);
    if (!admin) query = query.eq('user_id', userId);
    const order = unwrap(await query.maybeSingle());
    if (!order) return null;
    const payment = unwrap(await db().from('payments').select('payment_key,status,balance_amount,recovery_required,provider_status').eq('order_id', order.id).maybeSingle());
    const pending = order.status === 'pending_payment' && new Date(order.expires_at).getTime() > Date.now();
    return {
      orderId: order.order_number, amount: order.amount, currency: 'KRW', status: order.status,
      orderName: 'NOEUL 주문', customerKey: `customer_${order.user_id}`,
      paymentKey: payment?.payment_key || null,
      balanceAmount: payment?.balance_amount ?? 0,
      isPartialCancelable: true,
      recoveryRequired: Boolean(payment?.recovery_required),
      canResume: pending && !payment?.recovery_required && (!payment || payment.status === 'prepared'),
    };
  }

  return {
    async checkReady() {
      try { return unwrap(await db().rpc('pg_payment_health')) === true; }
      catch { return false; }
    },
    readOrder: (orderId, userId) => readOrder(orderId, userId),
    readAdminPayment: orderId => readOrder(orderId, null, true),
    prepareAttempt: order => action('prepare', { orderId: order.orderId }),
    claimConfirmation: input => action('claim_confirm', input),
    completeConfirmation: (input, payment) => action('complete_confirm', { ...input, payment }),
    claimRefund: input => action('claim_refund', input),
    completeRefund: (input, payment) => action('complete_refund', { ...input, payment }),
    async readPayment(paymentKey) {
      const payment = unwrap(await db().from('payments').select('payment_key,order_id').eq('payment_key', paymentKey).maybeSingle());
      if (!payment) return null;
      const order = unwrap(await db().from('orders').select('order_number,amount').eq('id', payment.order_id).maybeSingle());
      return order ? { orderId: order.order_number, amount: order.amount, paymentKey } : null;
    },
    reconcile: payment => action('reconcile', { payment }),
    claimRecoveryBatch: ({ limit, now, leaseMs }) => action('claim_recovery', { limit, now, leaseMs }),
    deferRecovery: input => action('defer_recovery', input),
  };
}
