import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { nextSku, normalizePrefix, suggestPrefix, SKU_SEQ_MAX } from '../src/utils/sku.js';

/**
 * Backfill category-based SKUs (TSH-00001) onto existing products.
 *
 *   node scripts/backfill-skus.mjs            # dry-run: prints mapping only
 *   node scripts/backfill-skus.mjs --apply    # performs the renames
 *   node scripts/backfill-skus.mjs --apply --prefix-from-slug
 *     # also cover categories without an explicit prefix (slug-derived)
 *
 * Safety: dry-run is the default; --apply requires SUPABASE_URL +
 * SUPABASE_SECRET_KEY, rewrites only SKU *text* (orders reference rows by
 * id and keep frozen snapshots), regenerates variant SKU text consistently,
 * advances categories.sku_seq, and audit-logs every rename best-effort.
 * Run scripts/backup.js first.
 */

const APPLY = process.argv.includes('--apply');
const PREFIX_FROM_SLUG = process.argv.includes('--prefix-from-slug');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required');
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const db = sb.schema('app');

const rand4 = () => Math.round(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');

function variantSku(productSku, color, size) {
  const base = `${productSku}-${String(color || 'DEFAULT').slice(0, 8)}-${String(size || 'FREE').slice(0, 8)}`
    .toUpperCase().replace(/[^A-Z0-9-]+/g, '-');
  return `${base}-${rand4()}`;
}

async function main() {
  console.log(APPLY ? 'MODE: APPLY (renames will be written)' : 'MODE: DRY-RUN (no writes). Add --apply to perform.');
  console.log('Run scripts/backup.js before --apply.\n');

  const { data: cats, error: catErr } = await db.from('categories').select('id,slug,sku_prefix,sku_seq').order('id');
  if (catErr) throw catErr;
  const { data: products, error: prodErr } = await db.from('products').select('id,sku,category_id').order('id');
  if (prodErr) throw prodErr;

  const used = new Set((products || []).map((p) => String(p.sku || '').toUpperCase()));
  const plan = [];
  const skipped = [];
  const byCat = new Map();
  for (const p of (products || [])) {
    if (!byCat.has(p.category_id)) byCat.set(p.category_id, []);
    byCat.get(p.category_id).push(p);
  }

  for (const cat of (cats || [])) {
    let prefix = normalizePrefix(cat.sku_prefix);
    if (!prefix && PREFIX_FROM_SLUG) prefix = suggestPrefix(cat.slug);
    const rows = byCat.get(cat.id) || [];
    if (!prefix) {
      if (rows.length) skipped.push({ category: cat.slug, reason: 'no prefix (set one in admin or rerun with --prefix-from-slug)', count: rows.length });
      continue;
    }
    let seq = 0;
    for (const p of rows) {
      seq += 1;
      if (seq > SKU_SEQ_MAX) throw new Error(`Sequence exhausted for prefix ${prefix}`);
      let candidate = nextSku(prefix, seq);
      while (used.has(candidate)) {
        seq += 1;
        if (seq > SKU_SEQ_MAX) throw new Error(`Sequence exhausted for prefix ${prefix}`);
        candidate = nextSku(prefix, seq);
      }
      used.delete(String(p.sku || '').toUpperCase());
      used.add(candidate);
      if (String(p.sku || '').toUpperCase() !== candidate) {
        plan.push({ product_id: p.id, category: cat.slug, from: p.sku, to: candidate, seq });
      }
    }
    cat._plannedSeq = seq;
  }

  if (!plan.length) {
    console.log('Nothing to rename — every product already follows its category scheme.');
    if (skipped.length) console.log('Skipped categories:', JSON.stringify(skipped, null, 2));
    return;
  }

  console.log(`Products to rename: ${plan.length}`);
  for (const r of plan) console.log(`  #${r.product_id} [${r.category}] ${r.from} -> ${r.to}`);
  if (skipped.length) console.log('Skipped categories:', JSON.stringify(skipped, null, 2));

  if (!APPLY) {
    console.log('\nDry-run complete. Re-run with --apply to perform these renames.');
    return;
  }

  let renamed = 0;
  const seqByCat = new Map();
  for (const r of plan) {
    const { error: uErr } = await db.from('products').update({ sku: r.to }).eq('id', r.product_id);
    if (uErr) {
      console.error(`FAILED product #${r.product_id}:`, uErr.message);
      continue;
    }
    const { data: variants } = await db.from('product_variants').select('id,color,size').eq('product_id', r.product_id)
      .then((x) => x, () => ({ data: [] }));
    for (const v of (variants || [])) {
      await db.from('product_variants').update({ sku: variantSku(r.to, v.color, v.size) }).eq('id', v.id)
        .then((x) => x, (e) => console.error(`  variant ${v.id} sku sync failed:`, e?.message));
    }
    const cat = (cats || []).find((c) => c.slug === r.category);
    if (cat) seqByCat.set(cat.id, Math.max(seqByCat.get(cat.id) || 0, r.seq));
    try {
      await db.from('audit_logs').insert({
        actor: null, action: 'SKU_BACKFILL',
        target: `products:${r.product_id}`,
        metadata: { before: { sku: r.from }, after: { sku: r.to } },
      });
    } catch {}
    renamed += 1;
  }
  for (const [catId, seq] of seqByCat) {
    await db.from('categories').update({ sku_seq: seq }).eq('id', catId)
      .then((x) => x, (e) => console.error(`  category ${catId} seq sync failed:`, e?.message));
  }
  console.log(`\nDone: renamed ${renamed}/${plan.length} products, sequences advanced.`);
}

main().catch((e) => { console.error('backfill failed:', e?.message || e); process.exit(1); });
