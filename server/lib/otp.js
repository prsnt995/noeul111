import { createHmac, timingSafeEqual, randomInt } from 'node:crypto';

// Pure helpers for the emailed 6-digit signup OTP. Kept dependency-free so
// they can be unit-tested and reused by any route.

const OTP_DIGITS = 6;
const OTP_RANGE = 1_000_000;

function loadPepper() {
  const hex = process.env.SESSION_KEY || '';
  if (/^[0-9a-f]{64}$/i.test(hex)) return Buffer.from(hex, 'hex');
  // Dev/test fallback only — never used in production (SESSION_KEY required).
  return Buffer.from('dev-otp-pepper-not-for-production', 'utf8');
}

export function generateOtp() {
  return randomInt(0, OTP_RANGE).toString().padStart(OTP_DIGITS, '0');
}

export function hashOtp(email, code) {
  const key = loadPepper();
  return createHmac('sha256', key).update(`${String(email || '').trim().toLowerCase()}:${String(code || '')}`).digest('hex');
}

export function verifyOtpHash(email, code, storedHash) {
  if (!storedHash || !code) return false;
  const computed = hashOtp(email, code);
  const a = Buffer.from(computed, 'utf8');
  const b = Buffer.from(String(storedHash), 'utf8');
  if (a.length !== b.length) return false;
  try { return timingSafeEqual(a, b); } catch { return false; }
}

export const OTP_DIGITS_COUNT = OTP_DIGITS;
