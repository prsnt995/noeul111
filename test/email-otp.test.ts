import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Email OTP signup — migration contract', () => {
  it('migration creates pending_signups + unique profile email index', () => {
    const sql = read('supabase/migrations/202611230001_email_otp_signup.sql');
    expect(sql.includes('app.pending_signups')).toBe(true);
    expect(sql.includes('password_hash')).toBe(true);
    expect(sql.includes('otp_hash')).toBe(true);
    expect(sql.includes('otp_expires_at')).toBe(true);
    expect(sql.includes('backend_access')).toBe(true);
    expect(sql.includes('noeul_api')).toBe(true);
    expect(sql.includes('profiles_email_ci_idx')).toBe(true);
    expect(sql.includes('profiles') && sql.includes('phone')).toBe(true);
  });
});

describe('Email OTP signup — OTP helpers', () => {
  it('server/lib/otp.js generates 6 digits, hashes, and verifies in constant time', () => {
    const src = read('server/lib/otp.js');
    expect(src.includes('randomInt(0, OTP_RANGE)')).toBe(true);
    expect(src.includes('padStart(OTP_DIGITS')).toBe(true);
    expect(src.includes('createHmac')).toBe(true);
    expect(src.includes('timingSafeEqual')).toBe(true);
    expect(src.includes('export function generateOtp')).toBe(true);
    expect(src.includes('export function hashOtp')).toBe(true);
    expect(src.includes('export function verifyOtpHash')).toBe(true);
  });
});

describe('Email OTP signup — backend wiring', () => {
  const app = read('api/app.js');
  it('exposes check-email / register / verify / resend / cancel routes', () => {
    expect(app.includes("'/api/v1/auth/check-email'")).toBe(true);
    expect(app.includes("'/api/v1/auth/register'")).toBe(true);
    expect(app.includes("'/api/v1/auth/register/verify'")).toBe(true);
    expect(app.includes("'/api/v1/auth/register/resend'")).toBe(true);
    expect(app.includes("'/api/v1/auth/register/cancel'")).toBe(true);
  });
  it('uses OTP constants and guards', () => {
    expect(app.includes('OTP_TTL_MS')).toBe(true);
    expect(app.includes('OTP_MAX_ATTEMPTS')).toBe(true);
    expect(app.includes('OTP_RESEND_COOLDOWN_MS')).toBe(true);
    expect(app.includes('OTP_MAX_SENDS')).toBe(true);
    expect(app.includes('generateOtp()')).toBe(true);
    expect(app.includes('verifyOtpHash')).toBe(true);
    expect(app.includes('pending_signups')).toBe(true);
    expect(app.includes('EMAIL_SEND_FAILED')).toBe(true);
    expect(app.includes('OTP_INVALID')).toBe(true);
    expect(app.includes('OTP_EXPIRED')).toBe(true);
    expect(app.includes('OTP_TOO_MANY_ATTEMPTS')).toBe(true);
    expect(app.includes('OTP_COOLDOWN')).toBe(true);
    expect(app.includes('OTP_SEND_LIMIT')).toBe(true);
  });
  it('atomic claim via delete().eq(otp_hash) before creating the account', () => {
    expect(app.includes(".delete().eq('email', email).eq('otp_hash', otpHash)")).toBe(true);
  });
  it('Google callback blocks password accounts, pending signups, unverified emails', () => {
    expect(app.includes('GOOGLE_EMAIL_UNVERIFIED')).toBe(true);
    expect(app.includes('ACCOUNT_EXISTS_USE_PASSWORD')).toBe(true);
    expect(app.includes('PENDING_EMAIL_SIGNUP')).toBe(true);
    expect(app.includes('ACCOUNT_DISABLED')).toBe(true);
  });
  it('does not issue a session before OTP verification (start route has no issuePasswordSession)', () => {
    // The start route must not mint a session; only /verify does.
    const startIdx = app.indexOf("app.post('/api/v1/auth/register', authLimiter");
    const verifyIdx = app.indexOf("app.post('/api/v1/auth/register/verify'");
    const startBlock = app.slice(startIdx, verifyIdx);
    expect(startBlock.includes('issuePasswordSession')).toBe(false);
  });
});

describe('Email OTP signup — frontend wiring', () => {
  it('AuthContext exposes the new methods', () => {
    const ctx = read('src/context/AuthContext.jsx');
    expect(ctx.includes('verifyRegister')).toBe(true);
    expect(ctx.includes('checkEmail')).toBe(true);
    expect(ctx.includes('resendRegisterOtp')).toBe(true);
    expect(ctx.includes('cancelRegister')).toBe(true);
    expect(ctx.includes("api.post('/auth/register/verify'")).toBe(true);
    expect(ctx.includes("api.post('/auth/check-email'")).toBe(true);
  });
  it('CustomerAuthPage has an OTP step and pre-check', () => {
    const page = read('src/pages/CustomerAuthPage.jsx');
    expect(page.includes('registerStep')).toBe(true);
    expect(page.includes('handleVerifyOtp')).toBe(true);
    expect(page.includes('handleResendOtp')).toBe(true);
    expect(page.includes('handleEmailBlur')).toBe(true);
    expect(page.includes('handleCancelOtp')).toBe(true);
    expect(page.includes('autoComplete="one-time-code"')).toBe(true);
    expect(page.includes('OTP_INVALID')).toBe(true);
  });
});

describe('Email OTP signup — fail-closed without Supabase', () => {
  let app: any;
  beforeAll(async () => {
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SECRET_KEY = '';
    process.env.SUPABASE_PUBLISHABLE_KEY = '';
    process.env.WORKERS_ENABLED = '0';
    const mod = await import(fileURLToPath(new URL('../api/app.js', import.meta.url)));
    app = mod.default;
  });

  it('check-email / register / verify / resend fail closed (503) without DB', async () => {
    await request(app).post('/api/v1/auth/check-email').send({ email: 'a@b.co' }).expect(503);
    await request(app).post('/api/v1/auth/register').send({ email: 'a@b.co', password: 'password123', name: 'T' }).expect(503);
    await request(app).post('/api/v1/auth/register/verify').send({ email: 'a@b.co', code: '123456' }).expect(503);
    await request(app).post('/api/v1/auth/register/resend').send({ email: 'a@b.co' }).expect(503);
  });

  it('validates input before touching the DB', async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'not-an-email', password: 'password123', name: 'T' }).expect(400);
    await request(app).post('/api/v1/auth/register').send({ email: 'a@b.co', password: 'short', name: 'T' }).expect(400);
    await request(app).post('/api/v1/auth/register/verify').send({ email: 'a@b.co', code: '12' }).expect(400);
    await request(app).post('/api/v1/auth/check-email').send({ email: 'not-an-email' }).expect(400);
  });
});