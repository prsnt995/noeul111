import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const bucket = process.env.MEDIA_BUCKET || 'product-media';
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required');
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const root = path.resolve('public/products');
const products = [
  { slug: 'classic-tshirt', sku: 'NOEUL-CLASSIC-TSHIRT', category: 'tops', name_ko: '클래식 티셔츠', name_en: 'Classic T-Shirt', price: 29000, dir: 'men/tshirts/classic-tshirt' },
  { slug: 'oversized-tshirt', sku: 'NOEUL-OVERSIZED-TSHIRT', category: 'tops', name_ko: '오버사이즈 티셔츠', name_en: 'Oversized T-Shirt', price: 32000, dir: 'women/tshirts/oversized-tshirt' },
];
const categorySeed = [
  ['outerwear', '아우터', 'Outerwear', 1], ['tops', '상의', 'Tops', 2],
  ['shirts', '셔츠/블라우스', 'Shirts & Blouses', 3], ['knitwear', '니트웨어', 'Knitwear', 4],
  ['pants', '팬츠/데님', 'Pants & Denim', 5], ['skirts', '스커트', 'Skirts', 6],
  ['dresses', '원피스', 'Dresses', 7], ['accessories', '악세사리/가방', 'Accessories & Bags', 8],
  ['socks', '양말/삭스', 'Socks', 9],
];
const { error: bucketError } = await sb.storage.createBucket(bucket, { public: true, fileSizeLimit: '10MB' });
if (bucketError && !/already exists/i.test(bucketError.message)) throw bucketError;
const { error: categorySeedError } = await sb.schema('app').from('categories').upsert(categorySeed.map(([slug, name_ko, name_en, sort_order]) => ({ slug, name_ko, name_en, sort_order, is_active: true })), { onConflict: 'slug' });
if (categorySeedError) throw categorySeedError;
const { data: categories, error: categoryError } = await sb.schema('app').from('categories').select('id,slug');
if (categoryError) throw categoryError;
for (const product of products) {
  const category = categories.find(c => c.slug === product.category);
  if (!category) throw new Error(`Missing category: ${product.category}`);
  const { data: row, error } = await sb.schema('app').from('products').upsert({ slug: product.slug, sku: product.sku, category_id: category.id, name_ko: product.name_ko, name_en: product.name_en, price: product.price, is_active: true }, { onConflict: 'slug' }).select('id').single();
  if (error) throw error;
  const { error: variantError } = await sb.schema('app').from('product_variants').upsert([
    { product_id: row.id, sku: `${product.sku}-S`, color: '기본', size: 'S', swatch: '#d4d4d8', stock: 20, reserved: 0, active: true },
    { product_id: row.id, sku: `${product.sku}-M`, color: '기본', size: 'M', swatch: '#a1a1aa', stock: 20, reserved: 0, active: true },
    { product_id: row.id, sku: `${product.sku}-L`, color: '기본', size: 'L', swatch: '#71717a', stock: 20, reserved: 0, active: true },
  ], { onConflict: 'sku' });
  if (variantError) throw variantError;
  const { error: clearMediaError } = await sb.schema('app').from('product_media').delete().eq('product_id', row.id);
  if (clearMediaError) throw clearMediaError;
  const files = (await fs.readdir(path.join(root, product.dir))).filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const objectPath = `products/${product.slug}/${file}`;
    const body = await fs.readFile(path.join(root, product.dir, file));
    const upload = await sb.storage.from(bucket).upload(objectPath, body, { contentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg', upsert: true, cacheControl: '31536000' });
    if (upload.error) throw upload.error;
    const publicUrl = sb.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
    const media = await sb.schema('app').from('product_media').upsert({ product_id: row.id, url: publicUrl, alt: product.name_en, sort_order: i, published: true }, { onConflict: 'id' });
    if (media.error) throw media.error;
  }
  console.log(`Uploaded ${product.slug}: ${files.length} images`);
}
