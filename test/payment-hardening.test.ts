import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Payment hardening', () => {
  it('exposes a secured recovery cron for serverless deployments', () => {
    const app = read('api/app.js');
    expect(app.includes("'/api/v1/cron/payments-recover'")).toBe(true);
    expect(app.includes('runPaymentRecoveryBatch')).toBe(true);
    expect(app.includes('PAYMENTS_CRON_SECRET')).toBe(true);
  });

  it('schedules the recovery cron and allows a serverless-safe timeout', () => {
    const vercel = JSON.parse(read('vercel.json'));
    const cron = (vercel.crons || []).find((c: { path: string }) => c.path === '/api/v1/cron/payments-recover');
    expect(cron).toBeTruthy();
    expect(vercel.functions?.['api/index.js']?.maxDuration).toBe(60);
  });

  it('keeps the Toss HTTP timeout below the serverless max duration', () => {
    const toss = read('server/payments/toss.js');
    const match = /timeoutMs\s*=\s*(\d+)/.exec(toss);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeLessThanOrEqual(60000);
  });

  it('fails closed instead of using the non-atomic order fallback in production', () => {
    const app = read('api/app.js');
    const block = app.slice(app.indexOf("console.warn('[place_order] RPC failed"));
    expect(app.includes('if (production) throw rpcErr;')).toBe(true);
    expect(block.length).toBeGreaterThan(0);
  });

  it('documents widget v2 key formats in the environment template', () => {
    const env = read('.env.example');
    expect(env.includes('test_gck_/live_gck_')).toBe(true);
    expect(env.includes('test_gsk_/live_gsk_')).toBe(true);
  });
});
