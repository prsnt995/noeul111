import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

// Shared service-role client for background workers. Uses the secret key
// when present (server-only); falls back to the publishable key for
// constrained environments. Never import this from browser code.
export function getAdminClient() {
  const env = process.env;
  if (!env.SUPABASE_URL) return null;
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const newLeaseToken = () => randomUUID();

// Best-effort ops alert (Phase 6.4). No-op when no webhook is configured;
// never throws into worker loops.
export async function alertOps(event, details) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'noeul', event, details: details || {}, at: new Date().toISOString() }),
    });
  } catch { /* eslint-disable-line no-empty */ }
}
