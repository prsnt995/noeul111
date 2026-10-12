import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Password auth — migration contract', () => {
  it('migration creates credentials + password_resets + auth_provider', () => {
    const sql = read('supabase/migrations/202610120001_password_auth.sql');
    expect(sql.includes('app.credentials')).toBe(true);
    expect(sql.includes('app.password_resets')).toBe(true);
    expect(sql.includes('auth_provider')).toBe(true);
    expect(sql.includes('password_hash')).toBe(true);
    expect(sql.includes('backend_access')).toBe(true);
    expect(sql.includes('noeul_api')).toBe(true);
  });

  it('only references migrated tables (credentials/password_resets exist)', () => {
    const tables = new Set<string>();
    for (const m of fs.readdirSync(path.join(root, 'supabase/migrations')).filter(f => f.endsWith('.sql'))) {
      const sql = read(path.join('supabase/migrations', m));
      for (const match of sql.matchAll(/create table (?:if not exists )?app\.(\w+)/gi)) tables.add(match[1]);
    }
    expect(tables.has('credentials')).toBe(true);
    expect(tables.has('password_resets')).toBe(true);
  });
});

describe('Password auth — backend wiring', () => {
  const app = read('api/app.js');

  it('exposes register/login/request-reset/reset routes', () => {
    expect(app.includes("'/api/v1/auth/register'")).toBe(true);
    expect(app.includes("'/api/v1/auth/login'")).toBe(true);
    expect(app.includes("'/api/v1/auth/request-password-reset'")).toBe(true);
    expect(app.includes("'/api/v1/auth/reset-password'")).toBe(true);
  });

  it('hashes with bcrypt cost 12 and verifies on login', () => {
    expect(app.includes('hashSync(password, 12)') || app.includes('hashSync(next, 12)')).toBe(true);
    expect(app.includes('compareSync(password')).toBe(true);
  });

  it('blocks Google-origin emails with distinct codes', () => {
    expect(app.includes('GOOGLE_ACCOUNT_USE_GOOGLE')).toBe(true);
    expect(app.includes('ACCOUNT_EXISTS_USE_GOOGLE')).toBe(true);
    expect(app.includes('ACCOUNT_EXISTS_USE_PASSWORD')).toBe(true);
  });

  it('escapes LIKE wildcards in every email lookup (a_b@x.com must not match aXb@x.com)', () => {
    expect(app.includes('escapeIlike')).toBe(true);
    const lookups = [...app.matchAll(/\.ilike\('email', ([^)]+)\)/g)].map(m => m[1].trim());
    expect(lookups.length).toBeGreaterThan(3);
    for (const arg of lookups) {
      expect(arg.startsWith('escapeIlike('), `unescaped ilike email lookup: ${arg}`).toBe(true);
    }
    // Commas are literal in LIKE — stripping them corrupts the pattern.
    const escLine = app.split('\n').find(l => l.includes('const escapeIlike'));
    expect(escLine.includes('/,/')).toBe(false);
  });

  it('rejects over-long emails before matching (no truncation confusion)', () => {
    expect(app.includes('rawEmailTooLong')).toBe(true);
  });

  it('reuses cookie session + CSRF for password logins', () => {
    expect(app.includes('issuePasswordSession')).toBe(true);
    expect(app.includes('setCookie(res, cookieName, id)')).toBe(true);
    expect(app.includes("encrypted_tokens: encryptSessionTokens({ type: 'password'")).toBe(true);
  });

  it('rate-limits password flows and revokes sessions on reset', () => {
    expect(app.includes('passwordResetLimiter')).toBe(true);
    expect(app.includes("from('sessions').delete().eq('user_id', row.user_id)")).toBe(true);
  });

  it('never offers set-password for Google users', () => {
    expect(app.includes('/auth/set-password')).toBe(false);
  });

  it('never mints staff sessions on the password path (admin stays Google-only)', () => {
    expect(app.includes('ADMIN_USE_GOOGLE')).toBe(true);
    const page = read('src/pages/CustomerAuthPage.jsx');
    expect(page.includes('ADMIN_USE_GOOGLE')).toBe(true);
  });

  it('directs register conflicts accurately (password vs Google)', () => {
    expect(app.includes('ACCOUNT_EXISTS_USE_PASSWORD')).toBe(true);
    // Credential-table duplicate means a password account owns the email.
    expect(app.includes("409, 'ACCOUNT_EXISTS_USE_PASSWORD'")).toBe(true);
  });

  it('keeps a single outstanding reset token and verifies the update hit', () => {
    expect(app.includes("from('password_resets').delete().eq('user_id', row.user_id)")).toBe(true);
    expect(app.includes(".update({ password_hash, updated_at:")).toBe(true);
    expect(app.includes(".select('user_id').maybeSingle()")).toBe(true);
  });
});

describe('Password auth — frontend wiring', () => {
  it('AuthContext implements real login/register/reset (no googleOnly stub)', () => {
    const ctx = read('src/context/AuthContext.jsx');
    expect(ctx.includes('googleOnly')).toBe(false);
    expect(ctx.includes("api.post('/auth/login'")).toBe(true);
    expect(ctx.includes("api.post('/auth/register'")).toBe(true);
    expect(ctx.includes("api.post('/auth/request-password-reset'")).toBe(true);
    expect(ctx.includes("api.post('/auth/reset-password'")).toBe(true);
    expect(ctx.includes('confirmPasswordReset')).toBe(true);
  });

  it('CustomerAuthPage maps backend codes and enforces 8+ chars', () => {
    const page = read('src/pages/CustomerAuthPage.jsx');
    expect(page.includes('GOOGLE_ACCOUNT_USE_GOOGLE')).toBe(true);
    expect(page.includes('ACCOUNT_EXISTS_USE_GOOGLE')).toBe(true);
    expect(page.includes('password.length < 8')).toBe(true);
    expect(page.includes('6자리')).toBe(false);
  });

  it('reset page + route exist', () => {
    expect(fs.existsSync(path.join(root, 'src/pages/PasswordResetPage.jsx'))).toBe(true);
    const appJsx = read('src/App.jsx');
    expect(appJsx.includes('/auth/reset')).toBe(true);
    expect(appJsx.includes('PasswordResetPage')).toBe(true);
    // Reset revokes all sessions: the page must clear client auth state.
    const resetPage = read('src/pages/PasswordResetPage.jsx');
    expect(resetPage.includes('logout()')).toBe(true);
  });
});

describe('Password auth — fail-closed without Supabase', () => {
  let app: any;
  beforeAll(async () => {
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SECRET_KEY = '';
    process.env.SUPABASE_PUBLISHABLE_KEY = '';
    process.env.WORKERS_ENABLED = '0';
    const mod = await import(fileURLToPath(new URL('../api/app.js', import.meta.url)));
    app = mod.default;
  });

  it('register/login/reset fail closed (503) without DB', async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'a@b.co', password: 'password123', name: 'T' }).expect(503);
    await request(app).post('/api/v1/auth/login').send({ email: 'a@b.co', password: 'password123' }).expect(503);
    await request(app).post('/api/v1/auth/reset-password').send({ token: 'x', newPassword: 'password123' }).expect(503);
  });

  it('validates input before touching the DB', async () => {
    // Bad email shape on register is 400 even without a database.
    await request(app).post('/api/v1/auth/register').send({ email: 'not-an-email', password: 'password123', name: 'T' }).expect(400);
    await request(app).post('/api/v1/auth/register').send({ email: 'a@b.co', password: 'short', name: 'T' }).expect(400);
  });
});
