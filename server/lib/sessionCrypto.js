import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

// Wave 1 (audit H2): provider access/refresh tokens are encrypted at rest
// with AES-256-GCM before hitting app.sessions.encrypted_tokens.
// Format: 'v1.' + base64url(iv 12B || authTag 16B || ciphertext).
// Key: SESSION_KEY as 64 hex chars (32 bytes). Missing/invalid key fails
// closed in production; dev/test fall back to an ephemeral key with a loud
// warning (sessions die on restart — safe, never silent).

const VERSION = 'v1';
let cachedKey = null;
let warned = false;

function loadKey() {
  if (cachedKey) return cachedKey;
  const hex = process.env.SESSION_KEY || '';
  if (/^[0-9a-f]{64}$/i.test(hex)) {
    cachedKey = Buffer.from(hex, 'hex');
    return cachedKey;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_KEY must be 64 hex chars (generate: openssl rand -hex 32)');
  }
  if (!warned) {
    warned = true;
    console.warn('[sessionCrypto] SESSION_KEY missing/invalid — ephemeral dev key in use (sessions invalidate on restart).');
  }
  cachedKey = randomBytes(32);
  return cachedKey;
}

export function encryptSessionTokens(value) {
  const key = loadKey();
  const plaintext = Buffer.from(typeof value === 'string' ? value : JSON.stringify(value), 'utf8');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}.${Buffer.concat([iv, tag, ciphertext]).toString('base64url')}`;
}

export function decryptSessionTokens(blob) {
  if (typeof blob !== 'string' || !blob.startsWith(`${VERSION}.`)) {
    throw new Error('SESSION_TOKEN_VERSION_MISMATCH');
  }
  const key = loadKey();
  const raw = Buffer.from(blob.slice(VERSION.length + 1), 'base64url');
  if (raw.length < 12 + 16 + 1) throw new Error('SESSION_TOKEN_MALFORMED');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}

// Test-only: drop the cached key so key-rotation/mismatch paths are testable.
export function _resetSessionKeyForTests() {
  cachedKey = null;
  warned = false;
}
