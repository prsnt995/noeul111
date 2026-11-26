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

  const count = query => query.then(result => result?.count || 0, () => 0);
  const STALE_CONFIRMING_MINUTES = 5;

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
    resolveReview: orderId => action('resolve_review', { orderId }),
    // Bounded read used by the admin "stale payment" repair. A payment can be
    // stuck in `confirming` (capture response lost) or due for recovery; both
    // are returned once and de-duplicated by order id.
    async listStalePayments({ limit = 10, olderThanMinutes = STALE_CONFIRMING_MINUTES } = {}) {
      const capped = Math.min(Math.max(Number(limit) || 1, 1), 20);
      const minutes = Math.min(Math.max(Number(olderThanMinutes) || STALE_CONFIRMING_MINUTES, 1), 1440);
      const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      const due = new Date().toISOString();
      const [stale, recovery, unscheduled] = await Promise.all([
        db().from('payments').select('order_id,updated_at')
          .eq('status', 'confirming').lt('updated_at', cutoff)
          .order('updated_at').limit(capped).then(r => r, () => ({ data: [] })),
        db().from('payments').select('order_id,updated_at')
          .eq('recovery_required', true).lte('next_recovery_at', due)
          .order('next_recovery_at').limit(capped).then(r => r, () => ({ data: [] })),
        db().from('payments').select('order_id,updated_at')
          .eq('recovery_required', true).is('next_recovery_at', null)
          .order('updated_at').limit(capped).then(r => r, () => ({ data: [] })),
      ]);
      const seen = new Map();
      for (const row of [...(stale.data || []), ...(recovery.data || []), ...(unscheduled.data || [])]) {
        if (row?.order_id) seen.set(row.order_id, row);
      }
      return [...seen.values()].slice(0, capped);
    },
    async paymentHealth() {
      const cutoff = new Date(Date.now() - STALE_CONFIRMING_MINUTES * 60 * 1000).toISOString();
      const [confirmingStale, recoveryRequired, needsReview] = await Promise.all([
        count(db().from('payments').select('order_id', { count: 'exact', head: true })
          .eq('status', 'confirming').lt('updated_at', cutoff)),
        count(db().from('payments').select('order_id', { count: 'exact', head: true })
          .eq('recovery_required', true)),
        count(db().from('payments').select('order_id', { count: 'exact', head: true })
          .eq('needs_review', true)),
      ]);
      return { confirmingStale, recoveryRequired, needsReview };
    },
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
