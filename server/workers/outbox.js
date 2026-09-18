import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

let workerRunning = false;

const getWorker = () => {
  const env = process.env;
  if (!env.SUPABASE_URL) return null;
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function startOutboxWorker() {
  const supabase = getWorker();
  if (!supabase) { console.log('[Outbox] Supabase not configured. Worker skipped.'); return; }
  if (workerRunning) { console.log('[Outbox] Worker already running.'); return; }
  workerRunning = true;
  console.log('[Outbox] Worker started.');

  while (workerRunning) {
    try {
      const { data: events } = await supabase
        .from('outbox_events')
        .select('*')
        .eq('processed', false)
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(10);

      if (!events || events.length === 0) { await sleep(5000); continue; }

      for (const event of events) {
        const lockId = `${event.id}:${randomBytes(8).toString('hex')}`;
        const { data: locked } = await supabase
          .from('outbox_events')
          .update({ status: 'processing', locked_at: new Date().toISOString(), lock_id: lockId })
          .eq('id', event.id)
          .eq('status', 'queued')
          .select()
          .maybeSingle();

        if (!locked) { await sleep(1000); continue; }

        try {
          await processEvent(locked);
          await supabase.from('outbox_events').update({ status: 'delivered', processed_at: new Date().toISOString() }).eq('id', event.id);
        } catch (err) {
          const retries = (event.retry_count || 0) + 1;
          if (retries >= 5) {
            await supabase.from('outbox_events').update({ status: 'failed', retry_count: retries, error: err.message }).eq('id', event.id);
          } else {
            const backoff = Math.min(1000 * Math.pow(2, retries), 300000);
            await supabase.from('outbox_events').update({ status: 'retrying', retry_count: retries, next_try_at: new Date(Date.now() + backoff).toISOString() }).eq('id', event.id);
          }
        }
      }
    } catch (err) {
      console.error('[Outbox] Worker error:', err.message);
    }
    await sleep(3000);
  }
}

async function processEvent(event) {
  const payload = JSON.parse(event.payload || '{}');
  console.log(`[Outbox] Processing ${event.kind} for ${payload.order_id || event.id}`);
}

export function stopOutboxWorker() { workerRunning = false; console.log('[Outbox] Worker stopped.'); }
export { workerRunning };
