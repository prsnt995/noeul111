import { Router } from 'express';
import { z } from 'zod';
import { type Database,sql } from './db.js';
import { ensure } from './security.js';
export async function decorate(db:Database,products:any[]) {
 if(!products.length)return [];
 const ids=sql.join(products.map(p=>sql`${p.id}`),sql`, `);
 const variants=await db.rows(sql`select *,stock-reserved as available from app.product_variants where product_id in (${ids}) and active order by color,size`);
 const media=await db.rows(sql`select * from app.product_media where product_id in (${ids}) and published order by sort_order,id`);
 return products.map(p=>{
  const v=variants.filter(v=>v.product_id===p.id),m=media.filter(m=>m.product_id===p.id);
  return {...p,id:Number(p.id),variants:v,media:m,images:m.map(m=>m.url),stock:v.reduce((n,v)=>n+v.available,0),
   is_sale:!!p.discount_price,sizes:[...new Set(v.map(v=>v.size))],colors:[...new Set(v.map(v=>v.color))].map(color=>({name_ko:color,name_en:color,hex:v.find(v=>v.color===color)?.swatch}))};
 });
}
export function catalog(db:Database){
 const r=Router();
 r.get(['/products','/catalog/products'],async(req,res)=>{
  const q=z.object({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(24),search:z.string().max(100).optional(),category:z.string().max(80).optional(),gender:z.enum(['men','women','unisex']).optional(),sort:z.enum(['newest','price_asc','price_desc','popular']).default('newest'),sale:z.string().optional(),is_new:z.string().optional(),is_best:z.string().optional()}).parse(req.query);
  const conditions=[sql`p.is_active`];
  if(q.search)conditions.push(sql`(p.name_ko ilike ${'%'+q.search+'%'} or p.name_en ilike ${'%'+q.search+'%'})`);
  if(q.category)conditions.push(sql`c.slug=${q.category}`);
  if(q.gender)conditions.push(sql`p.gender in (${q.gender},'unisex')`);
  if(q.sale==='true'||q.sale==='1')conditions.push(sql`p.discount_price is not null`);
  if(q.is_new==='1'||q.is_new==='true')conditions.push(sql`p.is_new`);
  if(q.is_best==='1'||q.is_best==='true')conditions.push(sql`p.is_best`);
  const where=sql.join(conditions,sql` and `);
  const sort=q.sort==='price_asc'?sql`coalesce(p.discount_price,p.price) asc`:q.sort==='price_desc'?sql`coalesce(p.discount_price,p.price) desc`:q.sort==='popular'?sql`p.is_best desc,p.created_at desc`:sql`p.created_at desc`;
  const rows=await db.rows(sql`select p.*,c.slug as category_slug from app.products p left join app.categories c on c.id=p.category_id where ${where} order by ${sort},p.id desc limit ${q.limit} offset ${(q.page-1)*q.limit}`);
  const [count]=await db.rows(sql`select count(*)::int as total from app.products p left join app.categories c on c.id=p.category_id where ${where}`);
  res.json({success:true,data:await decorate(db,rows),pagination:{page:q.page,limit:q.limit,total:count.total,totalPages:Math.ceil(count.total/q.limit)}});
 });
 r.get(['/products/:id','/catalog/products/:id'],async(req,res)=>{
  const id=String(req.params.id);const [p]=await db.rows(sql`select * from app.products where is_active and (slug=${id} or id::text=${id})`);ensure(p,404,'PRODUCT_NOT_FOUND');
  res.json({success:true,data:(await decorate(db,[p]))[0]});
 });
 r.get(['/categories','/catalog/categories'],async(req,res)=>res.json({success:true,data:await db.rows(sql`select * from app.categories where is_active order by sort_order,id`)}));
 r.get(['/content/:key','/store/settings/:key'],async(req,res)=>{
  const key=req.params.key==='public'?'shipping':String(req.params.key);
  const [v]=await db.rows(sql`select value from app.content where key=${key} and published and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now())`);
  ensure(v,404,'CONTENT_NOT_FOUND');res.json({success:true,data:v.value});
 });
 return r;
}
