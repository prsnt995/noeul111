import { getAdminClient, sleep, alertOps } from './client.js';

let workerRunning = false;
const INTERVAL_MS = Number(process.env.EXPIRY_INTERVAL_MS || 60_000);
const CONFIRMING_STUCK_MS = Number(process.env.CONFIRMING_STUCK_MS || 20 * 60_000);

// Reservation-expiry sweeper (Phase 5.1) + stuck-confirm reconciliation.
// Every state change is a conditional claim, so concurrent sweepers and the
// payment confirm path can never double-release or resurrect an order.
async function releaseReservations(supabase, order) {
  const { data: items } = await supabase.from('order_items').select('variant_id,quantity').eq('order_id', order.id);
  for (const item of (items || [])) {
    const { data: pv } = await supabase.from('product_variants').select('reserved').eq('id', item.variant_id).maybeSingle();
    if (pv && (pv.reserved || 0) >= item.quantity) {
      await supabase.from('product_variants').update({ reserved: pv.reserved - item.quantity }).eq('id', item.variant_id);
    }
  }
  if (order.coupon_code) {
    const { data: cRow } = await supabase.from('coupons').select('reserved').eq('code', order.coupon_code).maybeSingle();
    if (cRow && (cRow.reserved || 0) > 0) {
      await supabase.from('coupons').update({ reserved: cRow.reserved - 1 }).eq('code', order.coupon_code);
    }
  }
}

async function sweepExpired(supabase, now) {
  const { data: candidates } = await supabase
    .from('orders')
    .select('id,coupon_code')
    .eq('status', 'pending_payment')
    .lt('expires_at', now)
    .limit(50);
  for (const row of (candidates || [])) {
    /* Wave 2: atomic RPC first; JS claim path below is fallback. */
    try {
      const { data: rel, error: relErr } = await supabase.rpc('release_hold', { p_order_id: row.id, p_from: ['pending_payment'], p_to: 'expired', p_effect_key: `order-expired:${row.id}`, p_kind: 'ORDER_EXPIRED' });
      if (!relErr && rel && (rel.outcome === 'released' || rel.outcome === 'already')) continue;
    } catch { /* RPC unavailable; JS path below */ }
    const { data: claimed } = await supabase
      .from('orders')
      .update({ status: 'expired' })
      .eq('id', row.id)
      .eq('status', 'pending_payment')
      .select('id,coupon_code')
      .maybeSingle();
    if (!claimed) continue;
    try {
      await releaseReservations(supabase, claimed);
      await supabase.from('outbox').insert({ effect_key: `order-expired:${claimed.id}`, kind: 'ORDER_EXPIRED', payload: { order_id: claimed.id } });
    } catch (err) {
      await alertOps('expiry.release_failed', { order_id: claimed.id, error: String(err?.message || err) });
    }
  }
}

// Orders stuck in confirming (e.g. confirm crashed after the Toss call):
// re-query Toss when a payment key exists, otherwise revert to pending so
// the customer can retry. Runs only when live payments are enabled.
async function reconcileConfirming(supabase) {
  if (process.env.PAYMENTS_ENABLED !== 'true' || !process.env.TOSS_SECRET_KEY) return;
  const { data: stuck } = await supabase
    .from('orders')
    .select('id,order_number')
    .eq('status', 'confirming')
    .lt('created_at', new Date(Date.now() - CONFIRMING_STUCK_MS).toISOString())
    .limit(20);
  for (const order of (stuck || [])) {
    try {
      const { data: payment } = await supabase.from('payments').select('payment_key,status').eq('order_id', order.id).maybeSingle();
      if (payment?.payment_key) {
        const res = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(payment.payment_key)}`, {
          headers: { Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')}` },
        });
        const state = await res.json().catch(() => ({}));
        if (res.ok && String(state.status || '').toUpperCase() === 'DONE') {
          await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id).eq('status', 'confirming');
          await supabase.from('outbox').insert({ effect_key: `payment-reconciled:${order.id}`, kind: 'PAYMENT_CONFIRMED', payload: { order_id: order.id, status: 'paid', reconciled: true } });
          continue;
        }
      }
      await supabase.from('orders').update({ status: 'pending_payment' }).eq('id', order.id).eq('status', 'confirming');
    } catch (err) {
      await alertOps('reconcile.failed', { order_id: order.id, error: String(err?.message || err) });
    }
  }
}

export async function startExpiryWorker() {
  const supabase = getAdminClient();
  if (!supabase) { console.log('[Expiry] Supabase not configured. Worker skipped.'); return; }
  if (workerRunning) { console.log('[Expiry] Worker already running.'); return; }
  workerRunning = true;
  console.log('[Expiry] Worker started.');
  while (workerRunning) {
    try {
      const now = new Date().toISOString();
      await sweepExpired(supabase, now);
      await reconcileConfirming(supabase);
    } catch (err) {
      console.error('[Expiry] Worker error:', err.message);
    }
    await sleep(INTERVAL_MS);
  }
}

export function stopExpiryWorker() { workerRunning = false; console.log('[Expiry] Worker stopped.'); }
export { workerRunning as expiryRunning };
