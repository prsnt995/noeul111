import { randomBytes, randomUUID, createHash } from 'node:crypto';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  normalizeOrderSource,
  isValidOrderSource,
  buildSalesBySource,
  salesBySourceToCsv,
} from './orderSources.js';
import {
  UPLOAD_MAX_FILES_PER_REQUEST,
  UPLOAD_MAX_FILE_BYTES,
  UPLOAD_ALLOWED_EXTENSIONS,
  UPLOAD_ALLOWED_MIME,
  UPLOAD_FAILED_TOO_MANY,
  UPLOAD_FAILED_TOO_LARGE,
  UPLOAD_FAILED_TYPE,
  UPLOAD_FAILED_STORAGE,
  UPLOAD_FAILED_GENERIC,
  UPLOAD_FAILED_EMPTY,
} from '../src/config/upload.js';

// Wave 3: Supabase-backed /api/v1/admin/* surface. The storefront frontend
// speaks legacy payload shapes; this module translates them onto the
// migration-schema tables (variant-first catalog, fixed/percentage coupons,
// JSON content docs). No manual paid-marking exists anywhere here by design.
//
// Role model (deny by default via staff()):
//   super_admin — everything including staff CRUD and settings
//   admin       — catalog, orders, CMS, settings, customers (no staff CRUD)
//   order_manager — orders fulfillment + refunds + customer reads
//   editor      — catalog + CMS content (no orders/customers/settings/staff)

const R = {
  catalog: ['super_admin', 'admin'],
  orders: ['super_admin', 'admin', 'order_manager'],
  money: ['super_admin', 'admin', 'order_manager'],
  cms: ['super_admin', 'admin'],
  settings: ['super_admin', 'admin'],
  customers: ['super_admin', 'admin', 'order_manager'],
  dashboard: ['super_admin', 'admin', 'order_manager'],
};

const random = () => randomBytes(6).toString('base64url');
const uid = () => randomUUID();

// Coupon discount shared by the pre-check endpoint and manual-create.
// Percentage coupons apply amount% capped by max_discount; flat otherwise.
function couponDiscount(subtotal, coupon) {
  if (!coupon) return 0;
  if (coupon.discount_type === 'percentage') {
    const pct = Math.round((subtotal * (coupon.amount || 0)) / 100);
    const capped = coupon.max_discount ? Math.min(pct, coupon.max_discount) : pct;
    return Math.min(subtotal, capped);
  }
  return Math.min(subtotal, coupon.amount || 0);
}

function slugify(text, fallback = 'item') {
  const base = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || fallback;
  return `${base}-${random().slice(0, 6).toLowerCase()}`;
}

// JSON content-document store (banners, settings facets, menus, pages,
// builder sections, media library). Low-concurrency admin CMS; whole-doc
// read-modify-write with server-generated ids.
function getDb(database) {
  return typeof database === 'function' ? database() : database;
}
async function readDoc(database, key, fallback) {
  const db = getDb(database);
  const { data } = await db.from('content').select('value').eq('key', key).eq('published', true).maybeSingle();
  return data?.value ?? fallback;
}

async function writeDoc(database, key, value) {
  const db = getDb(database);
  const { error } = await db.from('content').upsert({ key, value, published: true }, { onConflict: 'key' });
  if (error) throw error;
}

function docList(value) {
  return Array.isArray(value) ? value : [];
}

function findDocItem(database, key, id) {
  return readDoc(database, key, []).then(items => docList(items).find(i => String(i.id) === String(id)) || null);
}

async function saveDocItem(database, key, item) {
  const items = docList(await readDoc(database, key, []));
  const idx = items.findIndex(i => String(i.id) === String(item.id));
  if (idx >= 0) items[idx] = { ...items[idx], ...item };
  else items.push(item);
  await writeDoc(database, key, items);
  return item;
}

async function deleteDocItem(database, key, id) {
  const items = docList(await readDoc(database, key, []));
  await writeDoc(database, key, items.filter(i => String(i.id) !== String(id)));
}

async function staffIds(database) {
  const db = getDb(database);
  const { data } = await db.from('staff_members').select('user_id');
  return (data || []).map(r => r.user_id);
}

// ---------- Standard admin list pagination ----------
// Every admin list endpoint accepts modern `page`/`pageSize` plus legacy
// `limit`/`offset` aliases, plus `sort`/`order`/`search`. Responses always
// include `pagination: { page, pageSize, total, totalPages }` alongside the
// legacy `count` (page length) / `total` (full match count) fields, so old
// clients keep working while new UI paginates properly.
function parseListQuery(query = {}, defaults = {}) {
  const maxPageSize = Math.max(Number(defaults.maxPageSize) || 100, 1);
  const fallbackSize = Math.min(Math.max(Number(defaults.pageSize) || 20, 1), maxPageSize);
  const sizeRaw = query.pageSize ?? query.limit ?? fallbackSize;
  const pageSize = Math.min(Math.max(Number(sizeRaw) || fallbackSize, 1), maxPageSize);
  let page;
  if (query.page !== undefined && query.page !== '') {
    page = Math.max(Number(query.page) || 1, 1);
  } else if (query.offset !== undefined && query.offset !== '') {
    page = Math.floor(Math.max(Number(query.offset) || 0, 0) / pageSize) + 1;
  } else {
    page = 1;
  }
  const offset = (page - 1) * pageSize;
  const sort = typeof query.sort === 'string' && query.sort ? query.sort : (defaults.sort || null);
  const rawOrder = String(query.order || '').toLowerCase();
  const order = rawOrder === 'asc' || rawOrder === 'desc' ? rawOrder : (defaults.order || 'desc');
  const search = String(query.search || '').trim();
  return { page, pageSize, offset, limit: pageSize, sort, order, search };
}

function pickSort(requested, allowed, fallback) {
  return Array.isArray(allowed) && allowed.includes(requested) ? requested : fallback;
}

// PostgREST splits or() clauses on commas and treats %/_ as wildcards, so raw
// admin search input can break out of its filter or 400. Mirrors the catalog
// escaper in api/app.js: strip commas, escape wildcards, cap length.
function escapeIlike(term) {
  return String(term || '').replace(/\\/g, '\\\\').replace(/[%_]/g, c => `\\${c}`).replace(/,/g, '').slice(0, 80);
}

function pageEnvelope({ data = [], total = 0, page = 1, pageSize = 20 } = {}) {
  const safeTotal = Math.max(Number(total) || 0, 0);
  const safeSize = Math.max(Number(pageSize) || 20, 1);
  return {
    success: true,
    data,
    pagination: {
      page: Math.max(Number(page) || 1, 1),
      pageSize: safeSize,
      total: safeTotal,
      totalPages: Math.max(1, Math.ceil(safeTotal / safeSize)),
    },
    count: (data || []).length,
    total: safeTotal,
  };
}

// Variant-aggregated stock per product. Stock lives on product_variants,
// so list-level stock filters must resolve matching product ids BEFORE the
// range query — filtering composed rows after range silently breaks pages.
async function variantStockSums(db) {
  const client = getDb(db);
  const { data: variants } = await client.from('product_variants').select('product_id,stock').then(r => r, () => ({ data: [] }));
  const sums = new Map();
  for (const v of (variants || [])) {
    sums.set(v.product_id, (sums.get(v.product_id) || 0) + (v.stock || 0));
  }
  return sums;
}

export function registerAdminRoutes(app, ctx) {
  const { database, error, auditLog, authenticate, staff, stepUp, releaseHoldRpc } = ctx;
  const need = roles => [authenticate, staff(roles)];

  // ---------- Dashboard — resilient, never 503 (free-tier cold start, empty tables) ----------
  app.get('/api/v1/admin/dashboard/stats', ...need(R.dashboard), async (req, res) => {
    try {
      const recentLimit = Math.min(Math.max(Number(req.query.recent) || 8, 1), 50);
      const [ordersRes, productsRes, variantsRes, profilesRes] = await Promise.all([
        database().from('orders').select('id,order_number,status,amount,created_at,user_id,order_source').order('created_at', { ascending: false }).limit(500).then(r => r, e => { console.error('dashboard orders error', e); return { data: [] }; }),
        database().from('products').select('id,gender,is_active,is_new').then(r => r, e => { console.error('dashboard products error', e); return { data: [] }; }),
        database().from('product_variants').select('id,product_id,stock').then(r => r, e => { console.error('dashboard variants error', e); return { data: [] }; }),
        database().from('profiles').select('id').then(r => r, e => { console.error('dashboard profiles error', e); return { data: [] }; }),
      ]);
      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const variants = variantsRes.data || [];
      const profiles = profilesRes.data || [];
      const list = orders || [];
      const paid = new Set(['paid', 'processing', 'shipped', 'delivered']);
      const totalRevenue = list.filter(o => paid.has(o.status)).reduce((s, o) => s + (o.amount || 0), 0);
      const byStatus = {};
      for (const o of list) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      const orderStatuses = {
        pending: byStatus.pending_payment || 0,
        pending_verification: byStatus.confirming || 0,
        confirmed: byStatus.paid || 0,
        processing: byStatus.processing || 0,
        shipped: byStatus.shipped || 0,
        delivered: byStatus.delivered || 0,
        cancelled: byStatus.canceled || 0,
        refunded: (byStatus.refunded || 0) + (byStatus.refund_pending || 0),
      };
      const byProduct = new Map();
      for (const v of (variants || [])) {
        const g = byProduct.get(v.product_id) || { id: v.product_id, sku: '', name_ko: `Product #${v.product_id}`, stock: 0, images: [] };
        g.stock += v.stock || 0;
        byProduct.set(v.product_id, g);
      }
      // Enrich low-stock with product names if we have them
      if (byProduct.size) {
        try {
          const ids = [...byProduct.keys()].filter(id => (byProduct.get(id)?.stock || 0) <= 15).slice(0, 10);
          if (ids.length) {
            const { data: prodRows } = await database().from('products').select('id,sku,name_ko').in('id', ids).then(r => r, e => ({ data: [] }));
            for (const p of (prodRows || [])) {
              const g = byProduct.get(p.id);
              if (g) { g.sku = p.sku; g.name_ko = p.name_ko; }
            }
          }
        } catch {}
      }
      const lowStockItems = [...byProduct.values()].filter(p => p.stock <= 15).sort((a, b) => a.stock - b.stock).slice(0, 10);
      const itemCounts = {};
      let items = [];
      if (list.length) {
        const { data: itemRows } = await database().from('order_items').select('order_id').in('order_id', list.slice(0, recentLimit).map(o => o.id)).then(r => r, e => ({ data: [] }));
        items = itemRows || [];
      }
      for (const it of (items || [])) itemCounts[it.order_id] = (itemCounts[it.order_id] || 0) + 1;
      let staff = [];
      try { staff = await staffIds(database); } catch { staff = []; }
      let salesBySource = [];
      try {
        salesBySource = buildSalesBySource(list);
      } catch { salesBySource = []; }
      res.json({
        success: true,
        stats: {
          totalRevenue,
          todaySales: 0,
          todayOrders: 0,
          totalProducts: (products || []).length,
          womensProducts: (products || []).filter(p => p.gender === 'women').length,
          newArrivalsCount: (products || []).filter(p => p.is_new).length,
          totalCustomers: (profiles || []).filter(p => !staff.includes(p.id)).length,
          totalOrders: list.length,
          pendingOrdersCount: orderStatuses.pending + orderStatuses.pending_verification,
          completedOrdersCount: orderStatuses.delivered + orderStatuses.confirmed,
          orderStatuses,
          lowStockCount: lowStockItems.length,
        },
        lowStockItems,
        recentOrders: list.slice(0, recentLimit).map(o => ({ ...o, item_count: itemCounts[o.id] || 0 })),
        salesTrend: [],
        salesBySource,
      });
    } catch (e) {
      console.error('dashboard unexpected error', e);
      // Never 503 — return empty stats so UI renders with “다시 시도” instead of blank
      res.json({
        success: true,
        stats: {
          totalRevenue: 0, todaySales: 0, todayOrders: 0,
          totalProducts: 0, womensProducts: 0, newArrivalsCount: 0,
          totalCustomers: 0, totalOrders: 0,
          pendingOrdersCount: 0, completedOrdersCount: 0,
          orderStatuses: { pending:0, pending_verification:0, confirmed:0, processing:0, shipped:0, delivered:0, cancelled:0, refunded:0 },
          lowStockCount: 0,
        },
        lowStockItems: [], recentOrders: [], salesTrend: [], salesBySource: [],
        warning: 'Dashboard data temporarily unavailable — showing empty stats. Check server logs.',
      });
    }
  });

  // ---------- Customers (profiles without staff rows) — enriched with latest address for cloth store ----------
  app.get('/api/v1/admin/customers', ...need(R.customers), async (req, res) => {
    try {
      const { page, pageSize, offset, sort, order, search } = parseListQuery(req.query, {
        pageSize: 100, maxPageSize: 200, sort: 'created_at', order: 'desc',
      });
      const sortCol = pickSort(sort, ['created_at', 'name', 'email'], 'created_at');
      const ascending = order === 'asc';
      const staff = await staffIds(database);
      let q = database().from('profiles').select('*', { count: 'exact' }).order(sortCol, { ascending }).range(offset, offset + pageSize - 1);
      if (staff.length) q = q.not('id', 'in', `(${staff.join(',')})`);
      if (search) { const safe = escapeIlike(search); if (safe) q = q.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`); }
      const { data: customers, error: e, count: total } = await q;
      if (e) throw e;
      const ids = (customers || []).map(c => c.id);
      const [{ data: orders }, { data: addresses }] = await Promise.all([
        ids.length ? database().from('orders').select('user_id,amount,status').in('user_id', ids).then(r => r, () => ({ data: [] })) : Promise.resolve({ data: [] }),
        ids.length ? database().from('addresses').select('user_id,recipient,phone,postal_code,address,detail_address,created_at').in('user_id', ids).order('created_at', { ascending: false }).then(r => r, () => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      const agg = {};
      for (const o of (orders || [])) {
        const a = agg[o.user_id] || { order_count: 0, total_spent: 0 };
        a.order_count += 1;
        if (['paid', 'processing', 'shipped', 'delivered'].includes(o.status)) a.total_spent += o.amount || 0;
        agg[o.user_id] = a;
      }
      const latestAddr = {};
      for (const a of (addresses || [])) {
        if (!latestAddr[a.user_id]) latestAddr[a.user_id] = a;
      }
      res.json(pageEnvelope({
        data: (customers || []).map(c => {
          const addr = latestAddr[c.id] || {};
          return {
            ...c,
            phone: addr.phone || '',
            postal_code: addr.postal_code || '',
            address: addr.address || '',
            detail_address: addr.detail_address || '',
            recipient: addr.recipient || '',
            ...(agg[c.id] || { order_count: 0, total_spent: 0 }),
          };
        }),
        total: total ?? (customers || []).length,
        page,
        pageSize,
      }));
    } catch (e) { console.error('customers list error', e); error(res, 503, 'CUSTOMERS_UNAVAILABLE'); }
  });

  app.get('/api/v1/admin/customers/:id', ...need(R.customers), async (req, res) => {
    try {
      const { data: profile } = await database().from('profiles').select('*').eq('id', req.params.id).maybeSingle();
      if (!profile) return error(res, 404, 'CUSTOMER_NOT_FOUND');
      const [{ data: orders }, { data: addresses }] = await Promise.all([
        database().from('orders').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).then(r => r, () => ({ data: [] })),
        database().from('addresses').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5).then(r => r, () => ({ data: [] })),
      ]);
      const { data: items } = (orders || []).length
        ? await database().from('order_items').select('order_id,quantity,unit_price,snapshot').in('order_id', orders.map(o => o.id)).then(r => r, () => ({ data: [] }))
        : { data: [] };
      const latest = (addresses || [])[0] || {};
      res.json({
        success: true,
        data: {
          ...profile,
          phone: latest.phone || '',
          postal_code: latest.postal_code || '',
          address: latest.address || '',
          detail_address: latest.detail_address || '',
          recipient: latest.recipient || '',
          addresses: addresses || [],
          orders: (orders || []).map(o => ({
            ...o,
            items: (items || []).filter(i => i.order_id === o.id),
          })),
        },
      });
    } catch { error(res, 503, 'CUSTOMERS_UNAVAILABLE'); }
  });

  // ---------- Staff (Google identities allowlisted in staff_members) ----------
  // No passwords exist on this path: the account must sign in with Google
  // first (creating its profile), then is allowlisted here. The legacy
  // `password` form field is accepted and ignored for UI compatibility.
  app.get('/api/v1/admin/users/staff', ...need(R.dashboard), async (req, res) => {
    try {
      const { data: members } = await database().from('staff_members').select('user_id,role,active');
      const ids = (members || []).map(m => m.user_id);
      const { data: profiles } = ids.length
        ? await database().from('profiles').select('id,email,name,created_at').in('id', ids)
        : { data: [] };
      const byId = new Map((profiles || []).map(p => [p.id, p]));
      res.json({
        success: true,
        data: (members || []).map(m => ({
          id: m.user_id,
          email: byId.get(m.user_id)?.email || '',
          name: byId.get(m.user_id)?.name || '',
          phone: '',
          role: m.role,
          active: m.active,
          created_at: byId.get(m.user_id)?.created_at || null,
        })),
      });
    } catch { error(res, 503, 'STAFF_UNAVAILABLE'); }
  });

  app.post('/api/v1/admin/users/staff', authenticate, staff(['super_admin']), stepUp, async (req, res) => {
    try {
      const { email, name, role } = req.body || {};
      const validRoles = ['super_admin', 'admin'];
      if (!email || !validRoles.includes(role)) return error(res, 400, 'EMAIL_AND_ROLE_REQUIRED');
      const { data: profile } = await database().from('profiles').select('id,email,name').ilike('email', escapeIlike(String(email).trim())).maybeSingle();
      if (!profile) return error(res, 404, 'PROFILE_NOT_FOUND_SIGN_IN_FIRST');
      const { error: e } = await database().from('staff_members').upsert({ user_id: profile.id, role, active: true }, { onConflict: 'user_id' });
      if (e) throw e;
      if (name && name !== profile.name) {
        await database().from('profiles').update({ name: String(name).slice(0, 60) }).eq('id', profile.id);
      }
      await auditLog(req, 'STAFF_GRANT', { table: 'staff_members', id: profile.id, after: { role } });
      res.status(201).json({ success: true, data: { id: profile.id, email: profile.email, role } });
    } catch { error(res, 503, 'STAFF_UNAVAILABLE'); }
  });

  app.put('/api/v1/admin/users/staff/:id', authenticate, staff(['super_admin']), stepUp, async (req, res) => {
    try {
      const { role, active, name } = req.body || {};
      const { data: target } = await database().from('staff_members').select('*').eq('user_id', req.params.id).maybeSingle();
      if (!target) return error(res, 404, 'STAFF_NOT_FOUND');
      const nextRole = role === undefined ? target.role : role;
      if (!['super_admin', 'admin'].includes(nextRole)) return error(res, 400, 'INVALID_ROLE');
      if (target.role === 'super_admin' && nextRole !== 'super_admin') {
        const { data: rest } = await database().from('staff_members').select('user_id').eq('role', 'super_admin').neq('user_id', req.params.id);
        if (!(rest || []).length) return error(res, 400, 'LAST_SUPER_ADMIN');
        if (req.params.id === req.locals.session.user_id) return error(res, 400, 'NO_SELF_DEMOTION');
      }
      await database().from('staff_members').update({
        role: nextRole,
        active: active === undefined ? target.active : !!active,
      }).eq('user_id', req.params.id);
      if (name) await database().from('profiles').update({ name: String(name).slice(0, 60) }).eq('id', req.params.id);
      await auditLog(req, 'STAFF_UPDATE', { table: 'staff_members', id: req.params.id, after: { role: nextRole } });
      res.json({ success: true });
    } catch { error(res, 503, 'STAFF_UNAVAILABLE'); }
  });

  app.delete('/api/v1/admin/users/staff/:id', authenticate, staff(['super_admin']), stepUp, async (req, res) => {
    try {
      if (req.params.id === req.locals.session.user_id) return error(res, 400, 'NO_SELF_DELETE');
      const { data: target } = await database().from('staff_members').select('role').eq('user_id', req.params.id).maybeSingle();
      if (!target) return error(res, 404, 'STAFF_NOT_FOUND');
      if (target.role === 'super_admin') {
        const { data: rest } = await database().from('staff_members').select('user_id').eq('role', 'super_admin').neq('user_id', req.params.id);
        if (!(rest || []).length) return error(res, 400, 'LAST_SUPER_ADMIN');
      }
      await database().from('staff_members').delete().eq('user_id', req.params.id);
      await auditLog(req, 'STAFF_REVOKE', { table: 'staff_members', id: req.params.id });
      res.json({ success: true });
    } catch { error(res, 503, 'STAFF_UNAVAILABLE'); }
  });
  // ---------- Products (legacy shape over variant-first schema) ----------
  // Rich content blocks for the PDP band below the tabs. Strict: unknown
  // types / oversized payloads are rejected (400) so a bad client can't
  // store garbage the renderer would choke on.
  const DETAIL_BLOCK_MAX = 50;
  const detailBlockTypes = new Set(['heading', 'text', 'image', 'image_grid']);
  function sanitizeDetailBlocks(raw) {
    if (raw === undefined) return undefined;
    if (!Array.isArray(raw) || raw.length > DETAIL_BLOCK_MAX) return null;
    const clean = [];
    for (const b of raw) {
      if (!b || typeof b !== 'object' || !detailBlockTypes.has(b.type)) return null;
      if (b.type === 'heading' || b.type === 'text') {
        const t = b.text;
        const cap = b.type === 'heading' ? 300 : 4000;
        if (!t || typeof t !== 'object') return null;
        const ko = String(t.ko || ''), en = String(t.en || '');
        if (ko.length > cap || en.length > cap) return null;
        clean.push({ type: b.type, text: { ko, en } });
      } else if (b.type === 'image') {
        if (typeof b.url !== 'string' || !b.url || b.url.length > 500) return null;
        const cap = b.caption;
        if (cap !== undefined && (typeof cap !== 'object' || cap === null)) return null;
        const ko = String(cap?.ko || ''), en = String(cap?.en || '');
        if (ko.length > 300 || en.length > 300) return null;
        clean.push({ type: 'image', url: b.url, alt: String(b.alt || '').slice(0, 200), caption: { ko, en } });
      } else {
        const imgs = b.images;
        if (!Array.isArray(imgs) || imgs.length === 0 || imgs.length > 6) return null;
        const images = [];
        for (const it of imgs) {
          if (!it || typeof it !== 'object' || typeof it.url !== 'string' || !it.url || it.url.length > 500) return null;
          images.push({ url: it.url, alt: String(it.alt || '').slice(0, 200) });
        }
        clean.push({ type: 'image_grid', images });
      }
    }
    return clean;
  }

  async function composeAdminProduct(p) {
    const [{ data: variants }, { data: media }, { data: cat }] = await Promise.all([
      database().from('product_variants').select('*').eq('product_id', p.id),
      database().from('product_media').select('*').eq('product_id', p.id).order('sort_order'),
      p.category_id ? database().from('categories').select('slug,name_ko,name_en').eq('id', p.category_id).maybeSingle().then(r => r.data) : null,
    ]);
    const list = variants || [];
    return {
      ...p,
      category_name_ko: cat?.name_ko || '',
      category_name_en: cat?.name_en || '',
      category_slug: cat?.slug || '',
      sizes: [...new Set(list.map(v => v.size))],
      colors: [...new Map(list.map(v => [v.color, { name_ko: v.color, name_en: v.color, hex: v.swatch || '' }])).values()],
      images: (media || []).map(m => m.url),
      media: media || [],
      // Raw variants (id/color/size/stock/reserved) for the manual-order
      // picker, which hides out-of-stock color/size combos per variant.
      variants: list.map(v => ({
        id: v.id, color: v.color, size: v.size, stock: v.stock || 0,
        reserved: v.reserved || 0, active: v.active !== false, sku: v.sku,
      })),
      stock: list.reduce((s, v) => s + (v.stock || 0), 0),
      status: p.is_active ? 'active' : 'hidden',
      is_new: !!p.is_new,
      is_best: !!p.is_best,
      is_sale: !!(p.discount_price && p.discount_price < p.price),
      is_featured: false,
      discount_rate: p.discount_price && p.discount_price < p.price ? Math.round(((p.price - p.discount_price) / p.price) * 100) : 0,
    };
  }

  function combosFromBody(body) {
    const sizes = (Array.isArray(body.sizes) && body.sizes.length ? body.sizes : ['FREE']).map(String);
    const colors = (Array.isArray(body.colors) && body.colors.length ? body.colors : [{ name_ko: 'DEFAULT', name_en: 'DEFAULT', hex: '' }])
      .map(c => (typeof c === 'string' ? { name: c } : c))
      .map(c => ({ color: c.name_en || c.name_ko || c.name || 'DEFAULT', swatch: c.hex || '' }));
    // Per-combo stock map: keys are `${color}|||${size}`. When provided it is
    // the single source of truth for WHICH combos are offered (absent key =
    // combo not sold) and each value is that combo's stock.
    const stockMap = new Map();
    const raw = body.variant_stock;
    const hasStockMap = Boolean(raw && typeof raw === 'object' && !Array.isArray(raw));
    if (hasStockMap) {
      for (const [key, val] of Object.entries(raw)) {
        if (typeof key !== 'string' || key.indexOf('|||') <= 0) continue;
        const n = Math.round(Number(val));
        if (!Number.isFinite(n) || n < 0) continue;
        stockMap.set(key, Math.min(n, 99999));
      }
    }
    return { sizes, colors, stockMap, hasStockMap };
  }

  async function syncVariants(productId, productSku, body) {
    const { sizes, colors, stockMap, hasStockMap } = combosFromBody(body);
    const { data: existing } = await database().from('product_variants').select('*').eq('product_id', productId);
    const have = new Map((existing || []).map(v => [`${v.color}|||${v.size}`, v]));
    const swatchByColor = new Map(colors.map(c => [c.color, c.swatch]));
    const want = new Set();
    if (hasStockMap) {
      for (const key of stockMap.keys()) want.add(key);
    } else {
      for (const c of colors) for (const size of sizes) want.add(`${c.color}|||${size}`);
    }
    let n = 0;
    for (const key of want) {
      const sep = key.indexOf('|||');
      const color = key.slice(0, sep);
      const size = key.slice(sep + 3);
      const requested = hasStockMap ? (stockMap.get(key) ?? 0) : 0;
      n += 1;
      const prev = have.get(key);
      if (!prev) {
        let sku = `${productSku}-${String(color).slice(0, 8)}-${String(size).slice(0, 8)}`.toUpperCase().replace(/[^A-Z0-9-]+/g, '-');
        const { error } = await database().from('product_variants').insert({
          product_id: productId, sku: `${sku}-${random().slice(0, 4)}`,
          color, size, swatch: swatchByColor.get(color) || '', stock: requested, active: true,
        });
        if (error) throw error;
      } else if (hasStockMap && (prev.stock || 0) !== requested) {
        // DB check: reserved <= stock, so a lowering can't dip under holds.
        const target = Math.max(requested, prev.reserved || 0);
        const { error } = await database().from('product_variants').update({ stock: target }).eq('id', prev.id);
        if (error) throw error;
      }
    }
    // Remove deselected combos only when nothing holds them (FK blocks ordered ones).
    for (const [key, v] of have) {
      if (!want.has(key) && (v.reserved || 0) === 0) {
        const { error } = await database().from('product_variants').delete().eq('id', v.id);
        if (error) throw Object.assign(new Error('VARIANT_REFERENCED'), { status: 409 });
      }
    }
    return n;
  }

  async function syncMedia(productId, images) {
    await database().from('product_media').delete().eq('product_id', productId);
    const rows = (images || []).filter(Boolean).map((item, i) => {
      const url = typeof item === 'string' ? item : item.url;
      const color = typeof item === 'object' ? (item.color || null) : null;
      const variant_id = typeof item === 'object' ? (item.variant_id || null) : null;
      return {
        product_id: productId, url: String(url).slice(0, 500), color, variant_id, alt: typeof item === 'object' ? String(item.alt || '').slice(0, 200) : '', sort_order: i, published: true,
      };
    }).filter(r => r.url);
    if (rows.length) {
      const { error } = await database().from('product_media').insert(rows);
      if (error) throw error;
    }
  }

  // Read-only schema self-diagnosis for the product surface: probes the
  // columns recent migrations add, one at a time, so the admin UI can name
  // exactly which migration the live DB is missing. Never writes.
  app.get('/api/v1/admin/health/schema', ...need(R.catalog), async (req, res) => {
    try {
      const probes = [
        { column: 'material_ko', migration: '202610050002_product_material.sql' },
        { column: 'best_rank', migration: '202610050003_best_rank.sql' },
        { column: 'detail_blocks', migration: '202610050001_product_detail_blocks.sql' },
      ];
      const missingColumns = [];
      const missingMigrations = [];
      let probeError = null;
      for (const p of probes) {
        const r = await database().from('products').select(p.column).limit(1)
          .then((ok) => ok, (err) => ({ error: err }));
        const msg = String(r?.error?.message || '');
        if (!r?.error) continue;
        if (r.error?.code === '42703' || /column .* does not exist|undefined_column/i.test(msg)) {
          missingColumns.push(p.column);
          missingMigrations.push(p.migration);
        } else {
          probeError = r.error?.code || msg || 'PROBE_FAILED';
        }
      }
      res.json({
        success: true,
        ok: missingColumns.length === 0 && !probeError,
        missingColumns,
        missingMigrations: [...new Set(missingMigrations)],
        probeError,
      });
    } catch { error(res, 503, 'SCHEMA_CHECK_FAILED'); }
  });

  app.get('/api/v1/admin/products', ...need(R.catalog), async (req, res) => {
    try {
      const { category, status, filterType, stockStatus } = req.query;
      const { page, pageSize, offset, sort, order, search } = parseListQuery(req.query, {
        pageSize: 20, maxPageSize: 100, sort: 'id', order: 'desc',
      });
      const sortCol = pickSort(sort, ['id', 'created_at', 'price'], 'id');
      const ascending = order === 'asc';

      // Stock modes aggregate variant rows, so matching product ids must be
      // resolved BEFORE range() — never filter composed rows after the page.
      const stockMode = stockStatus === 'low' ? 'low'
        : stockStatus === 'out' || filterType === 'out_of_stock' ? 'out'
        : stockStatus === 'in' || filterType === 'in_stock' ? 'in' : null;
      let stockIds = null;
      if (stockMode) {
        const sums = await variantStockSums(database);
        if (stockMode === 'out') {
          // Products without any variant row read as zero stock.
          const { data: allProducts } = await database().from('products').select('id').then(r => r, () => ({ data: [] }));
          stockIds = (allProducts || []).filter(p => (sums.get(p.id) ?? 0) <= 0).map(p => p.id);
        } else {
          stockIds = [...sums.entries()]
            .filter(([, sum]) => (stockMode === 'low' ? sum > 0 && sum <= 15 : sum > 0))
            .map(([pid]) => pid);
        }
        if (!stockIds.length) return res.json(pageEnvelope({ data: [], total: 0, page, pageSize }));
      }

      const applyCommon = (qb) => {
        let out = qb;
        if (search) {
          const safe = escapeIlike(search);
          if (safe) out = out.or(`name_ko.ilike.%${safe}%,name_en.ilike.%${safe}%,sku.ilike.%${safe}%`);
        }
        if (filterType === 'new') out = out.eq('is_new', true);
        if (filterType === 'best') out = out.eq('is_best', true);
        if (filterType === 'sale') out = out.not('discount_price', 'is', null);
        if (status && status !== 'all') out = out.eq('is_active', status === 'active');
        if (stockIds) out = out.in('id', stockIds);
        return out;
      };

      let data = null;
      let total = 0;
      if (category && category !== 'all') {
        const slug = String(category).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 80); const numId = /^\d+$/.test(String(category)) ? Number(category) : -1; if (!slug && numId < 0) return res.json(pageEnvelope({ data: [], total: 0, page, pageSize })); const { data: cat } = await database().from('categories').select('id').or(`slug.eq.${slug},id.eq.${numId}`).maybeSingle();
        if (!cat) return res.json(pageEnvelope({ data: [], total: 0, page, pageSize }));
        const r = await applyCommon(
          database().from('products').select('*', { count: 'exact' }).eq('category_id', cat.id).order(sortCol, { ascending }).range(offset, offset + pageSize - 1)
        );
        if (r.error) throw r.error;
        data = r.data;
        total = r.count ?? (r.data || []).length;
      } else {
        const r = await applyCommon(
          database().from('products').select('*', { count: 'exact' }).order(sortCol, { ascending }).range(offset, offset + pageSize - 1)
        );
        if (r.error) throw r.error;
        data = r.data;
        total = r.count ?? (r.data || []).length;
      }
      const ids = (data || []).map(p => p.id);
      // Batch fetch variants + media + categories in 3 queries (free-tier: 3 vs N*3)
      let variantsByProduct = new Map();
      let mediaByProduct = new Map();
      let catById = new Map();
      if (ids.length) {
        const [{ data: variants }, { data: media }, { data: cats }] = await Promise.all([
          database().from('product_variants').select('*').in('product_id', ids).then(r => r, () => ({ data: [] })),
          database().from('product_media').select('*').in('product_id', ids).order('sort_order').then(r => r, () => ({ data: [] })),
          database().from('categories').select('id,slug,name_ko,name_en').then(r => r, () => ({ data: [] })),
        ]);
        for (const v of (variants || [])) {
          if (!variantsByProduct.has(v.product_id)) variantsByProduct.set(v.product_id, []);
          variantsByProduct.get(v.product_id).push(v);
        }
        for (const m of (media || [])) {
          if (!mediaByProduct.has(m.product_id)) mediaByProduct.set(m.product_id, []);
          mediaByProduct.get(m.product_id).push(m);
        }
        for (const c of (cats || [])) catById.set(c.id, c);
      }
      const composed = (data || []).map(p => {
        const list = variantsByProduct.get(p.id) || [];
        const cat = catById.get(p.category_id);
        const media = mediaByProduct.get(p.id) || [];
        return {
          ...p,
          category_name_ko: cat?.name_ko || '',
          category_name_en: cat?.name_en || '',
          category_slug: cat?.slug || '',
          sizes: [...new Set(list.map(v => v.size))],
          colors: [...new Map(list.map(v => [v.color, { name_ko: v.color, name_en: v.color, hex: v.swatch || '' }])).values()],
          images: media.map(m => m.url),
          media: media || [],
          // Raw variants (id/color/size/stock/reserved) so the admin
          // color×size stock table can prefill and edit per-combo stock.
          variants: list.map(v => ({
            id: v.id, color: v.color, size: v.size, stock: v.stock || 0,
            reserved: v.reserved || 0, active: v.active !== false, sku: v.sku,
          })),
          stock: list.reduce((s, v) => s + (v.stock || 0), 0),
          status: p.is_active ? 'active' : 'hidden',
          is_new: !!p.is_new,
          is_best: !!p.is_best,
          is_sale: !!(p.discount_price && p.discount_price < p.price),
          is_featured: false,
          discount_rate: p.discount_price && p.discount_price < p.price ? Math.round(((p.price - p.discount_price) / p.price) * 100) : 0,
        };
      });
      res.json(pageEnvelope({ data: composed, total, page, pageSize }));
    } catch { error(res, 503, 'PRODUCTS_UNAVAILABLE'); }
  });

  app.post('/api/v1/admin/products', ...need(R.catalog), async (req, res) => {
    try {
      const b = req.body || {};
      if (!b.name_ko || !b.category_id || b.price === undefined) return error(res, 400, 'NAME_CATEGORY_PRICE_REQUIRED');
      const price = Number(b.price);
      const discount = b.discount_price ? Number(b.discount_price) : null;
      if (!Number.isInteger(price) || price <= 0) return error(res, 400, 'INVALID_PRICE');
      if (discount !== null && (!Number.isInteger(discount) || discount <= 0 || discount >= price)) return error(res, 400, 'INVALID_DISCOUNT');
      const sku = String(b.sku || `NE-${Date.now().toString().slice(-6)}`).toUpperCase().slice(0, 60);
      const detailBlocks = sanitizeDetailBlocks(b.detail_blocks);
      if (detailBlocks === null) return error(res, 400, 'INVALID_DETAIL_BLOCKS');
      // Duplicate SKUs are the classic retry trap: an earlier attempt may have
      // inserted the row before failing at variants/media, so every retry with
      // the same SKU would otherwise die with a generic 503. Name it instead.
      const { data: skuTaken } = await database().from('products').select('id').eq('sku', sku).maybeSingle().then(r => r, () => ({ data: null }));
      if (skuTaken) return error(res, 409, 'SKU_EXISTS');
      let created = null;
      try {
        const { data, error: e } = await database().from('products').insert({
          slug: slugify(b.sku || b.name_ko), sku,
          category_id: Number(b.category_id),
          name_ko: String(b.name_ko).slice(0, 200), name_en: String(b.name_en || b.name_ko).slice(0, 200),
          description_ko: String(b.description_ko || ''), description_en: String(b.description_en || b.description_ko || ''),
          material_ko: String(b.material_ko || '').slice(0, 200), material_en: String(b.material_en || b.material_ko || '').slice(0, 200),
          price, discount_price: discount, gender: ['men', 'women', 'unisex'].includes(b.gender) ? b.gender : 'women',
          best_rank: (b.best_rank === '' || b.best_rank == null) ? null : (Number.isInteger(Number(b.best_rank)) && Number(b.best_rank) >= 0 ? Number(b.best_rank) : null),
          is_active: (b.status || 'active') === 'active', is_new: !!b.is_new, is_best: !!b.is_best,
          detail_blocks: detailBlocks || [],
        }).select().maybeSingle();
        if (e || !data) throw e || new Error('CREATE_FAILED');
        created = data;
      } catch (e) {
        // Name the integrity failure instead of a blanket 503: unique-SKU
        // races and dangling category FKs are the two realistic cases here.
        // 42703/42501 mean the live DB itself is behind (missing migration)
        // or denies writes (RLS/anon key) — both undiagnosable from the UI
        // unless named, so they get their own codes. Note PostgREST reports
        // schema drift in its own words ("Could not find the 'x' column ...
        // in the schema cache", PGRST204) rather than raw PG codes.
        const msg = String(e?.message || '');
        const code = String(e?.code || '');
        if (code === '42703' || code === 'PGRST204'
          || /column .* does not exist|undefined_column/i.test(msg)
          || /could not find the .* column|schema cache/i.test(msg)) {
          console.error('PRODUCT_CREATE schema mismatch', code, msg.slice(0, 200));
          return error(res, 503, 'SCHEMA_MISMATCH');
        }
        if (code === '42501' || e?.status === 401 || e?.status === 403
          || /permission denied|row-level security|\brls\b|not allowed by|policy|jwt|expired|unauthorized/i.test(msg)) {
          console.error('PRODUCT_CREATE permission denied', code, msg.slice(0, 200));
          return error(res, 503, 'DB_PERMISSION');
        }
        if (e?.code === '23505' || /duplicate|unique/i.test(msg)) return error(res, 409, 'SKU_EXISTS');
        if (e?.code === '23503' || /foreign key|violates/i.test(msg)) return error(res, 400, 'CATEGORY_INVALID');
        throw e;
      }
      // Staged writes below run after the row exists (no transaction by design):
      // report WHICH stage failed so the UI can tell the admin the product may
      // already be in the list instead of inviting a duplicate-creating retry.
      try {
        await syncVariants(created.id, sku, b);
      } catch (e) {
        console.error('PRODUCT_CREATE variants failed for product', created.id, e?.message);
        return error(res, 503, 'VARIANT_FAILED');
      }
      try {
        await syncMedia(created.id, b.images);
      } catch (e) {
        console.error('PRODUCT_CREATE media failed for product', created.id, e?.message);
        return error(res, 503, 'MEDIA_FAILED');
      }
      await auditLog(req, 'PRODUCT_CREATE', { table: 'products', id: created.id });
      res.status(201).json({ success: true, data: await composeAdminProduct(created) });
    } catch (err) {
      console.error('PRODUCT_CREATE_FAILED', err?.message);
      error(res, err?.status === 409 ? 409 : 503, 'PRODUCT_CREATE_FAILED');
    }
  });

  app.put('/api/v1/admin/products/:id', ...need(R.catalog), async (req, res) => {
    try {
      const b = req.body || {};
      const { data: p } = await database().from('products').select('*').eq('id', req.params.id).maybeSingle();
      if (!p) return error(res, 404, 'PRODUCT_NOT_FOUND');
      const patch = {};
      if (b.name_ko !== undefined) {
        patch.name_ko = String(b.name_ko).slice(0, 200);
        if (b.name_en === undefined) patch.name_en = String(b.name_ko).slice(0, 200);
      }
      if (b.name_en !== undefined) patch.name_en = String(b.name_en).slice(0, 200);
      if (b.description_ko !== undefined) {
        patch.description_ko = String(b.description_ko);
        if (b.description_en === undefined) patch.description_en = String(b.description_ko);
      }
      if (b.description_en !== undefined) patch.description_en = String(b.description_en);
      if (b.material_ko !== undefined) {
        patch.material_ko = String(b.material_ko).slice(0, 200);
        if (b.material_en === undefined) patch.material_en = String(b.material_ko).slice(0, 200);
      }
      if (b.material_en !== undefined) patch.material_en = String(b.material_en).slice(0, 200);
      if (b.category_id !== undefined) patch.category_id = Number(b.category_id);
      if (b.price !== undefined) {
        if (!Number.isInteger(Number(b.price)) || Number(b.price) <= 0) return error(res, 400, 'INVALID_PRICE');
        patch.price = Number(b.price);
      }
      if (b.discount_price !== undefined) {
        const d = b.discount_price ? Number(b.discount_price) : null;
        const base = patch.price ?? p.price;
        if (d !== null && (!Number.isInteger(d) || d <= 0 || d >= base)) return error(res, 400, 'INVALID_DISCOUNT');
        patch.discount_price = d;
      }
      if (b.gender !== undefined) patch.gender = ['men', 'women', 'unisex'].includes(b.gender) ? b.gender : 'unisex';
      if (b.status !== undefined) patch.is_active = b.status === 'active';
      if (b.is_new !== undefined) patch.is_new = !!b.is_new;
      if (b.is_best !== undefined) patch.is_best = !!b.is_best;
      if (b.best_rank !== undefined) patch.best_rank = (b.best_rank === null || b.best_rank === '') ? null : (Number.isInteger(Number(b.best_rank)) && Number(b.best_rank) >= 0 ? Number(b.best_rank) : null);
      if (b.sku !== undefined) patch.sku = String(b.sku).toUpperCase().slice(0, 60);
      if (b.detail_blocks !== undefined) {
        const blocks = sanitizeDetailBlocks(b.detail_blocks);
        if (blocks === null) return error(res, 400, 'INVALID_DETAIL_BLOCKS');
        patch.detail_blocks = blocks;
      }
      if (Object.keys(patch).length) {
        const { error: e } = await database().from('products').update(patch).eq('id', p.id);
        if (e) throw e;
      }
      if (b.sizes !== undefined || b.colors !== undefined || b.variant_stock !== undefined) await syncVariants(p.id, patch.sku || p.sku, b);
      if (b.images !== undefined) await syncMedia(p.id, b.images);
      await auditLog(req, 'PRODUCT_UPDATE', { table: 'products', id: p.id });
      const { data: updated } = await database().from('products').select('*').eq('id', p.id).maybeSingle();
      res.json({ success: true, data: await composeAdminProduct(updated) });
    } catch (err) { error(res, err?.status === 409 ? 409 : 503, 'PRODUCT_UPDATE_FAILED'); }
  });

  app.patch('/api/v1/admin/products/:id/status', ...need(R.catalog), async (req, res) => {
    try {
      if (!['active', 'hidden'].includes(req.body?.status)) return error(res, 400, 'INVALID_STATUS');
      await database().from('products').update({ is_active: req.body.status === 'active' }).eq('id', req.params.id);
      res.json({ success: true, message: '상태가 변경되었습니다.', status: req.body.status });
    } catch { error(res, 503, 'PRODUCT_UPDATE_FAILED'); }
  });

  // Stock is product-total across variants; the delta is applied to the
  // fullest variant so the displayed total stays exact.
  app.patch('/api/v1/admin/products/:id/stock', ...need(R.catalog), async (req, res) => {
    try {
      const { data: variants } = await database().from('product_variants').select('id,stock').eq('product_id', req.params.id);
      if (!(variants || []).length) return error(res, 404, 'NO_VARIANTS');
      const total = variants.reduce((s, v) => s + (v.stock || 0), 0);
      const target = req.body?.newStock !== undefined && req.body?.newStock !== null
        ? Number(req.body.newStock)
        : total + Number(req.body?.delta || 0);
      if (!Number.isInteger(target) || target < 0 || target > 99999) return error(res, 400, 'INVALID_STOCK');
      const primary = [...variants].sort((a, b) => (b.stock || 0) - (a.stock || 0))[0];
      await database().from('product_variants').update({ stock: Math.max(0, primary.stock + (target - total)) }).eq('id', primary.id);
      await auditLog(req, 'STOCK_ADJUST', { table: 'product_variants', id: primary.id, before: { total }, after: { total: target } });
      res.json({ success: true, message: '재고가 변경되었습니다.', stock: target });
    } catch { error(res, 503, 'STOCK_UPDATE_FAILED'); }
  });

  app.delete('/api/v1/admin/products/:id', ...need(R.catalog), async (req, res) => {
    try {
      const { data: variants } = await database().from('product_variants').select('id').eq('product_id', req.params.id);
      const ids = (variants || []).map(v => v.id);
      if (ids.length) {
        const { data: refs } = await database().from('order_items').select('variant_id').in('variant_id', ids).limit(1);
        if ((refs || []).length) {
          return res.status(409).json({ success: false, code: 'PRODUCT_ORDERED', message: '주문 내역이 있는 상품은 삭제할 수 없습니다. 먼저 상품을 숨김 처리하세요.' });
        }
      }
      // FK-safe order: delete referencing rows before the rows they reference.
      await database().from('product_media').delete().eq('product_id', req.params.id);
      await database().from('recently_viewed').delete().eq('product_id', req.params.id);
      if (ids.length) {
        await database().from('cart_items').delete().in('variant_id', ids);
        await database().from('inventory_ledger').delete().in('variant_id', ids);
        await database().from('product_variants').delete().in('id', ids);
      }
      await database().from('reviews').delete().eq('product_id', req.params.id);
      await database().from('wishlists').delete().eq('product_id', req.params.id);
      const { error: e } = await database().from('products').delete().eq('id', req.params.id);
      if (e) throw e;
      await auditLog(req, 'PRODUCT_DELETE', { table: 'products', id: req.params.id });
      res.json({ success: true, message: '상품이 삭제되었습니다.' });
    } catch (e) {
      console.error('PRODUCT_DELETE error:', e);
      error(res, 503, 'PRODUCT_DELETE_FAILED');
    }
  });

  // ---------- Categories ----------
  app.get('/api/v1/admin/categories', ...need(R.catalog), async (req, res) => {
    try {
      const { data: cats } = await database().from('categories').select('*').order('sort_order').order('id');
      const { data: counts } = await database().from('products').select('category_id');
      const n = {};
      for (const p of (counts || [])) n[p.category_id] = (n[p.category_id] || 0) + 1;
      res.json({ success: true, data: (cats || []).map(c => ({ ...c, product_count: n[c.id] || 0 })) });
    } catch { error(res, 503, 'CATEGORIES_UNAVAILABLE'); }
  });

  app.post('/api/v1/admin/categories', ...need(R.catalog), async (req, res) => {
    try {
      const b = req.body || {};
      const slug = String(b.slug || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (!slug || !b.name_ko) return error(res, 400, 'SLUG_NAME_REQUIRED');
      const { data, error: e } = await database().from('categories').insert({
        slug, name_ko: String(b.name_ko).slice(0, 100), name_en: String(b.name_en || b.name_ko).slice(0, 100),
        description_ko: String(b.description_ko || '').slice(0, 500), description_en: String(b.description_en || b.description_ko || '').slice(0, 500),
        image_url: String(b.image_url || '').slice(0, 500),
        gender: ['unisex','men','women'].includes(b.gender) ? b.gender : 'unisex',
        is_active: b.is_active === undefined ? true : !!b.is_active,
        sort_order: Number(b.sort_order || 0),
      }).select().maybeSingle();
      if (e) {
        if (String(e.message || '').includes('duplicate') || e.code === '23505') return error(res, 400, 'SLUG_EXISTS');
        throw e;
      }
      await auditLog(req, 'CATEGORY_CREATE', { table: 'categories', id: data.id });
      res.status(201).json({ success: true, data });
    } catch { error(res, 503, 'CATEGORY_CREATE_FAILED'); }
  });

  app.put('/api/v1/admin/categories/:id', ...need(R.catalog), async (req, res) => {
    try {
      const b = req.body || {};
      const patch = {};
      if (b.slug !== undefined) {
        const slug = String(b.slug).toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (!slug) return error(res, 400, 'INVALID_SLUG');
        patch.slug = slug;
      }
      if (b.name_ko !== undefined) {
        patch.name_ko = String(b.name_ko).slice(0, 100);
        if (b.name_en === undefined) patch.name_en = String(b.name_ko).slice(0, 100);
      }
      if (b.name_en !== undefined) patch.name_en = String(b.name_en).slice(0, 100);
      if (b.description_ko !== undefined) {
        patch.description_ko = String(b.description_ko).slice(0, 500);
        if (b.description_en === undefined) patch.description_en = String(b.description_ko).slice(0, 500);
      }
      if (b.description_en !== undefined) patch.description_en = String(b.description_en).slice(0, 500);
      if (b.image_url !== undefined) patch.image_url = String(b.image_url).slice(0, 500);
      if (b.gender !== undefined) patch.gender = ['unisex','men','women'].includes(b.gender) ? b.gender : 'unisex';
      if (b.is_active !== undefined) patch.is_active = !!b.is_active;
      if (b.sort_order !== undefined) patch.sort_order = Number(b.sort_order) || 0;
      const { data, error: e } = await database().from('categories').update(patch).eq('id', req.params.id).select().maybeSingle();
      if (e || !data) return error(res, e ? 400 : 404, e ? 'CATEGORY_UPDATE_FAILED' : 'CATEGORY_NOT_FOUND');
      await auditLog(req, 'CATEGORY_UPDATE', { table: 'categories', id: req.params.id });
      res.json({ success: true, data });
    } catch { error(res, 503, 'CATEGORY_UPDATE_FAILED'); }
  });

  app.patch('/api/v1/admin/categories/reorder', ...need(R.catalog), async (req, res) => {
    try {
      const ids = req.body?.orderedIds;
      if (!Array.isArray(ids)) return error(res, 400, 'IDS_REQUIRED');
      for (let i = 0; i < ids.length; i++) {
        await database().from('categories').update({ sort_order: i + 1 }).eq('id', ids[i]);
      }
      await auditLog(req, 'CATEGORY_REORDER', { table: 'categories', id: 'bulk' });
      res.json({ success: true });
    } catch { error(res, 503, 'CATEGORY_REORDER_FAILED'); }
  });

  app.delete('/api/v1/admin/categories/:id', ...need(R.catalog), async (req, res) => {
    try {
      const { data: refs } = await database().from('products').select('id').eq('category_id', req.params.id).limit(1);
      if ((refs || []).length) return error(res, 400, 'CATEGORY_IN_USE');
      const { error: e } = await database().from('categories').delete().eq('id', req.params.id);
      if (e) throw e;
      await auditLog(req, 'CATEGORY_DELETE', { table: 'categories', id: req.params.id });
      res.json({ success: true });
    } catch { error(res, 503, 'CATEGORY_DELETE_FAILED'); }
  });

  // ---------- Coupons (supports fixed-amount and percentage with max cap) ----------
  // is_active is derived from the validity window.
  function toLegacyCoupon(c) {
    if (!c) return null;
    return {
      id: c.code, code: c.code, description_ko: c.description_ko || '', description_en: c.description_en || '',
      discount_type: c.discount_type || 'fixed', discount_value: c.amount,
      min_order_amount: c.minimum, max_discount_amount: c.max_discount ?? null,
      start_date: String(c.starts_at || '').slice(0, 10), end_date: String(c.ends_at || '').slice(0, 10),
      usage_limit: c.limit_count, times_used: c.used,
      is_active: c.ends_at && c.starts_at ? (new Date(c.starts_at) <= new Date() && new Date(c.ends_at) >= new Date()) : (c.ends_at ? new Date(c.ends_at) >= new Date() : true),
    };
  }

  function couponFromLegacy(b, isCreate) {
    const type = b.discount_type === undefined || b.discount_type === '' ? (isCreate ? 'fixed' : undefined) : String(b.discount_type);
    if (type !== undefined && type !== 'fixed' && type !== 'percentage') {
      return { error: 'INVALID_DISCOUNT_TYPE' };
    }
    const amount = Number(b.discount_value);
    if (isCreate && (!b.code || !Number.isInteger(amount) || amount <= 0)) return { error: 'CODE_AMOUNT_REQUIRED' };
    if (b.discount_value !== undefined) {
      if (!Number.isInteger(amount) || amount <= 0) return { error: 'INVALID_AMOUNT' };
      if ((type || 'fixed') === 'percentage' && amount > 100) return { error: 'INVALID_PERCENTAGE' };
    }
    let maxDiscount = null;
    if (b.max_discount_amount !== undefined && b.max_discount_amount !== '' && b.max_discount_amount !== null) {
      maxDiscount = Number(b.max_discount_amount);
      if (!Number.isInteger(maxDiscount) || maxDiscount <= 0) return { error: 'INVALID_MAX_DISCOUNT' };
    }
    const row = {};
    if (type !== undefined) row.discount_type = type;
    if (b.code !== undefined) row.code = String(b.code).toUpperCase().trim();
    if (b.discount_value !== undefined) row.amount = amount;
    if (maxDiscount !== null) row.max_discount = maxDiscount;
    else if (b.max_discount_amount === '' || b.max_discount_amount === null) row.max_discount = null;
    if (b.description_ko !== undefined) row.description_ko = String(b.description_ko).slice(0, 200);
    if (b.description_en !== undefined) row.description_en = String(b.description_en).slice(0, 200);
    if (b.min_order_amount !== undefined) row.minimum = Math.max(0, Number(b.min_order_amount) || 0);
    // Dates are KST day boundaries (admin intent): start = 00:00+09:00,
    // end = end-of-day 23:59:59+09:00. Explicit null clears the bound;
    // ''/undefined leaves it unchanged (differs from max_discount/minimum).
    const parseCouponDate = (v, endOfDay) => { if (v === undefined || v === null || v === '') return v === null ? null : undefined; const s = String(v).slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return 'INVALID'; const d = new Date(`${s}T${endOfDay ? '23:59:59.999' : '00:00:00'}+09:00`); return Number.isNaN(d.getTime()) ? 'INVALID' : d.toISOString(); };
    if (b.start_date !== undefined && b.start_date !== '') { const d = parseCouponDate(b.start_date, false); if (d === 'INVALID') return { error: 'INVALID_START_DATE' }; if (d !== undefined) row.starts_at = d; }
    if (b.start_date === null && !isCreate) row.starts_at = null;
    if (b.end_date !== undefined && b.end_date !== '') { const d = parseCouponDate(b.end_date, true); if (d === 'INVALID') return { error: 'INVALID_END_DATE' }; if (d !== undefined) row.ends_at = d; }
    if (b.end_date === null && !isCreate) row.ends_at = null;
    if (b.start_date !== undefined && b.end_date !== undefined && b.start_date !== '' && b.end_date !== '' && b.start_date !== null && b.end_date !== null && row.starts_at && row.ends_at && row.starts_at > row.ends_at) return { error: 'INVALID_DATE_RANGE' };
    if (b.usage_limit !== undefined && b.usage_limit !== '' && b.usage_limit !== null) { const lim = Number(b.usage_limit); if (!Number.isInteger(lim) || lim < 1) return { error: 'INVALID_USAGE_LIMIT' }; row.limit_count = lim; }
    if (isCreate) {
      row.starts_at = row.starts_at || new Date().toISOString();
      row.ends_at = row.ends_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      row.minimum = row.minimum ?? 0;
      row.limit_count = row.limit_count ?? 1000;
    }
    return { row };
  }

  app.get('/api/v1/admin/coupons', ...need(R.catalog), async (req, res) => {
    try {
      const { page, pageSize, offset, sort, order, search } = parseListQuery(req.query, {
        pageSize: 100, maxPageSize: 200, sort: 'code', order: 'asc',
      });
      const sortCol = pickSort(sort, ['code', 'ends_at'], 'code');
      const ascending = order === 'asc';
      let q = database().from('coupons').select('*', { count: 'exact' }).order(sortCol, { ascending }).range(offset, offset + pageSize - 1);
      if (search) q = q.ilike('code', `%${escapeIlike(search)}%`);
      const { data, error: e, count: total } = await q;
      if (e) throw e;
      res.json(pageEnvelope({ data: (data || []).map(toLegacyCoupon), total: total ?? (data || []).length, page, pageSize }));
    } catch { error(res, 503, 'COUPONS_UNAVAILABLE'); }
  });

  // Coupon pre-check for the manual-order modal: validates the code against
  // the current draft subtotal and returns the discount, so the admin sees
  // the result before saving. Same rules as the manual-create path.
  app.get('/api/v1/admin/coupons/validate', ...need(R.orders), async (req, res) => {
    try {
      const code = String(req.query.code || '').toUpperCase().trim();
      const subtotal = Number(req.query.subtotal || 0);
      if (!code) return error(res, 400, 'COUPON_CODE_REQUIRED');
      if (!Number.isFinite(subtotal) || subtotal < 0) return error(res, 400, 'INVALID_SUBTOTAL');
      const { data: coupon } = await database().from('coupons').select('*').eq('code', code).maybeSingle();
      if (!coupon) return error(res, 404, 'COUPON_INVALID');
      const today = new Date().toISOString();
      if (coupon.starts_at > today || coupon.ends_at < today) return error(res, 400, 'COUPON_EXPIRED');
      if (((coupon.used || 0) + (coupon.reserved || 0)) >= coupon.limit_count) return error(res, 400, 'COUPON_LIMIT_REACHED');
      if (subtotal < (coupon.minimum || 0)) return error(res, 400, 'COUPON_MINIMUM_NOT_MET');
      res.json({ success: true, data: { code: coupon.code, discount: couponDiscount(subtotal, coupon) } });
    } catch { error(res, 503, 'COUPONS_UNAVAILABLE'); }
  });

  app.post('/api/v1/admin/coupons', ...need(R.catalog), async (req, res) => {
    try {
      const { row, error: err } = couponFromLegacy(req.body || {}, true);
      if (err) return error(res, 400, err);
      const { data, error: e } = await database().from('coupons').insert(row).select().maybeSingle();
      if (e) {
        if (e.code === '23505') return error(res, 400, 'CODE_EXISTS');
        throw e;
      }
      await auditLog(req, 'COUPON_CREATE', { table: 'coupons', id: row.code });
      res.status(201).json({ success: true, data: toLegacyCoupon(data) });
    } catch { error(res, 503, 'COUPON_CREATE_FAILED'); }
  });

  app.put('/api/v1/admin/coupons/:id', ...need(R.catalog), async (req, res) => {
    try {
      const { row, error: err } = couponFromLegacy(req.body || {}, false);
      if (err) return error(res, 400, err);
      delete row.code;
      // Validate the resulting (type, amount) pair and date range against
      // the stored row: a type-only update must not create e.g. 5000%
      // (type-swap bypass), and a single-side date update must not invert
      // the stored opposite bound.
      if (row.discount_type !== undefined || row.amount !== undefined || row.starts_at !== undefined || row.ends_at !== undefined) {
        const { data: stored } = await database().from('coupons').select('discount_type,amount,starts_at,ends_at').eq('code', decodeURIComponent(req.params.id)).maybeSingle();
        if (!stored) return error(res, 404, 'COUPON_NOT_FOUND');
        const effType = row.discount_type ?? stored.discount_type;
        const effAmount = row.amount ?? stored.amount;
        if (effType === 'percentage' && effAmount > 100) return error(res, 400, 'INVALID_PERCENTAGE');
        const effStart = row.starts_at !== undefined ? row.starts_at : stored.starts_at;
        const effEnd = row.ends_at !== undefined ? row.ends_at : stored.ends_at;
        if (effStart && effEnd && effStart > effEnd) return error(res, 400, 'INVALID_DATE_RANGE');
      }
      const { data, error: e } = await database().from('coupons').update(row).eq('code', decodeURIComponent(req.params.id)).select().maybeSingle();
      if (e || !data) return error(res, e ? 400 : 404, e ? 'COUPON_UPDATE_FAILED' : 'COUPON_NOT_FOUND');
      await auditLog(req, 'COUPON_UPDATE', { table: 'coupons', id: data.code });
      res.json({ success: true, data: toLegacyCoupon(data) });
    } catch { error(res, 503, 'COUPON_UPDATE_FAILED'); }
  });

  app.delete('/api/v1/admin/coupons/:id', ...need(R.catalog), async (req, res) => {
    try {
      await database().from('coupons').delete().eq('code', decodeURIComponent(req.params.id));
      await auditLog(req, 'COUPON_DELETE', { table: 'coupons', id: req.params.id });
      res.json({ success: true });
    } catch { error(res, 503, 'COUPON_DELETE_FAILED'); }
  });
  // ---------- Orders ----------
  function toAdminOrder(o, items, names, extra = {}) {
    const addr = o.address || {};
    const derivedPay = o.status === 'paid' ? 'paid' : o.status === 'pending_payment' ? 'pending_payment' : o.status;
    const media = extra.media || {};
    const ship = extra.ship || null;
    return {
      id: o.id, order_number: o.order_number, created_at: o.created_at,
      order_source: normalizeOrderSource(o.order_source),
      source_detail: o.source_detail || '',
      customer_name: addr.recipient || '', customer_email: addr.email || extra.email || '', customer_phone: addr.phone || '',
      postal_code: addr.postal_code || '', address: addr.address || '',
      detail_address: addr.detail_address || '', shipping_memo: addr.shipping_memo || '',
      subtotal: o.subtotal, discount_amount: o.discount, coupon_code: o.coupon_code,
      shipping_fee: o.shipping, total_amount: o.amount,
      payment_method: 'toss_card', payment_status: derivedPay, order_status: o.status,
      payment_receipt_url: null, payment_sender_name: '', verified_by: null, verified_at: null,
      payment_admin_notes: null,
      courier_name: ship?.courier_name || '', tracking_number: ship?.tracking_number || '',
      paid_at: ['paid', 'processing', 'shipped', 'delivered'].includes(o.status) ? o.created_at : null,
      items: (items || []).map(i => ({
        product_name_ko: names?.[i.variant_id]?.name_ko || i.snapshot?.sku || '',
        product_name_en: names?.[i.variant_id]?.name_en || '',
        product_sku: i.snapshot?.sku || '',
        image_url: media[i.variant_id] || '', price: i.unit_price, quantity: i.quantity,
        size: i.snapshot?.size || '', color: i.snapshot?.color || '',
      })),
    };
  }

  // Batched list projection: 5 queries total regardless of page size
  // (replaces the per-row adminOrderDetail N+1 in the list endpoint).
  async function adminOrderList(orderRows) {
    const rows = orderRows || [];
    if (!rows.length) return [];
    const ids = rows.map(o => o.id);
    const [{ data: items }, { data: shipments }, { data: profiles }] = await Promise.all([
      database().from('order_items').select('*').in('order_id', ids).then(r => r, () => ({ data: [] })),
      database().from('shipments').select('order_id,courier_name,tracking_number,created_at').in('order_id', ids).order('created_at', { ascending: false }).then(r => r, () => ({ data: [] })),
      database().from('profiles').select('id,email').in('id', [...new Set(rows.map(o => o.user_id))]).then(r => r, () => ({ data: [] })),
    ]);
    const list = items || [];
    const vids = [...new Set(list.map(i => i.variant_id).filter(Boolean))];
    let names = {};
    let media = {};
    if (vids.length) {
      const { data: vars } = await database().from('product_variants').select('id,product_id,products(name_ko,name_en)').in('id', vids).then(r => r, () => ({ data: [] }));
      const pidByVid = {};
      for (const v of (vars || [])) { names[v.id] = v.products || {}; if (v.product_id) pidByVid[v.id] = v.product_id; }
      const pids = [...new Set(Object.values(pidByVid))];
      if (pids.length) {
        const { data: mediaRows } = await database().from('product_media').select('product_id,url,sort_order').in('product_id', pids).order('sort_order').then(r => r, () => ({ data: [] }));
        const firstByProduct = new Map();
        for (const m of (mediaRows || [])) {
          if (!firstByProduct.has(m.product_id)) firstByProduct.set(m.product_id, m.url);
        }
        for (const [vid, pid] of Object.entries(pidByVid)) {
          if (firstByProduct.has(pid)) media[vid] = firstByProduct.get(pid);
        }
      }
    }
    const emailByUser = Object.fromEntries(((profiles || []).map(p => [p.id, p.email])));
    const itemsByOrder = new Map();
    for (const it of list) {
      if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
      itemsByOrder.get(it.order_id).push(it);
    }
    const shipByOrder = new Map();
    for (const s of (shipments || [])) {
      if (!shipByOrder.has(s.order_id)) shipByOrder.set(s.order_id, s);
    }
    return rows.map(o => toAdminOrder(o, itemsByOrder.get(o.id) || [], names, {
      media, ship: shipByOrder.get(o.id) || null, email: emailByUser[o.user_id] || '',
    }));
  }

  async function adminOrderDetail(orderId) {
    const { data: order } = await database().from('orders').select('*').eq('id', orderId).maybeSingle();
    if (!order) return null;
    const { data: items } = await database().from('order_items').select('*').eq('order_id', orderId);
    const vids = [...new Set((items || []).map(i => i.variant_id))];
    let names = {};
    if (vids.length) {
      const { data: vars } = await database().from('product_variants').select('id,product_id,products(name_ko,name_en)').in('id', vids);
      for (const v of (vars || [])) names[v.id] = v.products || {};
    }
    return toAdminOrder(order, items, names);
  }

  app.get('/api/v1/admin/orders', ...need(R.orders), async (req, res) => {
    try {
      const { status, payment_status, source } = req.query;
      const { page, pageSize, offset, sort, order, search } = parseListQuery(req.query, {
        pageSize: 100, maxPageSize: 200, sort: 'created_at', order: 'desc',
      });
      const sortCol = pickSort(sort, ['created_at', 'amount'], 'created_at');
      const ascending = order === 'asc';
      let q = database().from('orders').select('*', { count: 'exact' }).order(sortCol, { ascending })
        .range(offset, offset + pageSize - 1);
      // UI labels predate the DB enum: map legacy display values to real
      // statuses (pending_verification = awaiting deposit = pending_payment).
      const STATUS_ALIASES = { cancelled: 'canceled', pending_verification: 'pending_payment', confirmed: 'paid' };
      if (status && status !== 'all') q = q.eq('status', STATUS_ALIASES[status] || status);
      if (payment_status && payment_status !== 'all') {
        if (payment_status === 'paid') q = q.eq('status', 'paid');
        else if (payment_status === 'pending_payment' || payment_status === 'under_review') q = q.eq('status', 'pending_payment');
      }
      if (source && source !== 'all') {
        if (isValidOrderSource(source)) q = q.eq('order_source', String(source).toLowerCase());
        else return error(res, 400, 'INVALID_SOURCE');
      }
      if (search) {
        const safe = escapeIlike(search);
        // Name/phone live in the address jsonb snapshot — match the UI
        // placeholder (order no, customer name, depositor, phone).
        const namePhone = `,address->>recipient.ilike.%${safe}%,address->>phone.ilike.%${safe}%`;
        // orders.id is a uuid: only attempt the equality arm for uuid-shaped
        // input, otherwise a raw string 400s the whole listing.
        const orClause = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search.trim())
          ? `order_number.ilike.%${safe}%,id.eq.${search.trim()}${namePhone}`
          : `order_number.ilike.%${safe}%${namePhone}`;
        if (safe) q = q.or(orClause);
      }
      const { data, error: e, count: total } = await q;
      if (e) {
        // Pre-migration DBs lack order_source — retry without the source filter.
        if (source && source !== 'all' && String(e.message || '').includes('order_source')) {
          let fallback = database().from('orders').select('*').order(sortCol, { ascending })
            .range(offset, offset + pageSize - 1);
          if (status && status !== 'all') fallback = fallback.eq('status', status === 'cancelled' ? 'canceled' : status);
          const { data: fb, error: fbErr } = await fallback;
          if (fbErr) throw fbErr;
          const out = await adminOrderList((fb || []).filter(o => normalizeOrderSource(o.order_source) === String(source).toLowerCase()));
          // fb is already range-limited, so out is a single page here.
          res.json(pageEnvelope({ data: out, total: out.length, page, pageSize }));
          return;
        }
        throw e;
      }
      const out = await adminOrderList(data || []);
      res.json(pageEnvelope({ data: out, total: total ?? out.length, page, pageSize }));
    } catch { error(res, 503, 'ORDERS_UNAVAILABLE'); }
  });

  // Manual / external order creation (Instagram, TikTok, other).
  // Bank-transfer verify flow only: always starts pending_payment so stock is
  // reserved and payment is confirmed via the existing verify-payment path.
  // Placement is atomic via app.place_order (same as the storefront).
  app.post('/api/v1/admin/orders/manual', ...need(R.orders), async (req, res) => {
    try {
      const s = req.locals.session;
      const b = req.body || {};
      const orderSource = normalizeOrderSource(b.order_source);
      if (b.order_source !== undefined && !isValidOrderSource(b.order_source)) {
        return error(res, 400, 'INVALID_SOURCE');
      }
      const sourceDetail = String(b.source_detail || '').slice(0, 200);
      const customerName = String(b.customer_name || '').trim().slice(0, 60);
      const customerPhone = String(b.customer_phone || '').trim().slice(0, 30);
      const customerEmail = String(b.customer_email || '').trim().slice(0, 120);
      if (!customerName || !customerPhone) return error(res, 400, 'CUSTOMER_REQUIRED');
      const addr = b.address || {};
      const postal = String(addr.postal_code || b.postal_code || '').trim().slice(0, 20);
      const road = String(addr.address || b.address || '').trim().slice(0, 200);
      const detail = String(addr.detail_address || b.detail_address || '').trim().slice(0, 200);
      const memo = String(addr.shipping_memo || b.shipping_memo || '').trim().slice(0, 300);
      if (!postal || !road) return error(res, 400, 'ADDRESS_REQUIRED');
      const items = b.items;
      if (!items || !Array.isArray(items) || items.length === 0 || items.length > 50) {
        return error(res, 400, 'INVALID_ITEMS');
      }
      // Resolve variant_id from product_id + color + size when the picker
      // sent a legacy-shaped line without one (e.g. product data fetched
      // before the variants field existed, or a product with no variants).
      for (const it of items) {
        if (it && !it.variant_id && it.product_id) {
          const color = String(it.color || 'DEFAULT');
          const size = String(it.size || 'FREE');
          const { data: match } = await database().from('product_variants')
            .select('id')
            .eq('product_id', it.product_id)
            .eq('color', color)
            .eq('size', size)
            .maybeSingle();
          if (match) it.variant_id = match.id;
        }
      }
      for (const it of items) {
        if (!it || !Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 99) return error(res, 400, 'INVALID_ITEM');
        if (typeof it.variant_id !== 'string' || !it.variant_id) {
          // Line has product_id/color/size but no variant row matched it.
          if (it && it.product_id) return error(res, 404, 'VARIANT_UNAVAILABLE');
          return error(res, 400, 'INVALID_ITEM');
        }
      }
      const demand = new Map();
      for (const it of items) demand.set(it.variant_id, (demand.get(it.variant_id) || 0) + it.quantity);
      const ids = [...demand.keys()];
      const { data: variants } = await database().from('product_variants').select('*,products(*)').in('id', ids);
      if (!variants || variants.length !== ids.length) return error(res, 404, 'VARIANT_UNAVAILABLE');
      for (const [vid, qty] of demand) {
        const v = variants.find(x => x.id === vid);
        if (!v || v.active === false) return error(res, 400, 'VARIANT_UNAVAILABLE');
        if ((v.stock || 0) - (v.reserved || 0) < qty) return error(res, 409, 'INSUFFICIENT_STOCK');
      }
      let subtotal = 0;
      const lines = [];
      for (const it of items) {
        const v = variants.find(x => x.id === it.variant_id);
        const base = v.products || {};
        const unit = Math.max(1, (base.discount_price || base.price || 0) + (v.price_delta || 0));
        subtotal += unit * it.quantity;
        lines.push({ variant_id: v.id, quantity: it.quantity, unit_price: unit, snapshot: { sku: v.sku, color: v.color, size: v.size } });
      }
      let discount = 0;
      let couponCode = null;
      if (b.coupon_code) {
        const code = String(b.coupon_code).toUpperCase().trim();
        const { data: coupon } = await database().from('coupons').select('*').eq('code', code).maybeSingle();
        const today = new Date().toISOString();
        if (!coupon) return error(res, 400, 'COUPON_INVALID');
        if (coupon.starts_at > today || coupon.ends_at < today) return error(res, 400, 'COUPON_EXPIRED');
        if (((coupon.used || 0) + (coupon.reserved || 0)) >= coupon.limit_count) return error(res, 400, 'COUPON_LIMIT_REACHED');
        if (subtotal < (coupon.minimum || 0)) return error(res, 400, 'COUPON_MINIMUM_NOT_MET');
        discount = couponDiscount(subtotal, coupon);
        couponCode = coupon.code;
      }
      let threshold = 0;
      let fee = 0;
      const shippingFee = 0;
      const amount = subtotal - discount + shippingFee;
      if (amount < 1) return error(res, 400, 'MINIMUM_AMOUNT');
      // Link to an existing member when possible; otherwise the admin owns
      // the row and guest contact lives in address (user_id is NOT NULL).
      let ownerId = s.user_id;
      if (b.customer_id) {
        const { data: linked } = await database().from('profiles').select('id').eq('id', b.customer_id).maybeSingle();
        if (!linked) return error(res, 404, 'CUSTOMER_NOT_FOUND');
        ownerId = linked.id;
      }
      const address = {
        recipient: customerName, phone: customerPhone, email: customerEmail,
        postal_code: postal, address: road, detail_address: detail, shipping_memo: memo,
      };
      const number = `NE${Date.now().toString(36).toUpperCase()}${random().slice(2, 8).toUpperCase()}`;
      const idempotencyKey = `manual-${uid()}`;
      const requestHash = createHash('sha256').update(JSON.stringify({ items, coupon_code: couponCode, address, orderSource })).digest('hex');
      // P0 atomic placement: app.place_order validates stock + coupon under row
      // locks and writes order + items + outbox in one transaction, so concurrent
      // manual and storefront checkouts cannot oversell or over-redeem coupons.
      // Staff-only extras the RPC does not own (source, long SNS expiry) are
      // applied as a post-write update; coupon use here is staff-authorized.
      const tryPlaceOrderRpc = () => database().rpc('place_order', { p_user_id: ownerId, p_order_number: number, p_idempotency_key: idempotencyKey, p_request_hash: requestHash, p_subtotal: subtotal, p_discount: discount, p_shipping: shippingFee, p_amount: amount, p_coupon_code: couponCode, p_address: address, p_items: lines.map(l => ({ variant_id: l.variant_id, quantity: l.quantity, unit_price: l.unit_price, snapshot: l.snapshot || {} })) });
      const { data: placed, error: rpcError } = await tryPlaceOrderRpc();
      if (rpcError) throw rpcError;
      if (placed?.outcome === 'insufficient_stock') return error(res, 409, 'INSUFFICIENT_STOCK');
      if (placed?.outcome === 'coupon_invalid') return error(res, 400, 'COUPON_INVALID');
      if (placed?.outcome !== 'created') throw new Error('ORDER_CREATE_FAILED');
      const extras = { order_source: orderSource, source_detail: sourceDetail || null };
      if (orderSource !== 'website') {
        extras.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
      try {
        await database().from('orders').update(extras).eq('id', placed.order_id);
      } catch (extrasErr) {
        if (!String(extrasErr?.message || '').includes('order_source')) throw extrasErr;
        // Legacy DB without order_source columns: the atomic order stands on defaults.
      }
      const { data: order } = await database().from('orders').select('*').eq('id', placed.order_id).maybeSingle();
      if (!order) throw new Error('ORDER_CREATE_FAILED');
      await database().from('order_status_history').insert({
        order_id: order.id, status: 'pending_payment',
        note: `Manual order (${orderSource}) by admin`, actor_id: s.user_id,
      });
      await auditLog(req, 'MANUAL_ORDER_CREATE', { table: 'orders', id: order.id, after: { order_source: orderSource, amount } });
      res.status(201).json({ success: true, data: await adminOrderDetail(order.id) });
    } catch (e) {
      console.error('manual order create error', e);
      error(res, 503, 'ORDER_CREATE_FAILED');
    }
  });

  // Sales report by source: totals, unpaid, receipts pending, refunds + CSV.
  app.get('/api/v1/admin/reports/sales', ...need(R.dashboard), async (req, res) => {
    try {
      const { from, to, source, format } = req.query;
      const cap = Math.min(Math.max(Number(req.query.limit) || 1000, 1), 5000);
      let q = database().from('orders').select('id,order_number,status,amount,created_at,order_source').order('created_at', { ascending: false }).limit(cap);
      if (from) q = q.gte('created_at', String(from));
      if (to) q = q.lte('created_at', String(to));
      if (source && source !== 'all') {
        if (!isValidOrderSource(source)) return error(res, 400, 'INVALID_SOURCE');
        q = q.eq('order_source', String(source).toLowerCase());
      }
      let { data: orders, error: e } = await q;
      if (e) {
        if (String(e.message || '').includes('order_source')) {
          const retry = await database().from('orders').select('id,order_number,status,amount,created_at').order('created_at', { ascending: false }).limit(1000);
          if (retry.error) throw retry.error;
          orders = retry.data;
        } else {
          throw e;
        }
      }
      const rows = buildSalesBySource(orders || []);
      const filtered = (source && source !== 'all')
        ? rows.filter(r => r.source === String(source).toLowerCase())
        : rows;
      const unpaidCount = (orders || []).filter(o => ['pending_payment', 'confirming'].includes(o.status)).length;
      const receiptPending = (orders || []).filter(o => o.status === 'confirming').length;
      if (format === 'csv') {
        const csv = salesBySourceToCsv(filtered);
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.set('Content-Disposition', 'attachment; filename="sales-by-source.csv"');
        res.send(csv);
        return;
      }
      res.json({
        success: true,
        data: {
          bySource: filtered,
          totals: {
            orders: (orders || []).length,
            revenue: filtered.reduce((s, r) => s + r.revenue_paid, 0),
            unpaid: unpaidCount,
            receiptPending,
          },
        },
      });
    } catch (err) {
      console.error('sales report error', err);
      error(res, 503, 'REPORT_UNAVAILABLE');
    }
  });

  app.get('/api/v1/admin/orders/:id', ...need(R.orders), async (req, res) => {
    try {
      const detail = await adminOrderDetail(req.params.id);
      if (!detail) return error(res, 404, 'ORDER_NOT_FOUND');
      res.json({ success: true, data: detail });
    } catch { error(res, 503, 'ORDERS_UNAVAILABLE'); }
  });

  // Command endpoint: fulfillment transitions only. paid is NEVER assigned
  // here — only the verified Toss confirm path produces paid (Wave 2).
  app.patch('/api/v1/admin/orders/:id/status', ...need(R.orders), async (req, res) => {
    try {
      const next = req.body?.order_status;
      const { data: order } = await database().from('orders').select('status').eq('id', req.params.id).maybeSingle();
      if (!order) return error(res, 404, 'ORDER_NOT_FOUND');
      const allowed = {
        pending_payment: ['canceled'],
        paid: ['processing'],
        processing: ['shipped', 'delivered'],
        shipped: ['delivered'],
      };
      if (!allowed[order.status]?.includes(next)) return error(res, 409, 'ORDER_STATE_INVALID');
      if (next === 'canceled') {
        const rel = await releaseHoldRpc({ p_order_id: req.params.id, p_from: ['pending_payment'], p_to: 'canceled', p_effect_key: `order-cancel:${req.params.id}`, p_kind: 'ORDER_CANCELED' });
        if (!rel || (rel.outcome !== 'released' && rel.outcome !== 'already')) return error(res, 409, 'ORDER_STATE_INVALID');
      } else {
        const { data: claimed } = await database().from('orders').update({ status: next }).eq('id', req.params.id).eq('status', order.status).select('id').maybeSingle();
        if (!claimed) return error(res, 409, 'ORDER_STATE_INVALID');
        await database().from('order_status_history').insert({ order_id: req.params.id, status: next, note: 'Admin transition', actor_id: req.locals.session.user_id });
      }
      await auditLog(req, 'ORDER_STATUS', { table: 'orders', id: req.params.id, before: { status: order.status }, after: { status: next } });
      res.json({ success: true, message: `주문 상태가 '${next}'(으)로 변경되었습니다.`, data: await adminOrderDetail(req.params.id) });
    } catch { error(res, 503, 'ORDERS_UNAVAILABLE'); }
  });

  // Payment verification: approve advances paid→processing (fulfillment
  // readiness). It can never mark an unpaid order paid. Reject cancels.
  app.patch('/api/v1/admin/orders/:id/verify-payment', authenticate, staff(R.money), stepUp, async (req, res) => {
    try {
      const action = req.body?.action || 'approve';
      const { data: order } = await database().from('orders').select('*').eq('id', req.params.id).maybeSingle();
      if (!order) return error(res, 404, 'ORDER_NOT_FOUND');
      if (action === 'approve') {
        if (order.status !== 'paid') return error(res, 409, 'VERIFY_NOT_APPLICABLE');
        await database().from('orders').update({ status: 'processing' }).eq('id', order.id).eq('status', 'paid');
        await database().from('order_status_history').insert({ order_id: order.id, status: 'processing', note: 'Payment verified, fulfillment started', actor_id: req.locals.session.user_id });
        await auditLog(req, 'PAYMENT_VERIFY', { table: 'orders', id: order.id });
        res.json({ success: true, message: '입금이 성공적으로 승인 확인되었습니다. 주문이 확정되었습니다.', data: await adminOrderDetail(order.id) });
      } else {
        if (action !== 'reject' || order.status !== 'pending_payment') return error(res, 409, 'USE_PG_REFUND');
        const rel = await releaseHoldRpc({ p_order_id: order.id, p_from: ['pending_payment'], p_to: 'canceled', p_effect_key: `order-cancel:${order.id}`, p_kind: 'ORDER_CANCELED' });
        if (!rel || (rel.outcome !== 'released' && rel.outcome !== 'already')) return error(res, 409, 'ORDER_NOT_CANCELLABLE');
        await auditLog(req, 'PAYMENT_REJECT', { table: 'orders', id: order.id, after: { notes: req.body?.notes || null } });
        res.json({ success: true, message: '입금 확인이 반려 처리되었습니다.', data: await adminOrderDetail(order.id) });
      }
    } catch { error(res, 503, 'ORDERS_UNAVAILABLE'); }
  });

  app.patch('/api/v1/admin/orders/:id/tracking', ...need(R.orders), async (req, res) => {
    try {
      const courier = String(req.body?.courier_name || '').trim();
      const tracking = String(req.body?.tracking_number || '').trim();
      if (!courier || !tracking) return error(res, 400, 'COURIER_TRACKING_REQUIRED');
      const { data: order } = await database().from('orders').select('status').eq('id', req.params.id).maybeSingle();
      if (!order) return error(res, 404, 'ORDER_NOT_FOUND');
      if (!['paid', 'processing'].includes(order.status)) return error(res, 409, 'ORDER_NOT_SHIPPABLE');
      const { data: shipment } = await database().from('shipments').insert({ order_id: req.params.id, courier_name: courier, tracking_number: tracking, status: 'dispatched' }).select().maybeSingle();
      await database().from('orders').update({ status: 'shipped' }).eq('id', req.params.id).in('status', ['paid', 'processing']);
      await database().from('order_status_history').insert({ order_id: req.params.id, status: 'shipped', note: 'Shipment dispatched', actor_id: req.locals.session.user_id });
      await auditLog(req, 'ORDER_TRACKING', { table: 'orders', id: req.params.id });
      res.json({ success: true, message: '운송장 정보가 등록되었습니다.', data: shipment });
    } catch { error(res, 503, 'ORDERS_UNAVAILABLE'); }
  });

  // ---------- Reviews ----------
  app.get('/api/v1/admin/reviews', ...need(R.catalog), async (req, res) => {
    try {
      const { status } = req.query;
      const { page, pageSize, offset, sort, order, search } = parseListQuery(req.query, {
        pageSize: 100, maxPageSize: 200, sort: 'created_at', order: 'desc',
      });
      const sortCol = pickSort(sort, ['created_at', 'rating'], 'created_at');
      const ascending = order === 'asc';
      let q = database().from('reviews').select('*', { count: 'exact' }).order(sortCol, { ascending }).range(offset, offset + pageSize - 1);
      if (status === 'approved') q = q.eq('is_approved', true);
      else if (status === 'pending') q = q.eq('is_approved', false);
      else if (status === 'featured') q = q.eq('is_featured', true);
      if (search) q = q.ilike('comment', `%${escapeIlike(search)}%`);
      const { data: reviews, count: total } = await q.then(r => r, () => ({ data: [], count: 0 }));
      const pids = [...new Set((reviews || []).map(r => r.product_id))];
      let byId = {};
      if (pids.length) {
        const { data: prods } = await database().from('products').select('id,sku,name_ko,name_en').in('id', pids);
        byId = Object.fromEntries((prods || []).map(p => [p.id, p]));
      }
      res.json(pageEnvelope({
        data: (reviews || []).map(r => ({
          ...r,
          product_name_ko: byId[r.product_id]?.name_ko || '',
          product_name_en: byId[r.product_id]?.name_en || '',
          product_sku: byId[r.product_id]?.sku || '',
          product_images: [],
          is_approved: !!r.is_approved,
          is_featured: !!r.is_featured,
        })),
        total: total ?? (reviews || []).length,
        page,
        pageSize,
      }));
    } catch { error(res, 503, 'REVIEWS_UNAVAILABLE'); }
  });

  app.patch('/api/v1/admin/reviews/:id/status', ...need(R.catalog), async (req, res) => {
    try {
      await database().from('reviews').update({ is_approved: !!req.body?.is_approved }).eq('id', req.params.id);
      await auditLog(req, 'REVIEW_MODERATE', { table: 'reviews', id: req.params.id });
      res.json({ success: true, message: '리뷰 상태가 변경되었습니다.' });
    } catch { error(res, 503, 'REVIEWS_UNAVAILABLE'); }
  });

  app.patch('/api/v1/admin/reviews/:id/feature', ...need(R.catalog), async (req, res) => {
    try {
      await database().from('reviews').update({ is_featured: !!req.body?.is_featured }).eq('id', req.params.id);
      await auditLog(req, 'REVIEW_FEATURE', { table: 'reviews', id: req.params.id });
      res.json({ success: true, message: '리뷰 노출 상태가 변경되었습니다.' });
    } catch { error(res, 503, 'REVIEWS_UNAVAILABLE'); }
  });

  app.delete('/api/v1/admin/reviews/:id', ...need(R.catalog), async (req, res) => {
    try {
      await database().from('reviews').delete().eq('id', req.params.id);
      await auditLog(req, 'REVIEW_DELETE', { table: 'reviews', id: req.params.id });
      res.json({ success: true });
    } catch { error(res, 503, 'REVIEWS_UNAVAILABLE'); }
  });
  // ---------- Media library (content 'media' doc) + uploads ----------
  const __adminDirname = path.dirname(fileURLToPath(import.meta.url));
  const uploadDir = path.join(__adminDirname, '../uploads');
  const MIME_TO_EXT = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };
  // Per-file validation happens in the handler (per-file results) — multer
  // only enforces a generous DoS guard (25 MB/file) and the request cap.
  const adminUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024, files: UPLOAD_MAX_FILES_PER_REQUEST },
  });

  function uploadFileProblem(file) {
    const name = file?.originalname || 'file';
    const ext = path.extname(name).toLowerCase().replace(/^\./, '');
    const mime = String(file?.mimetype || '').toLowerCase();
    if (!UPLOAD_ALLOWED_EXTENSIONS.includes(ext) || (mime && !UPLOAD_ALLOWED_MIME.has(mime))) {
      return { name, code: UPLOAD_FAILED_TYPE };
    }
    if (!file?.size || file.size > UPLOAD_MAX_FILE_BYTES) {
      return { name, code: file?.size ? UPLOAD_FAILED_TOO_LARGE : UPLOAD_FAILED_GENERIC };
    }
    return null;
  }

  function isStorageFullMessage(message) {
    return /quota|exceeded|storage.*(full|limit)|payload too large/i.test(String(message || ''));
  }

  function isHttpUrl(u) {
    try {
      const parsed = new URL(u);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch { return false; }
  }

  app.get('/api/v1/admin/media', ...need(R.catalog), async (req, res) => {
    try {
      const { page, pageSize, offset } = parseListQuery(req.query, { pageSize: 200, maxPageSize: 200 });
      const search = String(req.query.search || '').toLowerCase();
      const tag = String(req.query.tag || '').toLowerCase();
      let items = docList(await readDoc(database, 'media', []));
      if (search) items = items.filter(m => `${m.name} ${m.tags}`.toLowerCase().includes(search));
      if (tag) items = items.filter(m => String(m.tags || '').toLowerCase().includes(tag));
      res.json(pageEnvelope({ data: items.slice(offset, offset + pageSize), total: items.length, page, pageSize }));
    } catch { error(res, 503, 'MEDIA_UNAVAILABLE'); }
  });

  app.post('/api/v1/admin/media', ...need(R.catalog), async (req, res) => {
    try {
      const { name, url, tags } = req.body || {};
      if (!name || !url || !isHttpUrl(url)) return error(res, 400, 'NAME_URL_REQUIRED');
      const item = {
        id: uid(), name: String(name).slice(0, 200), url: String(url).slice(0, 500),
        file_type: 'image', size_bytes: 0, alt_text: String(name).slice(0, 200),
        tags: String(tags || ''), created_at: new Date().toISOString(),
      };
      await saveDocItem(database, 'media', item);
      res.status(201).json({ success: true, data: item });
    } catch { error(res, 503, 'MEDIA_UNAVAILABLE'); }
  });

  app.delete('/api/v1/admin/media/:id', ...need(R.catalog), async (req, res) => {
    try {
      await deleteDocItem(database, 'media', req.params.id);
      res.json({ success: true });
    } catch { error(res, 503, 'MEDIA_UNAVAILABLE'); }
  });

  // Per-file results: one bad file never fails the batch. Responds with
  // { uploaded: [...], failed: [{ name, code }] }; `data` mirrors `uploaded`
  // for older clients.
  app.post('/api/v1/admin/upload-multiple', authenticate, staff(R.catalog), adminUpload.array('images', UPLOAD_MAX_FILES_PER_REQUEST), async (req, res) => {
    try {
      if (!req.files || !req.files.length) return error(res, 400, UPLOAD_FAILED_EMPTY);
      const uploaded = [];
      const failed = [];
      // Try Supabase Storage (free-tier 1GB, 5GB bandwidth) if configured, fallback to local /uploads
      const bucket = process.env.MEDIA_BUCKET || 'product-media';
      let supabaseStorage = null;
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
          await sb.storage.createBucket(bucket, { public: true, fileSizeLimit: '8MB' }).catch(() => {});
          supabaseStorage = sb;
        } catch {}
      }
      if (!supabaseStorage) {
        console.error('Supabase storage unavailable for upload');
        return error(res, 503, UPLOAD_FAILED_STORAGE);
      }
      for (const file of req.files) {
        const problem = uploadFileProblem(file);
        if (problem) {
          failed.push(problem);
          continue;
        }
        let url = null;
        let storageError = null;
        try {
          const ext = path.extname(file.originalname) || MIME_TO_EXT[String(file.mimetype || '').toLowerCase()] || '.jpg';
          const objectPath = `products/${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
          const { error: upErr } = await supabaseStorage.storage.from(bucket).upload(objectPath, file.buffer, { contentType: file.mimetype || 'image/jpeg', upsert: false, cacheControl: '31536000' });
          if (upErr) {
            storageError = upErr;
          } else {
            const { data } = supabaseStorage.storage.from(bucket).getPublicUrl(objectPath);
            url = data.publicUrl;
          }
        } catch (e) {
          console.error('Supabase upload error', e?.message);
          storageError = e;
        }
        if (!url) {
          const msg = storageError?.message || '';
          failed.push({
            name: file.originalname,
            code: isStorageFullMessage(msg) ? UPLOAD_FAILED_STORAGE : UPLOAD_FAILED_GENERIC,
          });
          continue;
        }
        try {
          const item = {
            id: uid(), name: file.originalname, url,
            file_type: 'image', size_bytes: file.size, alt_text: file.originalname,
            tags: 'uploaded,product', created_at: new Date().toISOString(),
          };
          await saveDocItem(database, 'media', item);
          uploaded.push({ url: item.url, name: file.originalname, size: file.size });
        } catch (e) {
          console.error('Media doc save error', e?.message);
          failed.push({ name: file.originalname, code: UPLOAD_FAILED_GENERIC });
        }
      }
      res.json({
        success: true,
        message: failed.length
          ? `${uploaded.length}개 성공, ${failed.length}개 실패`
          : `${uploaded.length}개의 이미지가 업로드되었습니다.`,
        data: uploaded,
        uploaded,
        failed,
      });
    } catch (err) {
      console.error('Upload error', err);
      // Multer DoS-guard errors stay whole-request: oversized buffer / too many parts.
      if (err?.code === 'LIMIT_FILE_SIZE') return error(res, 400, UPLOAD_FAILED_TOO_LARGE);
      if (err?.code === 'LIMIT_FILE_COUNT' || err?.code === 'LIMIT_UNEXPECTED_FILE') {
        return error(res, 400, UPLOAD_FAILED_TOO_MANY);
      }
      error(res, 400, err?.message || UPLOAD_FAILED_GENERIC);
    }
  });

  // ---------- Content settings & banners ----------
  const SETTING_KEYS = ['payment_info', 'business_info', 'shipping_policy', 'header_config', 'about_story'];

  app.get('/api/v1/admin/content/settings', ...need(R.settings), async (req, res) => {
    try {
      const out = {};
      for (const key of SETTING_KEYS) out[key] = await readDoc(database, key, {});
      res.json({ success: true, data: out });
    } catch { error(res, 503, 'SETTINGS_UNAVAILABLE'); }
  });

  app.put('/api/v1/admin/content/settings', authenticate, staff(R.settings), stepUp, async (req, res) => {
    try {
      const settings = req.body?.settings;
      if (!settings || typeof settings !== 'object') return error(res, 400, 'SETTINGS_OBJECT_REQUIRED');
      for (const key of SETTING_KEYS) {
        if (settings[key] !== undefined) await writeDoc(database, key, settings[key]);
      }
      // Keep the checkout source of truth in sync with saved shipping policy.
      const sp = settings.shipping_policy;
      if (sp && Number.isFinite(Number(sp.threshold)) && Number.isFinite(Number(sp.fee))) {
        await writeDoc(database, 'shipping', { fee: Number(sp.fee), free_threshold: Number(sp.threshold) });
      }
      await auditLog(req, 'SETTINGS_UPDATE', { table: 'content', id: 'settings' });
      res.json({ success: true });
    } catch { error(res, 503, 'SETTINGS_UNAVAILABLE'); }
  });

  app.get('/api/v1/admin/content/banners', ...need(R.cms), async (req, res) => {
    try {
      const { page, pageSize, offset } = parseListQuery(req.query, { pageSize: 100, maxPageSize: 200 });
      const items = docList(await readDoc(database, 'banners', []));
      res.json(pageEnvelope({ data: items.slice(offset, offset + pageSize), total: items.length, page, pageSize }));
    } catch { error(res, 503, 'CONTENT_UNAVAILABLE'); }
  });

  // Banner fields any cms-role holder may write (no mass assignment:
  // unknown keys such as script-bearing extras are dropped).
  const BANNER_FIELDS = ['type', 'title_ko', 'title_en', 'subtitle_ko', 'subtitle_en', 'image_url', 'mobile_image_url', 'link_url', 'button_text_ko', 'button_text_en', 'start_date', 'end_date', 'sort_order', 'is_active'];
  function pickBanner(b) {
    const out = {};
    for (const k of BANNER_FIELDS) if (b[k] !== undefined) out[k] = b[k];
    if (out.sort_order !== undefined) out.sort_order = Number(out.sort_order) || 0;
    if (out.is_active !== undefined) out.is_active = !!out.is_active;
    return out;
  }

  function validBanner(b) {
    return b && b.type && b.title_ko && b.title_en;
  }

  app.post('/api/v1/admin/content/banners', ...need(R.cms), async (req, res) => {
    try {
      if (!validBanner(req.body)) return error(res, 400, 'TYPE_TITLE_REQUIRED');
      const b = req.body;
      const item = {
        id: uid(), type: b.type, title_ko: b.title_ko, title_en: b.title_en,
        subtitle_ko: b.subtitle_ko || '', subtitle_en: b.subtitle_en || '',
        image_url: b.image_url || '', mobile_image_url: b.mobile_image_url || '',
        link_url: b.link_url || '', button_text_ko: b.button_text_ko || '', button_text_en: b.button_text_en || '',
        start_date: b.start_date || null, end_date: b.end_date || null,
        sort_order: Number(b.sort_order || 0), is_active: b.is_active === undefined ? true : !!b.is_active,
      };
      await saveDocItem(database, 'banners', item);
      await auditLog(req, 'BANNER_CREATE', { table: 'content', id: item.id });
      res.status(201).json({ success: true, data: item });
    } catch { error(res, 503, 'CONTENT_UNAVAILABLE'); }
  });

  app.put('/api/v1/admin/content/banners/:id', ...need(R.cms), async (req, res) => {
    try {
      const existing = await findDocItem(database, 'banners', req.params.id);
      if (!existing) return error(res, 404, 'BANNER_NOT_FOUND');
      await saveDocItem(database, 'banners', { ...existing, ...pickBanner(req.body || {}), id: existing.id });
      res.json({ success: true });
    } catch { error(res, 503, 'CONTENT_UNAVAILABLE'); }
  });

  app.delete('/api/v1/admin/content/banners/:id', ...need(R.cms), async (req, res) => {
    try {
      await deleteDocItem(database, 'banners', req.params.id);
      res.json({ success: true });
    } catch { error(res, 503, 'CONTENT_UNAVAILABLE'); }
  });

  // Builder / menus / pages removed — lean cloth store (generic CMS retired)
}



