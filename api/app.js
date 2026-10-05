import { POLICY_VERSION } from '../src/config/business.js';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'node:crypto';
import { notificationService } from '../server/services/notificationService.js';
import { encryptSessionTokens } from '../server/lib/sessionCrypto.js';
import { startOutboxWorker } from '../server/workers/outbox.js';
import { startExpiryWorker } from '../server/workers/expiry.js';
import { registerAdminRoutes } from './admin.js';
import { rankRelated, averageRatings } from './related.js';
import { createPaymentService } from '../server/payments/toss.js';
import { startPaymentRecoveryWorker } from '../server/payments/recovery.js';
import { createPaymentStore } from '../server/payments/store.js';
import { registerPaymentRoutes } from '../server/payments/routes.js';

const env = process.env;
const production = env.NODE_ENV === 'production';
const required = ['APP_ORIGIN', 'SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'SESSION_KEY'];
if (production && required.some(k => !env[k])) throw new Error(`Missing production configuration: ${required.filter(k => !env[k]).join(', ')}`);
const MFA_ENFORCEMENT = env.MFA_ENFORCEMENT === 'true';
const stepUp = async (req, res, next) => { const s = req.locals?.session; if (!s) return next(); if (MFA_ENFORCEMENT && (!s.aal || s.aal !== 'aal2')) return error(res, 403, 'MFA_REQUIRED'); next(); };
const privacyLimiter = rateLimit({ windowMs: 15*60*1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const normalizeOrigin = val => (val || '').trim().replace(/\/+$/, '');
const origin = normalizeOrigin(env.APP_ORIGIN || 'http://localhost:5173');
const allowedOrigins = new Set([origin]);
if (!production) {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://localhost:5174');
}
try {
  const parsed = new URL(origin);
  if (parsed.hostname.startsWith('www.')) {
    allowedOrigins.add(`${parsed.protocol}//${parsed.hostname.slice(4)}${parsed.port ? ':' + parsed.port : ''}`);
  } else if (!parsed.hostname.includes('localhost') && !parsed.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    allowedOrigins.add(`${parsed.protocol}//www.${parsed.hostname}${parsed.port ? ':' + parsed.port : ''}`);
  }
} catch { /* ignore malformed */ }

const isAllowedOrigin = (o) => {
  if (!o) return true;
  const clean = normalizeOrigin(o);
  if (allowedOrigins.has(clean)) return true;
  if (!production && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(clean)) return true;
  // Preview deployments: credentialed access only outside production.
  // In production only the exact canonical origins above (plus www
  // variants) are allowed — a compromised preview build must not get
  // credentialed CORS.
  if (!production && /^https:\/\/noeul111(-[a-z0-9-]+)?\.vercel\.app$/.test(clean)) return true;
  return false;
};
const isOriginAllowed = (o, cb) => cb(null, isAllowedOrigin(o));
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' }, contentSecurityPolicy: false }));
app.use(cors({ origin: isOriginAllowed, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Idempotency-Key', 'X-API-Scope'] }));
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false, skip: req => req.path.endsWith('/webhook') }));
const authLimiter = rateLimit({ windowMs: 15*60*1000, limit: 50, standardHeaders: true, legacyHeaders: false });
const paymentLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
const checkoutLimiter = rateLimit({ windowMs: 15*60*1000, limit: 3, standardHeaders: true, legacyHeaders: false, skip: req => req.path.endsWith('/webhook') });
const reviewLimiter = rateLimit({ windowMs: 15*60*1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const claimLimiter = rateLimit({ windowMs: 15*60*1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const quoteLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
const cancelLimiter = rateLimit({ windowMs: 15*60*1000, limit: 10, standardHeaders: true, legacyHeaders: false });
app.use(express.json({ limit: '256kb', strict: true }));
app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); res.set('Referrer-Policy', 'strict-origin-when-cross-origin'); res.set('Cache-Control', req.method === 'GET' ? 'private, max-age=0' : 'no-store'); next(); });

const serverSb = env.SUPABASE_URL && (env.SUPABASE_SECRET_KEY || env.SUPABASE_PUBLISHABLE_KEY) ? createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
const cookieName = production ? 'noeul_session' : 'noeul_session';
const sha = value => createHash('sha256').update(value).digest('hex');
const random = () => randomBytes(32).toString('base64url');
const pkceChallenge = verifier => createHash('sha256').update(verifier).digest('base64url');
const parseCookies = value => {
  const out = {};
  for (const part of String(value || '').split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    try { out[decodeURIComponent(k)] = decodeURIComponent(v); } catch { out[k] = v; }
  }
  return out;
};
const setCookie = (res, name, value, maxAge = 604800) => res.set('Set-Cookie', `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${production ? '; Secure' : ''}`);
const clearCookie = res => res.set('Set-Cookie', `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${production ? '; Secure' : ''}`);
const error = (res, status, code) => {
  if (res.headersSent) return;
  return res.status(status).json({ success: false, code, message: code });
};
const auditLog = async (req, action, details) => { try { const s = req.locals?.session; const apiScope = ['customer', 'admin'].includes(req.get('X-API-Scope')) ? req.get('X-API-Scope') : null; await database().from('audit_logs').insert({ actor: s?.user_id || null, action, target: details.table ? `${details.table}:${details.id || ''}` : '', metadata: { before: details.before ?? null, after: details.after ?? null, ip: req.ip, user_agent: req.get('user-agent'), api_scope: apiScope } }).maybeSingle(); } catch { /* audit trail is best-effort; never fail the request */ } };
// User-caused DB errors (bad id shape, FK to missing row) must be 400/404,
// not 503: PostgREST surfaces PG codes on the error object.
const isBadInput = (e) => ['22P02', '23502', '23503'].includes(e?.code);
const requestId = req => req.headers['x-request-id'] || random().slice(2);
app.use((req, res, next) => { req.requestId = requestId(req); res.set('X-Request-ID', req.requestId); next(); });
const database = () => { if (!serverSb) throw new Error('Supabase is not configured'); return serverSb.schema('app'); };

// Authoritative shipping configuration (finding #20). The saved
// site_settings shipping_policy is the single source of truth; hardcoded
// fallbacks apply only when settings are unreachable.
async function getShippingConfig() {
  try {
    const { data: row } = await database().from('content').select('value').eq('key', 'shipping').eq('published', true).maybeSingle();
    const policy = row?.value;
    const threshold = Number(policy?.free_threshold ?? policy?.threshold ?? 70000);
    const fee = Number(policy?.fee ?? 3000);
    if (Number.isFinite(threshold) && Number.isFinite(fee) && threshold >= 0 && fee >= 0) {
      return { threshold, fee };
    }
  } catch { /* fall through to defaults */ }
  return { threshold: 70000, fee: 3000 };
}

// Finding #10: strict line validation shared by quote and order creation.
function validateOrderLines(items) {
  if (!items || !Array.isArray(items) || items.length === 0 || items.length > 50) return 'INVALID_ITEMS';
  for (const item of items) {
    if (!item || typeof item.variant_id !== 'string' || !item.variant_id) return 'INVALID_ITEM';
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return 'INVALID_ITEM';
  }
  return null;
}

// Aggregate demand per variant so duplicate lines cannot oversell.
function aggregateDemand(items) {
  const map = new Map();
  for (const item of items) {
    map.set(item.variant_id, (map.get(item.variant_id) || 0) + item.quantity);
  }
  return map;
}

function normalizeProduct(product) {
  if (!product) return null;
  const media = Array.isArray(product.product_media) ? product.product_media.filter(m => m.published !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) : [];
  const variants = Array.isArray(product.product_variants) ? product.product_variants.filter(v => v.active !== false) : [];
  return { ...product, images: media.map(m => m.url), media, variants, sizes: [...new Set(variants.map(v => v.size))], colors: [...new Map(variants.map(v => [v.color, { name_ko: v.color, name_en: v.color, hex: v.swatch }])).values()], stock: variants.reduce((sum, v) => sum + Math.max(0, (v.stock || 0) - (v.reserved || 0)), 0) };
}

async function session(req, res, required = true) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = parseCookies(cookieHeader);
  const id = cookies[cookieName];
    if (!id) { if (required) error(res, 401, 'SIGN_IN_REQUIRED'); return null; }
  try {
    const { data: sessionRow, error: qErr } = await database().from('sessions').select('*').eq('id_hash', sha(id)).gt('expires_at', new Date().toISOString()).maybeSingle();
        if (qErr || !sessionRow) { if (required) error(res, 401, 'SESSION_EXPIRED'); return null; }
    const [{ data: profile }, { data: staff }] = await Promise.all([
      database().from('profiles').select('email,name,disabled').eq('id', sessionRow.user_id).maybeSingle(),
      database().from('staff_members').select('role,active').eq('user_id', sessionRow.user_id).maybeSingle(),
    ]);
    if (!profile || profile.disabled) { if (required) error(res, 401, 'SESSION_EXPIRED'); return null; }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const reqOrigin = normalizeOrigin(req.headers.origin);
      const host = req.get('x-forwarded-host') || req.get('host');
      let isSameHost = false;
      if (reqOrigin && host) {
        try { isSameHost = new URL(reqOrigin).host === host; } catch { isSameHost = false; }
      }
      const originMatch = !reqOrigin || isSameHost || isAllowedOrigin(reqOrigin);
      const csrfMatch = req.headers['x-csrf-token'] === sessionRow.csrf;
      if (!originMatch || !csrfMatch) {
        if (required && !res.headersSent) error(res, 403, 'CSRF_REJECTED');
        return null;
      }
    }

    return { ...sessionRow, profiles: profile, user_id: sessionRow.user_id, role: staff?.active ? staff.role : 'customer' };
  } catch (e) { console.error('[session] error', e); if (required && !res.headersSent) error(res, 401, 'SESSION_EXPIRED'); return null; }
}

const authenticate = async (req, res, next) => {
  const s = await session(req, res, false);
  if (!s) {
    if (!res.headersSent) error(res, 401, 'SIGN_IN_REQUIRED');
    return;
  }
  req.locals = { session: s };
  next();
};

const staff = (roles) => async (req, res, next) => { const s = req.locals?.session; if (!s || !roles.includes(s.role)) return error(res, 403, 'PERMISSION_DENIED'); if (MFA_ENFORCEMENT && s.aal !== 'aal2') return error(res, 403, 'MFA_REQUIRED'); next(); };

// Register admin routes
registerAdminRoutes(app, { database, error, auditLog, authenticate, staff, stepUp, releaseHoldRpc: async (args) => { const result = await database().rpc('release_hold', args); if (result.error) throw result.error; return result.data; } });

app.get('/health/live', (req, res) => res.json({ ok: true }));
function enrichOrders(orders) {
  return (orders || []).map(order => {
    const items = (order.items || []).map(item => ({
      ...item,
      product_name: item.product_variants?.products?.name_ko || item.product_variants?.products?.name_en || '',
      product_slug: item.product_variants?.products?.slug || '',
      image: item.product_variants?.products?.image_url || item.product_variants?.products?.image_media?.[0]?.url || '',
    }));
    const shipment = (order.shipments || []).filter(s => s.status === 'dispatched' || s.status === 'shipped').sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
    return { ...order, items, latest_shipment: shipment || null };
  });
}

app.get('/health/ready', async (req, res) => { try { const { error } = await database().from('content').select('key').limit(1); if (error) throw error; res.json({ ok: true }); } catch { res.status(503).json({ ok: false, code: 'NOT_READY' }); } });

// AUTH
// The state token is passed as a query parameter in the redirect URL so it
// survives the cross-domain redirect chain (localhost → supabase.co → localhost).
// Relying only on a cookie fails because SameSite=Lax cookies are often not
// sent when the browser arrives from a cross-origin redirect.
app.get('/api/v1/auth/google/start', authLimiter, async (req, res) => { try { const state = random(); const verifier = random(); const redirectTo = `${origin}/api/v1/auth/google/callback?oauth_state=${encodeURIComponent(state)}`; const authorize = new URL(`${env.SUPABASE_URL}/auth/v1/authorize`); authorize.searchParams.set('provider', 'google'); authorize.searchParams.set('redirect_to', redirectTo); authorize.searchParams.set('code_challenge', pkceChallenge(verifier)); authorize.searchParams.set('code_challenge_method', 'S256'); authorize.searchParams.set('access_type', 'offline'); authorize.searchParams.set('prompt', 'consent'); const { error: insErr } = await database().from('oauth_states').insert({ id_hash: sha(state), verifier, expires_at: new Date(Date.now() + 600000).toISOString() }); if (insErr) { console.error('[start] oauth_states insert failed:', insErr); return error(res, 500, insErr.code === 'PGRST106' ? 'SUPABASE_SCHEMA_NOT_EXPOSED' : 'AUTH_DB_ERROR'); } res.set('Set-Cookie', `noeul_oauth=${encodeURIComponent(state)}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${production ? '; Secure' : ''}`); res.redirect(authorize.toString()); } catch (e) { console.error('google start failed', e); error(res, 503, 'AUTH_NOT_CONFIGURED'); } });

app.get('/api/v1/auth/google/callback', authLimiter, async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const state = req.query.oauth_state || cookies.noeul_oauth;
    if (!state || !req.query.code) {
      return error(res, 400, 'INVALID_CALLBACK');
    }
    const stateHash = sha(state);
    const { data: row, error: stateErr } = await database().from('oauth_states').delete().eq('id_hash', stateHash).gt('expires_at', new Date().toISOString()).select('verifier').maybeSingle();
    if (stateErr) {
      console.error('[callback] oauth_states db error', stateErr);
      return error(res, 500, stateErr.code === 'PGRST106' ? 'SUPABASE_SCHEMA_NOT_EXPOSED' : 'DATABASE_ERROR');
    }
    if (!row) {
      return error(res, 400, 'OAUTH_STATE_EXPIRED');
    }
    const tokenRes = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_code: req.query.code, code_verifier: row.verifier })
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok || !token.access_token || !token.user) {
      return error(res, 401, 'GOOGLE_IDENTITY_REQUIRED');
    }
    const id = random();
    const csrf = random();
    await database().from('profiles').upsert({
      id: token.user.id,
      email: token.user.email,
      name: token.user.user_metadata?.full_name || ''
    });

    const sessionPayload = {
      id_hash: sha(id),
      user_id: token.user.id,
      encrypted_tokens: encryptSessionTokens(token),
      csrf,
      aal: token.user?.aal === 'aal2' ? 'aal2' : 'aal1',
      refreshed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24*60*60*1000).toISOString()
    };
    let { error: sessErr } = await database().from('sessions').insert(sessionPayload);
    if (sessErr && (sessErr.code === 'PGRST204' || sessErr.message?.includes('aal'))) {
      delete sessionPayload.aal;
      const retry = await database().from('sessions').insert(sessionPayload);
      sessErr = retry.error;
    }
    if (sessErr) {
      console.error('[callback] session insert failed:', sessErr);
      return error(res, 500, 'SESSION_INSERT_FAILED');
    }

    setCookie(res, cookieName, id);
    res.append('Set-Cookie', 'noeul_oauth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure');
    res.redirect('/account');
  } catch (e) {
    console.error('[callback] error', e);
    error(res, 503, 'AUTH_CALLBACK_FAILED');
  }
});


app.get('/api/v1/me', authenticate, async (req, res) => { const s = req.locals.session; res.set('Cache-Control', 'no-store'); res.json({ success: true, user: { id: s.user_id, uid: s.user_id, name: s.profiles.name, email: s.profiles.email, role: s.role }, csrf: s.csrf }); });
app.post('/api/v1/auth/logout', authenticate, async (req, res) => { const s = req.locals.session; if (s) await database().from('sessions').delete().eq('id_hash', s.id_hash); clearCookie(res); res.json({ success: true }); });
app.post('/api/v1/auth/logout-all', authenticate, async (req, res) => { const s = req.locals.session; if (s) await database().from('sessions').delete().eq('user_id', s.user_id); clearCookie(res); res.json({ success: true }); });
app.patch('/api/v1/me', authenticate, async (req, res) => { try { const s = req.locals.session; const name = String(req.body?.name || '').trim().slice(0, 60); if (!name) return error(res, 400, 'NAME_REQUIRED'); const { data, error: e } = await database().from('profiles').update({ name }).eq('id', s.user_id).select('id,email,name').maybeSingle(); if (e || !data) return error(res, 404, 'PROFILE_NOT_FOUND'); res.json({ success: true, user: { id: data.id, uid: data.id, name: data.name, email: data.email, role: s.role } }); } catch { error(res, 503, 'PROFILE_UNAVAILABLE'); } });
// ADDRESS BOOK — saved shipping addresses, reused at checkout.
// Orders keep a per-order address jsonb snapshot; this book is for reuse only.
function sanitizeAddressInput(b = {}) {
  const recipient = String(b.recipient || '').trim().slice(0, 60);
  const phone = String(b.phone || '').trim().slice(0, 30);
  const postal_code = String(b.postal_code || '').trim().slice(0, 20);
  const address = String(b.address || '').trim().slice(0, 200);
  const detail_address = String(b.detail_address || '').trim().slice(0, 200);
  const label = String(b.label || '').trim().slice(0, 40);
  const is_default = b.is_default === true;
  if (!recipient || !phone || !postal_code || !address) return { error: 'ADDRESS_REQUIRED' };
  return { value: { recipient, phone, postal_code, address, detail_address, label, is_default } };
}
async function fetchAddressesOrdered(userId) {
  // New schema orders default-first; fall back for DBs where the migration
  // 202610030001_address_book.sql has not been applied yet.
  try {
    const { data, error: e } = await database().from('addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false }).order('created_at', { ascending: false });
    if (e) throw e;
    return data || [];
  } catch {
    const { data, error: e } = await database().from('addresses').select('*').eq('user_id', userId);
    if (e) throw e;
    return data || [];
  }
}
app.get('/api/v1/me/addresses', authenticate, async (req, res) => { try { const data = await fetchAddressesOrdered(req.locals.session.user_id); res.json({ success: true, data }); } catch { error(res, 503, 'ADDRESSES_UNAVAILABLE'); } });
app.post('/api/v1/me/addresses', authenticate, async (req, res) => { try { const s = req.locals.session; const parsed = sanitizeAddressInput(req.body || {}); if (parsed.error) return error(res, 400, parsed.error); let row = { user_id: s.user_id, ...parsed.value }; // First address is always default; explicit default clears others.
    const currentList = await fetchAddressesOrdered(s.user_id);
    if (currentList.length === 0) row.is_default = true;
    if (row.is_default) await database().from('addresses').update({ is_default: false }).eq('user_id', s.user_id);
    const { data, error: e } = await database().from('addresses').insert(row).select().maybeSingle(); if (e || !data) throw e || new Error('ADDRESS_CREATE_FAILED'); res.status(201).json({ success: true, data }); } catch { error(res, 503, 'ADDRESSES_UNAVAILABLE'); } });
app.put('/api/v1/me/addresses/:id', authenticate, async (req, res) => { try { const s = req.locals.session; const parsed = sanitizeAddressInput(req.body || {}); if (parsed.error) return error(res, 400, parsed.error); if (parsed.value.is_default) await database().from('addresses').update({ is_default: false }).eq('user_id', s.user_id); const { data, error: e } = await database().from('addresses').update(parsed.value).eq('id', req.params.id).eq('user_id', s.user_id).select().maybeSingle(); if (e || !data) return error(res, 404, 'ADDRESS_NOT_FOUND'); res.json({ success: true, data }); } catch { error(res, 503, 'ADDRESSES_UNAVAILABLE'); } });
app.post('/api/v1/me/addresses/:id/default', authenticate, async (req, res) => { try { const s = req.locals.session; const { data: found } = await database().from('addresses').select('id').eq('id', req.params.id).eq('user_id', s.user_id).maybeSingle(); if (!found) return error(res, 404, 'ADDRESS_NOT_FOUND'); await database().from('addresses').update({ is_default: false }).eq('user_id', s.user_id); const { data, error: e } = await database().from('addresses').update({ is_default: true }).eq('id', req.params.id).eq('user_id', s.user_id).select().maybeSingle(); if (e || !data) return error(res, 404, 'ADDRESS_NOT_FOUND'); res.json({ success: true, data }); } catch { error(res, 503, 'ADDRESSES_UNAVAILABLE'); } });
app.delete('/api/v1/me/addresses/:id', authenticate, async (req, res) => { try { const s = req.locals.session; const { data: removed } = await database().from('addresses').delete().eq('id', req.params.id).eq('user_id', s.user_id).select('id,is_default,user_id').maybeSingle(); if (!removed) return error(res, 404, 'ADDRESS_NOT_FOUND'); if (removed?.is_default) { const rest = await fetchAddressesOrdered(s.user_id); if (rest.length > 0) await database().from('addresses').update({ is_default: true }).eq('id', rest[0].id); } res.json({ success: true }); } catch { error(res, 503, 'ADDRESSES_UNAVAILABLE'); } });

// USER COUPONS
app.get('/api/v1/me/coupons', authenticate, async (req, res) => { try { const s = req.locals.session; const { data, error: e } = await database().from('user_coupons').select('*,coupons(*)').eq('user_id', s.user_id).eq('status', 'active').order('claimed_at', { ascending: false }); if (e) throw e; const now = new Date().toISOString(); const coupons = (data || []).filter(uc => { const c = uc.coupons; return c && c.starts_at <= now && c.ends_at >= now && (c.used + (c.reserved || 0)) < c.limit_count; }).map(uc => ({ id: uc.id, code: uc.coupon_code, claimed_at: uc.claimed_at, ...uc.coupons })); res.json({ success: true, data: coupons }); } catch { error(res, 503, 'COUPONS_UNAVAILABLE'); } });
  app.post('/api/v1/me/coupons', authenticate, claimLimiter, async (req, res) => { try { const s = req.locals.session; const code = String(req.body?.code || '').toUpperCase().trim(); if (!code) return error(res, 400, 'COUPON_CODE_REQUIRED'); /* Atomic claim: row lock + window/limit/uniqueness + insert in one transaction (no claim race). Falls back to the legacy read-check-write only on DBs without the migration. */ try { const { data: claimed, error: rpcError } = await database().rpc('claim_coupon', { p_user_id: s.user_id, p_code: code }); if (!rpcError) { const outcome = claimed?.outcome; if (outcome === 'not_found') return error(res, 404, 'COUPON_NOT_FOUND'); if (outcome === 'expired') return error(res, 400, 'COUPON_EXPIRED'); if (outcome === 'limit') return error(res, 400, 'COUPON_LIMIT_REACHED'); if (outcome === 'duplicate') return error(res, 409, 'COUPON_ALREADY_CLAIMED'); if (outcome === 'created') { const { data: coupon } = await database().from('coupons').select('*').eq('code', code).maybeSingle(); return res.status(201).json({ success: true, data: coupon }); } throw new Error('CLAIM_FAILED'); } if (!String(rpcError.message || '').includes('claim_coupon')) throw rpcError; } catch (fb) { if (!String(fb.message || '').includes('claim_coupon')) throw fb; } const { data: coupon } = await database().from('coupons').select('*').eq('code', code).maybeSingle(); if (!coupon) return error(res, 404, 'COUPON_NOT_FOUND'); const now = new Date().toISOString(); if (coupon.starts_at > now || coupon.ends_at < now) return error(res, 400, 'COUPON_EXPIRED'); if ((coupon.used + (coupon.reserved || 0)) >= coupon.limit_count) return error(res, 400, 'COUPON_LIMIT_REACHED'); const { data: existing } = await database().from('user_coupons').select('id').eq('user_id', s.user_id).eq('coupon_code', code).maybeSingle(); if (existing) return error(res, 409, 'COUPON_ALREADY_CLAIMED'); const { data, error: e } = await database().from('user_coupons').insert({ user_id: s.user_id, coupon_code: code, status: 'active' }).select().maybeSingle(); if (e || !data) throw e || new Error('CLAIM_FAILED'); res.status(201).json({ success: true, data: { ...data, ...coupon } }); } catch { error(res, 503, 'COUPONS_UNAVAILABLE'); } });

// REWARD POINTS
app.get('/api/v1/me/reward-points', authenticate, async (req, res) => { try { const s = req.locals.session; const { data, error: e } = await database().from('reward_points').select('*').eq('user_id', s.user_id).maybeSingle(); if (e) throw e; const balance = data?.balance || 0; res.json({ success: true, data: { balance, total_earned: data?.total_earned || 0, total_used: data?.total_used || 0 } }); } catch { error(res, 503, 'REWARDS_UNAVAILABLE'); } });
app.get('/api/v1/me/reward-points/log', authenticate, async (req, res) => { try { const s = req.locals.session; const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100); const offset = Math.max(Number(req.query.offset) || 0, 0); const { data, error: e } = await database().from('reward_points_log').select('*').eq('user_id', s.user_id).order('created_at', { ascending: false }).range(offset, offset + limit - 1); if (e) throw e; res.json({ success: true, data: data || [] }); } catch { error(res, 503, 'REWARDS_UNAVAILABLE'); } });

// Helper: earn reward points on order completion
async function earnRewardPoints(userId, orderId, amount) { try { const points = Math.floor(amount / 100); if (points < 1) return; const { data: rp } = await database().from('reward_points').select('*').eq('user_id', userId).maybeSingle(); if (rp) { await database().from('reward_points').update({ balance: rp.balance + points, total_earned: rp.total_earned + points, updated_at: new Date().toISOString() }).eq('user_id', userId); } else { await database().from('reward_points').insert({ user_id: userId, balance: points, total_earned: points, total_used: 0 }); } await database().from('reward_points_log').insert({ user_id: userId, order_id: orderId, points_change: points, balance_after: (rp?.balance || 0) + points, reason: 'ORDER_COMPLETED' }); } catch { /* non-blocking */ } }

// CATALOG
app.get('/api/v1/catalog/products', async (req, res) => { try { let q = database().from('products').select('*,categories(slug),product_variants(*),product_media(*)', { count: 'exact' }).eq('is_active', true); if (req.query.search) { const term = String(req.query.search).replace(/\\/g, '\\\\').replace(/[%_,]/g, c => `\\${c}`).replace(/,/g, '').slice(0, 80).trim(); if (term) { let arms = `name_ko.ilike.%${term}%,name_en.ilike.%${term}%,description_ko.ilike.%${term}%,description_en.ilike.%${term}%`; try { const { data: matchCats } = await database().from('categories').select('id').or(`slug.ilike.%${term}%,name_ko.ilike.%${term}%,name_en.ilike.%${term}%`).limit(20); const ids = (matchCats || []).map(r => r.id).filter(Number.isInteger); if (ids.length) arms += `,category_id.in.(${ids.join(',')})`; } catch { /* category match is best-effort */ } q = q.or(arms); } } if (req.query.category) {
      const cat = String(req.query.category).toLowerCase();
      if (/^\d+$/.test(cat)) { q = q.eq('category_id', Number(cat)); } else {
      let slugs = [cat];
      if (cat === 'outerwear') slugs = ['jackets'];
      else if (cat === 'tops') slugs = ['tshirts','hoodies'];
      const { data: catRows } = await database().from('categories').select('id').in('slug', slugs);
      if (!catRows || catRows.length === 0) { res.json({ success: true, data: [], total: 0 }); return; }
      q = q.in('category_id', catRows.map(r=>r.id));
      }
    } if (req.query.gender) q = q.in('gender', [req.query.gender, 'unisex']); if (req.query.is_new === 'true' || req.query.is_new === '1' || req.query.isNew === 'true') q = q.eq('is_new', true); if (req.query.is_best === 'true' || req.query.is_best === '1' || req.query.isBest === 'true') q = q.eq('is_best', true); if (req.query.is_sale === 'true' || req.query.is_sale === '1' || req.query.sale === 'true' || req.query.isSale === 'true') q = q.not('discount_price', 'is', null); if (req.query.sort === 'price_asc') q = q.order('price', { ascending: true }); else if (req.query.sort === 'price_desc') q = q.order('price', { ascending: false }); else if (req.query.sort === 'popular' || req.query.sort === 'best') { if (await hasBestRank()) q = q.order('best_rank', { ascending: true, nullsFirst: false }); q = q.order('is_best', { ascending: false }); } const bestFilter = req.query.is_best === 'true' || req.query.is_best === '1' || req.query.isBest === 'true'; if (bestFilter && req.query.sort !== 'popular' && req.query.sort !== 'best' && req.query.sort !== 'price_asc' && req.query.sort !== 'price_desc' && await hasBestRank()) q = q.order('best_rank', { ascending: true, nullsFirst: false }); q = q.order('created_at', { ascending: false }); const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 100); const offset = Math.max(Number(req.query.offset) || 0, 0); const { data, count, error: e } = await q.range(offset, offset + limit - 1); if (e) throw e; res.json({ success: true, data: (data || []).map(normalizeProduct), total: (count ?? (data || []).length) }); } catch { error(res, 503, 'CATALOG_UNAVAILABLE'); } });

app.get('/api/v1/catalog/products/:id', async (req, res) => { try { const raw = String(req.params.id || '').trim(); const isNumeric = /^\\d+$/.test(raw); let q = database().from('products').select('*,categories(slug),product_variants(*),product_media(*)').eq('is_active', true); if (isNumeric) q = q.eq('id', Number(raw)); else q = q.eq('slug', raw); const { data, error: e } = await q.maybeSingle(); if (e || !data) return error(res, 404, 'PRODUCT_NOT_FOUND'); const current = normalizeProduct(data); let related = []; try { const [sameCat, best] = await Promise.all([database().from('products').select('*,categories(slug),product_variants(*),product_media(*)').eq('is_active', true).eq('category_id', data.category_id).neq('id', data.id).order('created_at', { ascending: false }).limit(12).then(r => r.data || [], () => []), database().from('products').select('*,categories(slug),product_variants(*),product_media(*)').eq('is_active', true).eq('is_best', true).neq('id', data.id).order('created_at', { ascending: false }).limit(12).then(r => r.data || [], () => [])]); const seen = new Map(); for (const p of [...(sameCat || []), ...(best || [])]) if (p && !seen.has(p.id)) seen.set(p.id, p); const pool = [...seen.values()].map(normalizeProduct); let ratings = {}; try { const ids = pool.map(p => p.id); if (ids.length) { const { data: revs } = await database().from('reviews').select('product_id,rating').in('product_id', ids).eq('is_approved', true); ratings = averageRatings(revs || []); } } catch {} related = rankRelated(current, pool, { limit: 4, ratings }); } catch { related = []; } if (!related.length) { const fb = await database().from('products').select('*,categories(slug),product_variants(*),product_media(*)').eq('is_active', true).eq('category_id', data.category_id).neq('id', data.id).order('created_at', { ascending: false }).limit(4).then(r => r.data || [], () => []); related = (fb || []).map(normalizeProduct); } res.json({ success: true, data: current, related: related }); } catch { error(res, 503, 'CATALOG_UNAVAILABLE'); } });
app.get('/api/v1/catalog/categories', async (req, res) => { try { const { data, error: e } = await database().from('categories').select('*').eq('is_active', true).order('sort_order'); if (e) return error(res, 503, 'CATALOG_UNAVAILABLE'); res.json({ success: true, data }); } catch { error(res, 503, 'CATALOG_UNAVAILABLE'); } });
app.get('/api/v1/content/:key', async (req, res) => { try { const key = req.params.key === 'public' ? 'shipping' : req.params.key; const { data, error: e } = await database().from('content').select('value').eq('key', key).eq('published', true).maybeSingle(); if (e || !data) return error(res, 404, 'CONTENT_NOT_FOUND'); res.json({ success: true, data: data.value }); } catch { error(res, 503, 'CONTENT_UNAVAILABLE'); } });
// Custom storefront pages (route /p/:slug) backed by the content table.
// Authors publish key `page:<slug>` with {title_ko,title_en,content_ko,
// content_en,banner_image}; unpublished/missing slugs 404 like before.
app.get('/api/v1/pages/:slug', async (req, res) => { try { const slug = String(req.params.slug || '').toLowerCase().replace(/[^a-z0-9가-힣_-]/g, '').slice(0, 80); if (!slug) return error(res, 404, 'CONTENT_NOT_FOUND'); const { data, error: e } = await database().from('content').select('value').eq('key', `page:${slug}`).eq('published', true).maybeSingle(); if (e || !data) return error(res, 404, 'CONTENT_NOT_FOUND'); const v = data.value || {}; res.json({ success: true, data: { title_ko: v.title_ko || '', title_en: v.title_en || v.title_ko || '', content_ko: v.content_ko || '', content_en: v.content_en || v.content_ko || '', banner_image: v.banner_image || null } }); } catch { error(res, 503, 'CONTENT_UNAVAILABLE'); } });

// CMS / SETTINGS
app.get('/api/v1/content/home', async (req, res) => { try { const { data, error: e } = await database().from('content').select('value').eq('key', 'home').eq('published', true).maybeSingle(); if (e || !data) return error(res, 404, 'CONTENT_NOT_FOUND'); const value = data.value || {}; res.json({ success: true, data: value.sections || value }); } catch { error(res, 503, 'CONTENT_UNAVAILABLE'); } });
app.get('/api/v1/content/menu', async (req, res) => { try { const { data, error: e } = await database().from('content').select('value').eq('key', 'menu').eq('published', true).maybeSingle(); if (e || !data) return error(res, 404, 'CONTENT_NOT_FOUND'); res.json({ success: true, data: data.value || [] }); } catch { error(res, 503, 'CONTENT_UNAVAILABLE'); } });
app.get('/api/v1/store/settings/public', async (req, res) => { try { const { data, error: e } = await database().from('content').select('key,value').in('key', ['shipping','site']).eq('published', true); if (e) throw e; const rows = {}; (data || []).forEach(r => { rows[r.key] = r.value; }); const ship = rows.shipping || {}; const site = rows.site || {}; const threshold = Number(ship.free_threshold ?? ship.threshold ?? 70000); const fee = Number(ship.fee ?? 3000); res.json({ success: true, data: { site_name: site.name || 'NOEUL', currency: 'KRW', shipping_policy: { threshold, fee }, free_shipping_threshold: threshold, shipping_fee: fee } }); } catch { error(res, 503, 'SETTINGS_UNAVAILABLE'); } });

// CART (finding #20: shipping quote comes from saved settings)
app.get('/api/v1/cart', authenticate, async (req, res) => { try { const uid = req.locals.session.user_id; const { data: rows, error: e } = await database().from('cart_items').select('quantity,variant_id,product_variants(*,products(*))').eq('user_id', uid); if (e) throw e; const items = (rows || []).map(r => ({ variant_id: r.variant_id, quantity: r.quantity, product_variants: r.product_variants })); const subtotal = items.reduce((sum, i) => { const base = i.product_variants?.products || {}; return sum + (Math.max(1, (base.discount_price || base.price || 0) + (i.product_variants?.price_delta || 0)) * i.quantity); }, 0); const { threshold, fee } = await getShippingConfig(); const shippingFee = items.length === 0 ? 0 : (subtotal >= threshold ? 0 : fee); res.json({ success: true, data: { items, subtotal, shipping_fee: shippingFee, total_amount: subtotal + shippingFee, item_count: items.reduce((s, i) => s + i.quantity, 0) } }); } catch { error(res, 503, 'CART_UNAVAILABLE'); } });
app.post('/api/v1/cart/items', authenticate, async (req, res) => { try { const { variant_id, quantity } = req.body || {}; const s = req.locals.session; if (typeof variant_id !== 'string' || !variant_id || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return error(res, 400, 'INVALID_ITEM'); const { data: pv } = await database().from('product_variants').select('stock,reserved,active').eq('id', variant_id).maybeSingle(); if (!pv || !pv.active) return error(res, 404, 'VARIANT_UNAVAILABLE'); const { data: row } = await database().from('cart_items').select('quantity').eq('user_id', s.user_id).eq('variant_id', variant_id).maybeSingle(); const next = (row?.quantity || 0) + quantity; if (next > 99 || (pv.stock || 0) - (pv.reserved || 0) < next) return error(res, 409, 'INSUFFICIENT_STOCK'); await database().from('cart_items').upsert({ user_id: s.user_id, variant_id, quantity: next }, { onConflict: 'user_id,variant_id' }); const { data: check } = await database().from('cart_items').select('quantity').eq('user_id', s.user_id).eq('variant_id', variant_id).maybeSingle(); const { data: avail } = await database().from('product_variants').select('stock,reserved').eq('id', variant_id).maybeSingle(); const maxAllowed = Math.min(99, Math.max(0, (avail?.stock || 0) - (avail?.reserved || 0))); let final = Math.min(check?.quantity || next, maxAllowed); if ((check?.quantity || 0) !== final) { if (final < 1) await database().from('cart_items').delete().eq('user_id', s.user_id).eq('variant_id', variant_id); else await database().from('cart_items').update({ quantity: final }).eq('user_id', s.user_id).eq('variant_id', variant_id); } if (final < quantity && final < next) return error(res, 409, 'INSUFFICIENT_STOCK'); res.json({ success: true, data: { variant_id, quantity: final } }); } catch { error(res, 503, 'CART_UNAVAILABLE'); } });
app.delete('/api/v1/cart/items/:id', authenticate, async (req, res) => { try { const { data: removed, error: e } = await database().from('cart_items').delete().eq('user_id', req.locals.session.user_id).eq('variant_id', req.params.id).select('variant_id').maybeSingle(); if (e) throw e; if (!removed) return error(res, 404, 'CART_ITEM_NOT_FOUND'); res.json({ success: true }); } catch { error(res, 503, 'CART_UNAVAILABLE'); } });

// WISHLIST
app.get('/api/v1/wishlist', authenticate, async (req, res) => { try { const { data, error: e } = await database().from('wishlists').select('*,products(*)').eq('user_id', req.locals.session.user_id).order('created_at', { ascending: false }); if (e) throw e; res.json({ success: true, data: (data || []).map(w => w.products) }); } catch { error(res, 503, 'WISHLIST_UNAVAILABLE'); } });
app.post('/api/v1/wishlist/toggle', authenticate, async (req, res) => { try { const { product_id } = req.body; const s = req.locals.session; if (!product_id) return error(res, 400, 'PRODUCT_ID_REQUIRED'); const { data: existing } = await database().from('wishlists').select('product_id').eq('user_id', s.user_id).eq('product_id', product_id).maybeSingle(); if (existing) { await database().from('wishlists').delete().eq('user_id', s.user_id).eq('product_id', product_id); res.json({ success: true, is_wishlisted: false }); } else { await database().from('wishlists').insert({ user_id: s.user_id, product_id }); res.json({ success: true, is_wishlisted: true }); } } catch (e) { if (isBadInput(e)) return error(res, 400, 'INVALID_PRODUCT'); error(res, 503, 'WISHLIST_UNAVAILABLE'); } });

// REVIEWS
app.get('/api/v1/products/:id/reviews', async (req, res) => { try { const { data, error: e } = await database().from('reviews').select('*').eq('product_id', req.params.id).eq('is_approved', true).order('created_at', { ascending: false }); if (e) throw e; const list = data || []; const summary = { averageRating: list.length ? (list.reduce((s, r) => s + (r.rating || 0), 0) / list.length).toFixed(1) : '5.0', totalReviews: list.length }; res.json({ success: true, data: list, summary }); } catch (e) { if (isBadInput(e)) return error(res, 400, 'INVALID_PRODUCT'); error(res, 503, 'REVIEWS_UNAVAILABLE'); } });

// ORDERS
// Coupon pricing shared by quote and order creation. Percentage coupons apply
// amount% capped by max_discount; flat otherwise. Matches api/admin.js couponDiscount.
function couponDiscountForSubtotal(subtotal, coupon) { if (!coupon) return 0; if (coupon.discount_type === 'percentage') { const pct = Math.round((subtotal * (coupon.amount || 0)) / 100); const capped = coupon.max_discount ? Math.min(pct, coupon.max_discount) : pct; return Math.min(subtotal, capped); } return Math.min(subtotal, coupon.amount || 0); }
function couponUsable(coupon, subtotal, today) { if (!coupon) return false; if ((coupon.starts_at || '') > today || (coupon.ends_at || '') < today) return false; if (((coupon.used || 0) + (coupon.reserved || 0)) >= coupon.limit_count) return false; if (subtotal < (coupon.minimum || 0)) return false; return true; }
// best_rank (P1 H7) is new: DBs without the migration must not 503 the
// whole catalog, so detect once per process and skip rank ordering there.
let bestRankColumn = null;
async function hasBestRank() { if (bestRankColumn !== null) return bestRankColumn; try { const { error } = await database().from('products').select('best_rank').limit(0); bestRankColumn = !error || !String(error.message || '').includes('best_rank'); } catch { bestRankColumn = false; } return bestRankColumn; }
// A claimed coupon must belong to the buyer: user_coupons(user_id, coupon_code)
// with status active. Prevents code-guessing discounts (P0).
async function ownsCoupon(userId, code) { try { const { data } = await database().from('user_coupons').select('id').eq('user_id', userId).eq('coupon_code', code).eq('status', 'active').maybeSingle(); return !!data; } catch { return false; } }
app.post('/api/v1/checkout/quote', authenticate, quoteLimiter, async (req, res) => { try { const { items, coupon_code } = req.body; const invalid = validateOrderLines(items); if (invalid) return error(res, 400, invalid); const demand = aggregateDemand(items); const ids = [...demand.keys()]; const { data: variants } = await database().from('product_variants').select('*,products(*)').in('id', ids); if (!variants || variants.length !== ids.length) return error(res, 404, 'VARIANT_UNAVAILABLE'); let subtotal = 0; const lines = []; for (const [variantId, totalQty] of demand) { const v = variants.find(x => x.id === variantId); if (!v || !v.active) return error(res, 400, 'VARIANT_UNAVAILABLE'); if ((v.stock || 0) - (v.reserved || 0) < totalQty) return error(res, 409, 'INSUFFICIENT_STOCK'); } for (const item of items) { const v = variants.find(x => x.id === item.variant_id); const base = v.products || {}; const unit = Math.max(1, (base.discount_price || base.price || 0) + (v.price_delta || 0)); subtotal += unit * item.quantity; lines.push({ variant_id: v.id, quantity: item.quantity, unit_price: unit }); } let discount = 0; let couponReason = null; if (coupon_code) { const code = String(coupon_code).toUpperCase().trim(); const { data: coupon } = await database().from('coupons').select('*').eq('code', code).maybeSingle(); const todayIso = new Date().toISOString(); if (!coupon) couponReason = 'COUPON_INVALID'; else if ((coupon.starts_at || '') > todayIso || (coupon.ends_at || '') < todayIso) couponReason = 'COUPON_EXPIRED'; else if (((coupon.used || 0) + (coupon.reserved || 0)) >= coupon.limit_count) couponReason = 'COUPON_LIMIT_REACHED'; else if (!await ownsCoupon(req.locals.session.user_id, code)) couponReason = 'COUPON_NOT_OWNED'; else if (subtotal < (coupon.minimum || 0)) couponReason = 'COUPON_MINIMUM_NOT_MET'; else { discount = couponDiscountForSubtotal(subtotal, coupon); } } const shipCfg = await getShippingConfig(); const shippingFee = subtotal - discount >= shipCfg.threshold ? 0 : shipCfg.fee; const quoted = subtotal - discount + shippingFee; if (quoted < 1) return error(res, 400, 'MINIMUM_AMOUNT'); res.json({ success: true, data: { subtotal, discount, shipping: shippingFee, amount: quoted, items: lines, coupon: discount > 0 ? 'applied' : null, coupon_reason: couponReason } }); } catch { error(res, 503, 'QUOTE_UNAVAILABLE'); } });

app.post('/api/v1/orders', authenticate, checkoutLimiter, async (req, res) => { try { const s = req.locals.session; const idempotencyKey = String(req.get('Idempotency-Key') || ''); if (!/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey)) return error(res, 400, 'IDEMPOTENCY_KEY_REQUIRED'); const { items, coupon_code, address, terms_agreed, terms_version } = req.body || {}; if (terms_agreed !== true || terms_version !== POLICY_VERSION) return error(res, 400, 'TERMS_AGREEMENT_REQUIRED'); const invalid = validateOrderLines(items); if (invalid) return error(res, 400, invalid); /* Idempotency: same key + same body returns the stored order; same key + different body is a conflict (finding #11). */ const requestHash = createHash('sha256').update(JSON.stringify({ items, coupon_code: coupon_code || null, address: address || null, terms_version })).digest('hex'); const { data: existing } = await database().from('orders').select('*').eq('user_id', s.user_id).eq('idempotency_key', idempotencyKey).maybeSingle(); if (existing) { if (existing.request_hash === requestHash) return res.json({ success: true, data: existing, duplicated: true }); return error(res, 409, 'IDEMPOTENCY_KEY_REUSE'); } /* Authoritative pricing (finding: never trust client totals). Recompute from variants/coupons/settings exactly like the quote endpoint. */ const demand = aggregateDemand(items); const ids = [...demand.keys()]; const { data: variants } = await database().from('product_variants').select('*,products(*)').in('id', ids); if (!variants || variants.length !== ids.length) return error(res, 404, 'VARIANT_UNAVAILABLE'); let subtotal = 0; const lines = []; for (const [variantId, totalQty] of demand) { const v = variants.find(x => x.id === variantId); if (!v || !v.active) return error(res, 400, 'VARIANT_UNAVAILABLE'); if ((v.stock || 0) - (v.reserved || 0) < totalQty) return error(res, 409, 'INSUFFICIENT_STOCK'); } for (const item of items) { const v = variants.find(x => x.id === item.variant_id); const base = v.products || {}; const unit = Math.max(1, (base.discount_price || base.price || 0) + (v.price_delta || 0)); subtotal += unit * item.quantity; lines.push({ variant_id: v.id, quantity: item.quantity, unit_price: unit, snapshot: { sku: v.sku, color: v.color, size: v.size } }); } let discount = 0; let couponCode = null; if (coupon_code) { const code = String(coupon_code).toUpperCase().trim(); const { data: coupon } = await database().from('coupons').select('*').eq('code', code).maybeSingle(); const today = new Date().toISOString(); if (!couponUsable(coupon, subtotal, today)) return error(res, 400, 'COUPON_INVALID'); if (!await ownsCoupon(s.user_id, code)) return error(res, 409, 'COUPON_NOT_OWNED'); discount = couponDiscountForSubtotal(subtotal, coupon); couponCode = coupon.code; } const shipCfg = await getShippingConfig(); const shippingFee = subtotal - discount >= shipCfg.threshold ? 0 : shipCfg.fee; const amount = subtotal - discount + shippingFee; if (amount < 1) return error(res, 400, 'MINIMUM_AMOUNT'); const number = `NE${Date.now().toString(36).toUpperCase()}${random().slice(2, 8).toUpperCase()}`; /* P0 atomic placement: tryPlaceOrderRpc calls app.place_order, which validates stock + coupon under row locks and writes order + items + outbox in a single transaction. No JS read-check-write and no compensation path, so concurrent checkouts cannot oversell or over-redeem coupons. */ const tryPlaceOrderRpc = () => database().rpc('place_order', { p_user_id: s.user_id, p_order_number: number, p_idempotency_key: idempotencyKey, p_request_hash: requestHash, p_subtotal: subtotal, p_discount: discount, p_shipping: shippingFee, p_amount: amount, p_coupon_code: couponCode, p_address: address || {}, p_items: lines.map(l => ({ variant_id: l.variant_id, quantity: l.quantity, unit_price: l.unit_price, snapshot: l.snapshot || {} })) }); /* Consent is recorded before the atomic write so a failed placement leaves no partial order behind. Purpose keys on the order number (generated above) instead of the row id. */ const { error: consentError } = await database().from('consent_records').insert({ user_id: s.user_id, purpose: `purchase_terms:${number}`, version: terms_version, accepted: true }); if (consentError) throw consentError; const { data: placed, error: rpcError } = await tryPlaceOrderRpc(); if (rpcError) throw rpcError; const outcome = placed?.outcome; if (outcome === 'conflict') return error(res, 409, 'IDEMPOTENCY_KEY_REUSE'); if (outcome === 'insufficient_stock') return error(res, 409, 'INSUFFICIENT_STOCK'); if (outcome === 'coupon_invalid') return error(res, 409, 'COUPON_INVALID'); if (outcome !== 'created' && outcome !== 'duplicate') throw new Error('ORDER_CREATE_FAILED'); const { data: order } = await database().from('orders').select('*').eq('id', placed.order_id).maybeSingle(); if (!order) throw new Error('ORDER_CREATE_FAILED'); if (outcome === 'duplicate') return res.json({ success: true, data: order, duplicated: true }); res.status(201).json({ success: true, data: order }); } catch { error(res, 503, 'ORDER_UNAVAILABLE'); } });
// Customer order history enrichment: order_items carry only variant refs +
// snapshots, so join variants → products (names) + first media (thumb) and the
// latest shipment (courier/tracking). Batched: 4 queries regardless of rows.
async function enrichCustomerOrders(orderRows) {
  const orders = orderRows || [];
  if (!orders.length) return [];
  const ids = orders.map(o => o.id);
  const [{ data: items }, { data: shipments }] = await Promise.all([
    database().from('order_items').select('*').in('order_id', ids).then(r => r, () => ({ data: [] })),
    database().from('shipments').select('order_id,courier_name,tracking_number,status,created_at').in('order_id', ids).order('created_at', { ascending: false }).then(r => r, () => ({ data: [] })),
  ]);
  const list = items || [];
  const variantIds = [...new Set(list.map(i => i.variant_id).filter(Boolean))];
  let variantMap = new Map();
  if (variantIds.length) {
    const { data: variants } = await database().from('product_variants').select('id,color,size,product_id,products(id,name_ko,name_en)').in('id', variantIds).then(r => r, () => ({ data: [] }));
    // Media keyed by product_id: resolve product ids from variants first.
    const productIds = [...new Set((variants || []).map(v => v.product_id).filter(Boolean))];
    let mediaByProduct = new Map();
    if (productIds.length) {
      const { data: mediaRows } = await database().from('product_media').select('product_id,url,sort_order').in('product_id', productIds).order('sort_order').then(r => r, () => ({ data: [] }));
      for (const m of (mediaRows || [])) {
        if (!mediaByProduct.has(m.product_id)) mediaByProduct.set(m.product_id, m.url);
      }
    }
    for (const v of (variants || [])) {
      variantMap.set(v.id, { color: v.color, size: v.size, name_ko: v.products?.name_ko || '', name_en: v.products?.name_en || '', image_url: mediaByProduct.get(v.product_id) || '' });
    }
  }
  const itemsByOrder = new Map();
  for (const it of list) {
    const v = variantMap.get(it.variant_id) || {};
    const snap = it.snapshot || {};
    const entry = { ...it, price: it.unit_price, size: snap.size || v.size || '', color: snap.color || v.color || '', product_name_ko: v.name_ko || snap.sku || '', product_name_en: v.name_en || snap.sku || '', image_url: v.image_url || '' };
    if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
    itemsByOrder.get(it.order_id).push(entry);
  }
  const shipByOrder = new Map();
  for (const s of (shipments || [])) {
    if (!shipByOrder.has(s.order_id)) shipByOrder.set(s.order_id, s);
  }
  return orders.map(o => {
    const s = shipByOrder.get(o.id);
    return { ...o, items: itemsByOrder.get(o.id) || [], courier_name: s?.courier_name || '', tracking_number: s?.tracking_number || '' };
  });
}
app.get('/api/v1/orders', authenticate, async (req, res) => { try { const { data, error: e } = await database().from('orders').select('*').eq('user_id', req.locals.session.user_id).order('created_at', { ascending: false }).limit(100); if (e) throw e; res.json({ success: true, data: await enrichCustomerOrders(data || []) }); } catch { error(res, 503, 'ORDERS_UNAVAILABLE'); } });
app.get('/api/v1/orders/:publicId', authenticate, async (req, res) => { try { const { data: order } = await database().from('orders').select('*').eq('order_number', req.params.publicId).eq('user_id', req.locals.session.user_id).maybeSingle(); if (!order) return error(res, 404, 'ORDER_NOT_FOUND'); const enriched = await enrichCustomerOrders([order]); const full = enriched[0] || order; res.json({ success: true, data: { ...full, items: full.items || [] } }); } catch { error(res, 503, 'ORDERS_UNAVAILABLE'); } });

// Cancel order (finding #21): idempotent release of stock reservations and
// coupon holds. Only unsettled orders can cancel; already-canceled orders
// return success without double-releasing.
app.post('/api/v1/orders/:publicId/cancel', authenticate, cancelLimiter, async (req, res) => {
  try {
    const { data: order, error: lookupError } = await database().from('orders').select('*').eq('order_number', req.params.publicId).eq('user_id', req.locals.session.user_id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!order) return error(res, 404, 'ORDER_NOT_FOUND');
    if (order.status === 'canceled') return res.json({ success: true, data: order, duplicated: true });
    if (order.status !== 'pending_payment') return error(res, 409, 'ORDER_NOT_CANCELLABLE');
    // Cancellation uses the same row lock as confirmation; no non-atomic fallback.
    // Paid orders must use the authorized PG refund endpoint instead.
    const { data: claimedCancel, error: cancelError } = await database().rpc('release_hold', {
      p_order_id: order.id, p_from: ['pending_payment'], p_to: 'canceled',
      p_effect_key: `order-cancel:${order.id}`, p_kind: 'ORDER_CANCELED',
    });
    if (cancelError) throw cancelError;
    if (!['released', 'already'].includes(claimedCancel?.outcome)) return error(res, 409, 'ORDER_NOT_CANCELLABLE');
    res.json({ success: true, data: { ...order, status: 'canceled' } });
  } catch { error(res, 503, 'ORDERS_UNAVAILABLE'); }
});

// Key pair and installed transactional DB functions are both required.
// The public config endpoint remains disabled while either is missing.
const paymentStore = createPaymentStore({ database });
const paymentService = createPaymentService({ env, store: paymentStore });
registerPaymentRoutes(app, {
  service: paymentService,
  authenticate, staff, stepUp, limiter: paymentLimiter,
});

// SHIPMENT / TRACKING
app.post('/api/v1/orders/:publicId/shipments', authenticate, staff(['super_admin','admin','order_manager']), stepUp, async (req, res) => { try { const s = req.locals.session; const { data: order } = await database().from('orders').select('*').eq('order_number', req.params.publicId).maybeSingle(); if (!order) return error(res, 404, 'ORDER_NOT_FOUND'); if (!['paid','processing'].includes(order.status)) return error(res, 409, 'ORDER_NOT_SHIPPABLE'); const { data: shipment } = await database().from('shipments').insert({ order_id: order.id, courier_name: req.body.courier || '', tracking_number: req.body.tracking_number || '', status: 'dispatched' }).select().maybeSingle(); await database().from('orders').update({ status: 'shipped' }).eq('id', order.id); await database().from('order_status_history').insert({ order_id: order.id, status: 'shipped', note: 'Shipment dispatched', actor_id: s.user_id }); await notificationService.sendShippingUpdate(order); res.json({ success: true, data: shipment }); } catch { error(res, 503, 'SHIPMENT_UNAVAILABLE'); } });
app.get('/api/v1/orders/:publicId/tracking', authenticate, async (req, res) => { try { const { data: order } = await database().from('orders').select('*').eq('order_number', req.params.publicId).eq('user_id', req.locals.session.user_id).maybeSingle(); if (!order) return error(res, 404, 'ORDER_NOT_FOUND'); const { data: events } = await database().from('order_status_history').select('*').eq('order_id', order.id).order('created_at', { ascending: false }); res.json({ success: true, data: { order, events } }); } catch { error(res, 503, 'TRACKING_UNAVAILABLE'); } });

// REVIEW WRITE
app.post('/api/v1/products/:id/reviews', reviewLimiter, authenticate, async (req, res) => { try { const s = req.locals.session; const { rating, comment, author_name, title, image_url } = req.body || {}; if (!rating || rating < 1 || rating > 5) return error(res, 400, 'INVALID_RATING'); const text = String(comment || '').trim().slice(0, 500); if (!text) return error(res, 400, 'COMMENT_REQUIRED'); const { data: prod } = await database().from('products').select('id').eq('id', req.params.id).maybeSingle(); if (!prod) return error(res, 404, 'PRODUCT_NOT_FOUND'); const { data, error: e } = await database().from('reviews').insert({ product_id: req.params.id, user_id: s.user_id, author_name: String(author_name || s.profiles?.name || '').slice(0, 60), rating: Number(rating), title: String(title || '').slice(0, 120), comment: text, image_url: String(image_url || '').slice(0, 500), is_approved: false }).select().maybeSingle(); if (e || !data) throw e || new Error('REVIEW_CREATE_FAILED'); res.status(201).json({ success: true, data }); } catch (e) { if (isBadInput(e)) return error(res, 400, 'INVALID_PRODUCT'); error(res, 503, 'REVIEWS_UNAVAILABLE'); } });

// REVIEW MODERATION
app.post('/api/v1/reviews/:id/moderate', authenticate, staff(['super_admin','admin']), async (req, res) => { try { const { data: review } = await database().from('reviews').select('*').eq('id', req.params.id).maybeSingle(); if (!review) return error(res, 404, 'REVIEW_NOT_FOUND'); const { is_approved } = req.body; await database().from('reviews').update({ is_approved, moderated_by: req.locals.session.user_id, moderated_at: new Date().toISOString() }).eq('id', req.params.id); await auditLog(req, 'REVIEW_MODERATE', { table: 'reviews', id: req.params.id }); res.json({ success: true }); } catch { error(res, 503, 'MODERATION_UNAVAILABLE'); } });

// PRIVACY REQUESTS
app.post('/api/v1/me/privacy-request', authenticate, privacyLimiter, async (req, res) => { try { const s = req.locals.session; const validTypes = ['export','delete','correct']; if (!validTypes.includes(req.body.type)) return error(res, 400, 'INVALID_PRIVACY_TYPE'); const kind = req.body.type; const { data: privacy } = await database().from('privacy_requests').insert({ user_id: s.user_id, kind, status: 'pending' }).select().maybeSingle(); await notificationService.sendInquiryResponse({ id: privacy.id, customer_email: s.profiles.email, category: 'privacy', response: 'Your request has been received and is being processed.' }); res.json({ success: true, data: privacy }); } catch { error(res, 503, 'PRIVACY_UNAVAILABLE'); } });
app.get('/api/v1/admin/privacy-requests', authenticate, staff(['super_admin','admin']), async (req, res) => { try { const { data } = await database().from('privacy_requests').select('*').order('created_at', { ascending: false }).limit(100); res.json({ success: true, data: data || [] }); } catch { error(res, 503, 'PRIVACY_UNAVAILABLE'); } });
// Privacy resolution: pending → done/completed/rejected only. Terminal states
// are immutable; every transition is audit-logged with before/after.
app.patch('/api/v1/admin/privacy-requests/:id', authenticate, staff(['super_admin','admin']), stepUp, async (req, res) => { try {
  const next = String(req.body?.status || '').toLowerCase();
  if (!['done', 'completed', 'rejected'].includes(next)) return error(res, 400, 'INVALID_STATUS');
  const { data: found } = await database().from('privacy_requests').select('id,status').eq('id', req.params.id).maybeSingle();
  if (!found) return error(res, 404, 'PRIVACY_NOT_FOUND');
  if (['done', 'completed', 'rejected'].includes(String(found.status || '').toLowerCase())) return error(res, 409, 'PRIVACY_ALREADY_RESOLVED');
  const { data, error: e } = await database().from('privacy_requests').update({ status: next }).eq('id', req.params.id).select().maybeSingle();
  if (e || !data) return error(res, 404, 'PRIVACY_NOT_FOUND');
  await auditLog(req, 'PRIVACY_RESOLVE', { table: 'privacy_requests', id: req.params.id, before: { status: found.status }, after: { status: next } });
  res.json({ success: true, data });
} catch { error(res, 503, 'PRIVACY_UNAVAILABLE'); } });

// AUDIT LOGS
app.get('/api/v1/admin/audit-logs', authenticate, staff(['super_admin','admin']), async (req, res) => { try { const { data } = await database().from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200); res.json({ success: true, data: data || [] }); } catch { error(res, 503, 'AUDIT_UNAVAILABLE'); } });

// ERROR HANDLER
app.use((err, req, res, next) => { /* eslint-disable-line no-unused-vars */ console.error(err); if (!res.headersSent) error(res, 500, 'INTERNAL_ERROR'); });

const port = Number(env.PORT || 5001);
export default app;
export const router = app;
if (process.argv[1] === new URL(import.meta.url).pathname) { app.listen(port, () => { console.log(`NOEUL production API listening on ${port}`); if (process.env.WORKERS_ENABLED !== '0') { startOutboxWorker().catch(err => console.error('[Outbox] start failed:', err.message)); startPaymentRecoveryWorker({ service: paymentService, store: paymentStore }); startExpiryWorker().catch(err => console.error('[Expiry] start failed:', err.message)); } }); }
