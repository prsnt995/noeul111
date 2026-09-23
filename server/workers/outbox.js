import { getAdminClient, sleep, newLeaseToken, alertOps } from './client.js';
import { notificationService } from '../services/notificationService.js';

let workerRunning = false;

// Transactional-outbox dispatcher over app.outbox (migration 001).
// Lease protocol: claim with a conditional update on lease_until so two
// workers can never process the same event. Handlers are idempotent by
// effect_key; at-least-once delivery yields one business effect.
const LEASE_MS = 60_000;
const MAX_ATTEMPTS = 5;
const backoffMs = attempts => Math.min(1000 * 2 ** attempts, 300_000);

async function fetchOrder(supabase, orderId) {
  const { data } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
  return data || null;
}

async function dispatch(supabase, event) {
  const payload = typeof event.payload === 'string' ? JSON.parse(event.payload || '{}') : (event.payload || {});
  const order = payload.order_id ? await fetchOrder(supabase, payload.order_id) : null;
  switch (event.kind) {
    case 'ORDER_CREATED':
      if (order) await notificationService.sendOrderConfirmation({ ...order, items: [] });
      break;
    case 'ORDER_CANCELED':
    case 'ORDER_EXPIRED':
      if (order) await notificationService.sendCancellationNotification({ ...order, cancel_reason: event.kind === 'ORDER_EXPIRED' ? '결제 기한 만료' : (order.cancel_reason || '고객 요청') });
      break;
    case 'PAYMENT_CONFIRMED':
      if (order) await notificationService.sendPaymentNotification(order);
      break;
     default: {
        await supabase.from('outbox').update({ dead_at: new Date().toISOString(), last_error: `Unknown outbox kind: ${event.kind}`, lease_until: null, lease_token: null }).eq('id', event.id);
        await alertOps('outbox.dead_letter', { kind: event.kind, effect_key: event.effect_key, error: `Unknown outbox kind: ${event.kind}` });
      }
   }
 }

export async function startOutboxWorker() {
  const supabase = getAdminClient();
  if (!supabase) { console.log('[Outbox] Supabase not configured. Worker skipped.'); return; }
  if (workerRunning) { console.log('[Outbox] Worker already running.'); return; }
  workerRunning = true;
  console.log('[Outbox] Worker started.');

  while (workerRunning) {
    try {
      const now = new Date().toISOString();
      const { data: events } = await supabase
        .from('outbox')
        .select('*')
        .is('done_at', null)
        .is('dead_at', null)
        .lte('available_at', now)
        .or(`lease_until.is.null,lease_until.lt.${now}`)
        .order('available_at', { ascending: true })
        .limit(10);

      if (!events || events.length === 0) { await sleep(5000); continue; }

      for (const event of events) {
        const token = newLeaseToken();
        const leaseUntil = new Date(Date.now() + LEASE_MS).toISOString();
        const { data: claimed } = await supabase
          .from('outbox')
          .update({ lease_until: leaseUntil, lease_token: token })
          .eq('id', event.id)
          .is('done_at', null)
          .or(`lease_until.is.null,lease_until.lt.${now}`)
          .select('id')
          .maybeSingle();

        if (!claimed) continue;

         try {
           await dispatch(supabase, event);
           await supabase.from('outbox').update({ done_at: new Date().toISOString(), last_error: null, lease_until: null, lease_token: null }).eq('id', event.id);
         } catch (err) {
          const attempts = (event.attempts || 0) + 1;
          if (attempts >= MAX_ATTEMPTS) {
            await supabase.from('outbox').update({ dead_at: new Date().toISOString(), last_error: String(err?.message || err) }).eq('id', event.id);
            await alertOps('outbox.dead_letter', { kind: event.kind, effect_key: event.effect_key, error: String(err?.message || err) });
          } else {
            await supabase.from('outbox').update({ attempts, last_error: String(err?.message || err), available_at: new Date(Date.now() + backoffMs(attempts)).toISOString(), lease_until: null, lease_token: null }).eq('id', event.id);
          }
        }
      }
    } catch (err) {
      console.error('[Outbox] Worker error:', err.message);
    }
    await sleep(3000);
  }
}

export function stopOutboxWorker() { workerRunning = false; console.log('[Outbox] Worker stopped.'); }
export { workerRunning };
