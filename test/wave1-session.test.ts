import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');
const savedKey = process.env.SESSION_KEY;

describe('Wave 1 — Session and token security', () => {
  describe('H2 — AES-GCM provider-token encryption', () => {
    let crypto: any;
    beforeEach(async () => {
      process.env.SESSION_KEY = 'a'.repeat(64);
      const mod = await import(new URL('../server/lib/sessionCrypto.js', import.meta.url).href + `?t=${Date.now()}`);
      crypto = mod;
      crypto._resetSessionKeyForTests();
    });
    afterAll(() => {
      if (savedKey === undefined) delete process.env.SESSION_KEY;
      else process.env.SESSION_KEY = savedKey;
    });

    it('round-trips objects and strings', () => {
      const blob = crypto.encryptSessionTokens({ access_token: 'secret', user: { id: 1 } });
      expect(blob.startsWith('v1.')).toBe(true);
      expect(blob.includes('secret')).toBe(false);
      expect(crypto.decryptSessionTokens(blob)).toEqual({ access_token: 'secret', user: { id: 1 } });
    });

    it('rejects tampered ciphertext', () => {
      const blob = crypto.encryptSessionTokens({ a: 1 });
      const tampered = blob.slice(0, -2) + (blob.endsWith('A') ? 'BB' : 'AA');
      expect(() => crypto.decryptSessionTokens(tampered)).toThrow();
    });

    it('rejects wrong key and bad versions', () => {
      const blob = crypto.encryptSessionTokens({ a: 1 });
      process.env.SESSION_KEY = 'b'.repeat(64);
      crypto._resetSessionKeyForTests();
      expect(() => crypto.decryptSessionTokens(blob)).toThrow();
      expect(() => crypto.decryptSessionTokens('v0.whatever')).toThrow();
      expect(() => crypto.decryptSessionTokens('not-a-blob')).toThrow();
    });

    it('fails closed in production without a key', async () => {
      const prevNode = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      delete process.env.SESSION_KEY;
      crypto._resetSessionKeyForTests();
      expect(() => crypto.encryptSessionTokens({ a: 1 })).toThrow();
      process.env.NODE_ENV = prevNode;
      process.env.SESSION_KEY = 'a'.repeat(64);
    });
  });

  describe('H2 wiring — no plaintext tokens reach the database', () => {
    it('callback encrypts tokens and clears the oauth cookie', () => {
      const app = read('api/app.js');
      expect(app.includes('encrypted_tokens: encryptSessionTokens(token)')).toBe(true);
      expect(app.includes('encrypted_tokens: JSON.stringify(token)')).toBe(false);
      expect(app.includes('noeul_oauth=; Path=/; Max-Age=0')).toBe(true);
    });

    it('aal migration exists and callback records assurance', () => {
      expect(fs.existsSync(path.join(root, 'supabase/migrations/202609180008_session_aal.sql'))).toBe(true);
      const app = read('api/app.js');
      expect(app.includes("aal: token.user?.aal === 'aal2' ? 'aal2' : 'aal1'")).toBe(true);
    });
  });

  describe('Session lifecycle hardening', () => {
    it('idle timeout and sliding refresh are implemented', () => {
      const app = read('api/app.js');
      expect(app.includes('24*60*60*1000')).toBe(true);
      expect(app.includes('refreshed_at')).toBe(true);
    });

    it('step-up gate is real and wired to refunds (no vacuous aal check)', () => {
      const app = read('api/app.js');
      expect(app.includes('s.aal && s.aal')).toBe(false);
      expect(app.includes('MFA_ENFORCEMENT')).toBe(true);
      expect(app.includes('MFA_REQUIRED')).toBe(true);
      expect(app.includes("staff(['super_admin', 'admin', 'order_manager']), stepUp")).toBe(true);
    });
  });

  describe('Privacy-request hardening', () => {
    it('throttled per user and strict on type', () => {
      const app = read('api/app.js');
      expect(app.includes('privacyLimiter')).toBe(true);
      expect(app.includes('INVALID_PRIVACY_TYPE')).toBe(true);
      expect(app.includes("? req.body.type : 'export'")).toBe(false);
    });
  });
});
