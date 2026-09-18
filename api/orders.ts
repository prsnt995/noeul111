import { Router } from 'express';
import { z } from 'zod';
import { type Database,sql } from './db.js';
import { ensure,hash } from './security.js';
const itemSchema=z.object({variant_id:z.string().uuid(),quantity:z.number().int().min(1).max(99)});
const orderSchema=z.object({items:z.array(itemSchema).min(1).max(100),coupon_code:z.string().max(80).optional(),address:z.object({recipient:z.string().min(1).max(100),phone:z.string().min(7).max(30),postal_code:z.string().min(3).max(20),address:z.string().min(1).max(300),detail_address:z.string().max(300).default('')})});
function principal(req:any){const s=req.res.locals.session;ensure(s,401,'SIGN_IN_REQUIRED');return s;}
async function price(db:Database,input:any){
 const ids=sql.join(input.items.map((i:any)=>sql`${i.variant_id}::uuid`),sql`, `);
 const variants=await db.rows<any>(sql`select v.*,p.name_ko,p.name_en,p.slug,p.discount_price,p.price,p.is_active from app.product_variants v join app.products p on p.id=v.product_id where v.id in (${ids}) for update`);
 const map=new Map(variants.map(v=>[v.id,v]));let subtotal=0;const lines=[];
 for(const item of input.items){const v=map.get(item.variant_id);ensure(v && v.active && v.is_active,400,'VARIANT_UNAVAILABLE');ensure(v.stock-v.reserved>=item.quantity,409,'INSUFFICIENT_STOCK');const unit=Math.max(1,(v.discount_price??v.price)+v.price_delta);subtotal+=unit*item.quantity;lines.push({v,item,unit});}
 let discount=0,coupon=null;
 if(input.coupon_code){[coupon]=await db.rows<any>(sql`select * from app.coupons where code=${input.coupon_code.trim().toUpperCase()} and starts_at<=now() and ends_at>now() and used+reserved<limit_count for update`);ensure(coupon,400,'COUPON_INVALID');ensure(subtotal>=coupon.minimum,400,'COUPON_MINIMUM_NOT_MET');discount=Math.min(subtotal,coupon.amount);}
 const shipping=subtotal-discount>=70000?0:3000;return {variants,lines,subtotal,discount,shipping,amount:subtotal-discount+shipping,coupon};
}
export function orders(db:Database,auth:any){
 const r=Router();r.use(auth.authenticate);
 r.post('/checkout/quote',async(req,res,next)=>{try{const input=orderSchema.parse(req.body);const q=await price(db,input);res.json({success:true,data:{subtotal:q.subtotal,discount:q.discount,shipping:q.shipping,amount:q.amount,items:q.lines.map(x=>({variant_id:x.v.id,quantity:x.item.quantity,unit_price:x.unit}))}});}catch(e){next(e);}});
 r.post('/orders',async(req,res,next)=>{try{const s=principal(req),input=orderSchema.parse(req.body),key=String(req.get('idempotency-key')||'');ensure(/^[A-Za-z0-9._:-]{8,200}$/.test(key),400,'IDEMPOTENCY_KEY_REQUIRED');const requestHash=hash(JSON.stringify(input));
  const result=await db.transaction(async tx=>{const [old]=await tx.rows<any>(sql`select * from app.orders where user_id=${s.user_id} and idempotency_key=${key} for update`);if(old){ensure(old.request_hash===requestHash,409,'IDEMPOTENCY_CONFLICT');return old;}const q=await price(tx,input);const number=`NE${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,8).toUpperCase()}`;
   const [order]=await tx.rows<any>(sql`insert into app.orders(user_id,order_number,idempotency_key,request_hash,subtotal,discount,shipping,amount,coupon_code,address) values(${s.user_id},${number},${key},${requestHash},${q.subtotal},${q.discount},${q.shipping},${q.amount},${q.coupon?.code||null},${JSON.stringify(input.address)}::jsonb) returning *`);
   for(const line of q.lines){await tx.rows(sql`update app.product_variants set reserved=reserved+${line.item.quantity} where id=${line.v.id} and stock-reserved>=${line.item.quantity}`);await tx.rows(sql`insert into app.order_items(order_id,variant_id,quantity,unit_price,snapshot) values(${order.id},${line.v.id},${line.item.quantity},${line.unit},${JSON.stringify({name_ko:line.v.name_ko,name_en:line.v.name_en,sku:line.v.sku,color:line.v.color,size:line.v.size})}::jsonb)`);await tx.rows(sql`insert into app.inventory_ledger(effect_key,variant_id,quantity,reason) values(${`reserve:${order.id}:${line.v.id}`},${line.v.id},${-line.item.quantity},'order_reservation')`);}
   if(q.coupon)await tx.rows(sql`update app.coupons set reserved=reserved+1 where code=${q.coupon.code}`);await tx.rows(sql`insert into app.payments(order_id) values(${order.id})`);await tx.rows(sql`insert into app.outbox(effect_key,kind,payload) values(${`order:${order.id}`},'ORDER_CREATED',${JSON.stringify({order_id:order.id})}::jsonb)`);return order;});
  res.status(201).json({success:true,data:result});
 }catch(e){next(e);}});
 r.get('/orders',async(req,res,next)=>{try{const s=principal(req);const rows=await db.rows(sql`select * from app.orders where user_id=${s.user_id} order by created_at desc limit 100`);res.json({success:true,data:rows});}catch(e){next(e);}});
 r.get('/orders/:publicId',async(req,res,next)=>{try{const s=principal(req);const [row]=await db.rows<any>(sql`select * from app.orders where order_number=${req.params.publicId} and user_id=${s.user_id}`);ensure(row,404,'ORDER_NOT_FOUND');const items=await db.rows(sql`select * from app.order_items where order_id=${row.id}`);res.json({success:true,data:{...row,items}});}catch(e){next(e);}});
 r.post('/orders/:publicId/cancel',async(req,res,next)=>{try{const s=principal(req);const result=await db.transaction(async tx=>{const [o]=await tx.rows<any>(sql`select * from app.orders where order_number=${req.params.publicId} and user_id=${s.user_id} for update`);ensure(o,404,'ORDER_NOT_FOUND');ensure(['pending_payment','paid'].includes(o.status),409,'ORDER_NOT_CANCELLABLE');await tx.rows(sql`update app.orders set status='canceled' where id=${o.id}`);const lines=await tx.rows<any>(sql`select * from app.order_items where order_id=${o.id}`);for(const l of lines){await tx.rows(sql`update app.product_variants set reserved=greatest(0,reserved-${l.quantity}) where id=${l.variant_id}`);await tx.rows(sql`insert into app.inventory_ledger(effect_key,variant_id,quantity,reason) values(${`release:${o.id}:${l.variant_id}`},${l.variant_id},${l.quantity},'order_cancel') on conflict do nothing`);}return o;});res.json({success:true,data:result});}catch(e){next(e);}});
 return r;
}
