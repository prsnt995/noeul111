import { randomBytes, randomUUID } from 'node:crypto';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

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
  orders: ['super_admin', 'admin'],
  money: ['super_admin', 'admin'],
  cms: ['super_admin', 'admin'],
  settings: ['super_admin', 'admin'],
  customers: ['super_admin', 'admin'],
  dashboard: ['super_admin', 'admin'],
};

const random = () => randomBytes(6).toString('base64url');
const uid = () => randomUUID();

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

export function registerAdminRoutes(app, ctx) {
  const { database, error, auditLog, authenticate, staff, stepUp, releaseHoldRpc } = ctx;
  const need = roles => [authenticate, staff(roles)];

  // ---------- Dashboard — resilient, never 503 (free-tier cold start, empty tables) ----------
  app.get('/api/v1/admin/dashboard/stats', ...need(R.dashboard), async (req, res) => {
    try {
      const [ordersRes, productsRes, variantsRes, profilesRes] = await Promise.all([
        database().from('orders').select('id,order_number,status,amount,created_at,user_id').order('created_at', { ascending: false }).limit(500).then(r => r, e => { console.error('dashboard orders error', e); return { data: [] }; }),
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
        const { data: itemRows } = await database().from('order_items').select('order_id').in('order_id', list.slice(0, 8).map(o => o.id)).then(r => r, e => ({ data: [] }));
        items = itemRows || [];
      }
      for (const it of (items || [])) itemCounts[it.order_id] = (itemCounts[it.order_id] || 0) + 1;
      let staff = [];
      try { staff = await staffIds(database); } catch { staff = []; }
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
        recentOrders: list.slice(0, 8).map(o => ({ ...o, item_count: itemCounts[o.id] || 0 })),
        salesTrend: [],
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
        lowStockItems: [], recentOrders: [], salesTrend: [],
        warning: 'Dashboard data temporarily unavailable — showing empty stats. Check server logs.',
      });
    }
  });

  // ---------- Customers (profiles without staff rows) — enriched with latest address for cloth store ----------
  app.get('/api/v1/admin/customers', ...need(R.customers), async (req, res) => {
    try {
      const search = String(req.query.search || '').trim();
      const staff = await staffIds(database);
      let q = database().from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
      if (staff.length) q = q.not('id', 'in', `(${staff.join(',')})`);
      if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data: customers, error: e } = await q;
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
      res.json({
        success: true,
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
      });
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
      const { data: profile } = await database().from('profiles').select('id,email,name').ilike('email', String(email).trim()).maybeSingle();
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
      stock: list.reduce((s, v) => s + (v.stock || 0), 0),
      status: p.is_active ? 'active' : 'hidden',
      is_new: !!p.is_new,
      is_best: !!p.is_best,
      is_sale: !!(p.discount_price && p.discount_price < p.price),
      is_featured: false,
      display_order: 0,
      discount_rate: p.discount_price && p.discount_price < p.price ? Math.round(((p.price - p.discount_price) / p.price) * 100) : 0,
    };
  }

  function combosFromBody(body) {
    const sizes = (Array.isArray(body.sizes) && body.sizes.length ? body.sizes : ['FREE']).map(String);
    const colors = (Array.isArray(body.colors) && body.colors.length ? body.colors : [{ name_ko: 'DEFAULT', name_en: 'DEFAULT', hex: '' }])
      .map(c => (typeof c === 'string' ? { name: c } : c))
      .map(c => ({ color: c.name_en || c.name_ko || c.name || 'DEFAULT', swatch: c.hex || '' }));
    return { sizes, colors };
  }

  async function syncVariants(productId, productSku, body) {
    const { sizes, colors } = combosFromBody(body);
    const { data: existing } = await database().from('product_variants').select('*').eq('product_id', productId);
    const have = new Map((existing || []).map(v => [`${v.color}|||${v.size}`, v]));
    const want = new Set();
    let n = 0;
    for (const c of colors) {
      for (const size of sizes) {
        const key = `${c.color}|||${size}`;
        want.add(key);
        n += 1;
        if (!have.has(key)) {
          let sku = `${productSku}-${String(c.color).slice(0, 8)}-${String(size).slice(0, 8)}`.toUpperCase().replace(/[^A-Z0-9-]+/g, '-');
          const { error } = await database().from('product_variants').insert({
            product_id: productId, sku: `${sku}-${random().slice(0, 4)}`,
            color: c.color, size: String(size), swatch: c.swatch, stock: 0, active: true,
          });
          if (error) throw error;
        }
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

  app.get('/api/v1/admin/products', ...need(R.catalog), async (req, res) => {
    try {
      const { category, search, stockStatus, status, filterType, limit: qLimit, offset: qOffset } = req.query;
      const limit = Math.min(Math.max(Number(qLimit) || 20, 1), 100);
      const offset = Math.max(Number(qOffset) || 0, 0);
      let q = database().from('products').select('*', { count: 'exact' }).order('id', { ascending: false }).range(offset, offset + limit - 1);
      if (category && category !== 'all') {
        const { data: cat } = await database().from('categories').select('id').or(`slug.eq.${category},id.eq.${Number(category) || -1}`).maybeSingle();
        if (!cat) return res.json({ success: true, count: 0, total: 0, data: [] });
        q = database().from('products').select('*', { count: 'exact' }).eq('category_id', cat.id).order('id', { ascending: false }).range(offset, offset + limit - 1);
        if (search && String(search).trim()) {
          const term = String(search).trim();
          q = q.or(`name_ko.ilike.%${term}%,name_en.ilike.%${term}%,sku.ilike.%${term}%`);
        }
        if (filterType === 'new') q = q.eq('is_new', true);
        if (filterType === 'sale') q = q.not('discount_price', 'is', null);
        if (status && status !== 'all') q = q.eq('is_active', status === 'active');
      } else {
        if (search && String(search).trim()) {
          const term = String(search).trim();
          q = q.or(`name_ko.ilike.%${term}%,name_en.ilike.%${term}%,sku.ilike.%${term}%`);
        }
        if (filterType === 'new') q = q.eq('is_new', true);
        if (filterType === 'sale') q = q.not('discount_price', 'is', null);
        if (status && status !== 'all') q = q.eq('is_active', status === 'active');
      }
      const { data, error: e, count: total } = await q;
      if (e) throw e;
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
      let composed = (data || []).map(p => {
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
          stock: list.reduce((s, v) => s + (v.stock || 0), 0),
          status: p.is_active ? 'active' : 'hidden',
          is_new: !!p.is_new,
          is_best: !!p.is_best,
          is_sale: !!(p.discount_price && p.discount_price < p.price),
          is_featured: false,
          display_order: 0,
          discount_rate: p.discount_price && p.discount_price < p.price ? Math.round(((p.price - p.discount_price) / p.price) * 100) : 0,
        };
      });
      if (stockStatus === 'low') composed = composed.filter(p => p.stock > 0 && p.stock <= 15);
      else if (stockStatus === 'out') composed = composed.filter(p => p.stock <= 0);
      else if (stockStatus === 'in') composed = composed.filter(p => p.stock > 0);
      else if (filterType === 'out_of_stock') composed = composed.filter(p => p.stock <= 0);
      else if (filterType === 'in_stock') composed = composed.filter(p => p.stock > 0);
      res.json({ success: true, count: composed.length, total: total ?? composed.length, data: composed });
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
      const { data: created, error: e } = await database().from('products').insert({
        slug: slugify(b.name_en || b.name_ko), sku,
        category_id: Number(b.category_id),
        name_ko: String(b.name_ko).slice(0, 200), name_en: String(b.name_en || b.name_ko).slice(0, 200),
        description_ko: String(b.description_ko || ''), description_en: String(b.description_en || ''),
        price, discount_price: discount, gender: b.gender || 'women',
        is_active: (b.status || 'active') === 'active', is_new: !!b.is_new, is_best: !!b.is_best,
      }).select().maybeSingle();
      if (e || !created) throw e || new Error('CREATE_FAILED');
      await syncVariants(created.id, sku, b);
      await syncMedia(created.id, b.images);
      await auditLog(req, 'PRODUCT_CREATE', { table: 'products', id: created.id });
      res.status(201).json({ success: true, data: await composeAdminProduct(created) });
    } catch (err) { error(res, err?.status === 409 ? 409 : 503, 'PRODUCT_CREATE_FAILED'); }
  });

  app.put('/api/v1/admin/products/:id', ...need(R.catalog), async (req, res) => {
    try {
      const b = req.body || {};
      const { data: p } = await database().from('products').select('*').eq('id', req.params.id).maybeSingle();
      if (!p) return error(res, 404, 'PRODUCT_NOT_FOUND');
      const patch = {};
      if (b.name_ko !== undefined) patch.name_ko = String(b.name_ko).slice(0, 200);
      if (b.name_en !== undefined) patch.name_en = String(b.name_en).slice(0, 200);
      if (b.description_ko !== undefined) patch.description_ko = String(b.description_ko);
      if (b.description_en !== undefined) patch.description_en = String(b.description_en);
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
      if (b.gender !== undefined) patch.gender = b.gender;
      if (b.status !== undefined) patch.is_active = b.status === 'active';
      if (b.is_new !== undefined) patch.is_new = !!b.is_new;
      if (b.is_best !== undefined) patch.is_best = !!b.is_best;
      if (b.sku !== undefined) patch.sku = String(b.sku).toUpperCase().slice(0, 60);
      if (Object.keys(patch).length) {
        const { error: e } = await database().from('products').update(patch).eq('id', p.id);
        if (e) throw e;
      }
      if (b.sizes !== undefined || b.colors !== undefined) await syncVariants(p.id, patch.sku || p.sku, { sizes: b.sizes, colors: b.colors });
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
        if ((refs || []).length) return error(res, 409, 'PRODUCT_ORDERED');
        await database().from('product_variants').delete().in('id', ids);
      }
      await database().from('product_media').delete().eq('product_id', req.params.id);
      await database().from('reviews').delete().eq('product_id', req.params.id);
      await database().from('wishlists').delete().eq('product_id', req.params.id);
      const { error: e } = await database().from('products').delete().eq('id', req.params.id);
      if (e) throw e;
      await auditLog(req, 'PRODUCT_DELETE', { table: 'products', id: req.params.id });
      res.json({ success: true, message: '상품이 삭제되었습니다.' });
    } catch { error(res, 503, 'PRODUCT_DELETE_FAILED'); }
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
      if (!slug || !b.name_ko || !b.name_en) return error(res, 400, 'SLUG_NAME_REQUIRED');
      const { data, error: e } = await database().from('categories').insert({
        slug, name_ko: String(b.name_ko).slice(0, 100), name_en: String(b.name_en).slice(0, 100),
        description_ko: String(b.description_ko || '').slice(0, 500), description_en: String(b.description_en || '').slice(0, 500),
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
      if (b.name_ko !== undefined) patch.name_ko = String(b.name_ko).slice(0, 100);
      if (b.name_en !== undefined) patch.name_en = String(b.name_en).slice(0, 100);
      if (b.description_ko !== undefined) patch.description_ko = String(b.description_ko).slice(0, 500);
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
      is_active: c.ends_at ? new Date(c.ends_at) >= new Date() : true,
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
      const { data, error: e } = await database().from('coupons').select('*').order('code');
      if (e) throw e;
      res.json({ success: true, data: (data || []).map(toLegacyCoupon) });
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
  function toAdminOrder(o, items, names) {
    const addr = o.address || {};
    const derivedPay = o.status === 'paid' ? 'paid' : o.status === 'pending_payment' ? 'pending_payment' : o.status;
    return {
      id: o.id, order_number: o.order_number, created_at: o.created_at,
      customer_name: addr.recipient || '', customer_email: '', customer_phone: addr.phone || '',
      postal_code: addr.postal_code || '', address: addr.address || '',
      detail_address: addr.detail_address || '', shipping_memo: addr.shipping_memo || '',
      subtotal: o.subtotal, discount_amount: o.discount, coupon_code: o.coupon_code,
      shipping_fee: o.shipping, total_amount: o.amount,
      payment_method: 'toss_card', payment_status: derivedPay, order_status: o.status,
      payment_receipt_url: null, payment_sender_name: '', verified_by: null, verified_at: null,
      payment_admin_notes: null, courier_name: '', tracking_number: '',
      paid_at: ['paid', 'processing', 'shipped', 'delivered'].includes(o.status) ? o.created_at : null,
      items: (items || []).map(i => ({
        product_name_ko: names?.[i.variant_id]?.name_ko || i.snapshot?.sku || '',
        product_name_en: names?.[i.variant_id]?.name_en || '',
        product_sku: i.snapshot?.sku || '',
        image_url: '', price: i.unit_price, quantity: i.quantity,
        size: i.snapshot?.size || '', color: i.snapshot?.color || '',
      })),
    };
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
      const { status, payment_status, search, limit = 100, offset = 0 } = req.query;
      let q = database().from('orders').select('*').order('created_at', { ascending: false })
        .range(Number(offset) || 0, (Number(offset) || 0) + Math.min(Number(limit) || 100, 200) - 1);
      if (status && status !== 'all') q = q.eq('status', status === 'cancelled' ? 'canceled' : status);
      if (payment_status && payment_status !== 'all') {
        if (payment_status === 'paid') q = q.eq('status', 'paid');
        else if (payment_status === 'pending_payment' || payment_status === 'under_review') q = q.eq('status', 'pending_payment');
      }
      if (search && String(search).trim()) {
        const term = String(search).trim();
        q = q.or(`order_number.ilike.%${term}%,id.eq.${term}`);
      }
      const { data, error: e } = await q;
      if (e) throw e;
      const out = [];
      for (const o of (data || [])) out.push(await adminOrderDetail(o.id));
      res.json({ success: true, data: out });
    } catch { error(res, 503, 'ORDERS_UNAVAILABLE'); }
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
        paid: ['processing', 'canceled'],
        processing: ['shipped', 'delivered', 'canceled'],
        shipped: ['delivered'],
      };
      if (!allowed[order.status]?.includes(next)) return error(res, 409, 'ORDER_STATE_INVALID');
      if (next === 'canceled') {
        const rel = await releaseHoldRpc({ p_order_id: req.params.id, p_from: ['pending_payment', 'paid'], p_to: 'canceled', p_effect_key: `order-cancel:${req.params.id}`, p_kind: 'ORDER_CANCELED' });
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
        const rel = await releaseHoldRpc({ p_order_id: order.id, p_from: ['pending_payment', 'paid'], p_to: 'canceled', p_effect_key: `order-cancel:${order.id}`, p_kind: 'ORDER_CANCELED' });
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
      const { data: reviews } = await database().from('reviews').select('*').order('created_at', { ascending: false }).limit(200);
      const pids = [...new Set((reviews || []).map(r => r.product_id))];
      let byId = {};
      if (pids.length) {
        const { data: prods } = await database().from('products').select('id,sku,name_ko,name_en').in('id', pids);
        byId = Object.fromEntries((prods || []).map(p => [p.id, p]));
      }
      res.json({
        success: true,
        data: (reviews || []).map(r => ({
          ...r,
          product_name_ko: byId[r.product_id]?.name_ko || '',
          product_name_en: byId[r.product_id]?.name_en || '',
          product_sku: byId[r.product_id]?.sku || '',
          product_images: [],
          is_approved: !!r.is_approved,
          is_featured: !!r.is_featured,
        })),
      });
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
  const adminUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const mime = String(file.mimetype || '').toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) && MIME_TO_EXT[mime]) cb(null, true);
      else cb(new Error('이미지 파일(JPG, PNG, WEBP, GIF)만 업로드 가능합니다.'), false);
    },
    limits: { fileSize: 8 * 1024 * 1024 },
  });

  function isHttpUrl(u) {
    try {
      const parsed = new URL(u);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch { return false; }
  }

  app.get('/api/v1/admin/media', ...need(R.catalog), async (req, res) => {
    try {
      const search = String(req.query.search || '').toLowerCase();
      const tag = String(req.query.tag || '').toLowerCase();
      let items = docList(await readDoc(database, 'media', []));
      if (search) items = items.filter(m => `${m.name} ${m.tags}`.toLowerCase().includes(search));
      if (tag) items = items.filter(m => String(m.tags || '').toLowerCase().includes(tag));
      res.json({ success: true, data: items.slice(0, 200) });
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

  app.post('/api/v1/admin/upload-multiple', authenticate, staff(R.catalog), adminUpload.array('images', 10), async (req, res) => {
    try {
      if (!req.files || !req.files.length) return error(res, 400, 'NO_FILES');
      const saved = [];
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
      for (const file of req.files) {
        let url = null;
        try {
          if (supabaseStorage) {
            const ext = path.extname(file.originalname) || MIME_TO_EXT[String(file.mimetype || '').toLowerCase()] || '.jpg';
            const objectPath = `products/${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
            const { error: upErr } = await supabaseStorage.storage.from(bucket).upload(objectPath, file.buffer, { contentType: file.mimetype || 'image/jpeg', upsert: false, cacheControl: '31536000' });
            if (!upErr) {
              const { data } = supabaseStorage.storage.from(bucket).getPublicUrl(objectPath);
              url = data.publicUrl;
            }
          }
        } catch (e) { console.error('Supabase upload error', e?.message); }
        if (!url) {
          console.error('Supabase upload failed, no fallback in serverless');
          return error(res, 503, 'UPLOAD_FAILED');
        }
        const item = {
          id: uid(), name: file.originalname, url,
          file_type: 'image', size_bytes: file.size, alt_text: file.originalname,
          tags: 'uploaded,product', created_at: new Date().toISOString(),
        };
        await saveDocItem(database, 'media', item);
        saved.push({ url: item.url, name: file.originalname, size: file.size });
      }
      res.json({ success: true, message: `${saved.length}개의 이미지가 업로드되었습니다.`, data: saved });
    } catch (err) {
      console.error('Upload error', err);
      error(res, 400, err?.message || 'UPLOAD_FAILED');
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
      res.json({ success: true, data: docList(await readDoc(database, 'banners', [])) });
    } catch { error(res, 503, 'CONTENT_UNAVAILABLE'); }
  });

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
      await saveDocItem(database, 'banners', { ...existing, ...req.body, id: existing.id });
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



