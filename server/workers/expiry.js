import { getAdminClient, sleep, alertOps } from './client.js';

let workerRunning = false;
const INTERVAL_MS = Number(process.env.EXPIRY_INTERVAL_MS || 60_000);

// 만료는 원자적 RPC로만 처리합니다. 실패 시 상태를 바꾸지 않고 재시도합니다.
async function sweepExpired(supabase, now) {
  const { data: candidates } = await supabase
    .from('orders')
    .select('id,coupon_code')
    .eq('status', 'pending_payment')
    .lt('expires_at', now)
    .limit(50);
  for (const row of (candidates || [])) {
    // TODO(INTEGRATOR): release_hold는 활성 PG 시도/환불 잠금도 함께 확인해야 합니다.
    try {
      const { data, error } = await supabase.rpc('release_hold', { p_order_id: row.id, p_from: ['pending_payment'], p_to: 'expired', p_effect_key: `order-expired:${row.id}`, p_kind: 'ORDER_EXPIRED' });
      if (error || !['released', 'already', 'invalid'].includes(data?.outcome)) throw new Error('RELEASE_FAILED');
    } catch {
      await alertOps('expiry.release_failed', { order_id: row.id });
    }
  }
}

// 결제 복구는 server/payments/recovery.js에서 처리합니다.

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
    } catch (err) {
      console.error('[Expiry] Worker error:', err.message);
    }
    await sleep(INTERVAL_MS);
  }
}

export function stopExpiryWorker() { workerRunning = false; console.log('[Expiry] Worker stopped.'); }
export { workerRunning as expiryRunning };
