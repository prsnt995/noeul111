-- 202610100002_fix_place_order_snapshot.sql
-- Fix PostgreSQL function app.place_order: replace invalid max(x->'snapshot') with jsonb_agg(x->'snapshot')->0.
-- PostgreSQL does not have a max(jsonb) aggregate function, which caused 42883 runtime errors during order placement.

create or replace function app.place_order(
  p_user_id uuid, p_order_number text, p_idempotency_key text, p_request_hash text,
  p_subtotal integer, p_discount integer, p_shipping integer, p_amount integer,
  p_coupon_code text, p_address jsonb, p_items jsonb
) returns jsonb
language plpgsql
set search_path = app
as $$
declare
  v_existing app.orders%rowtype;
  v_need record;
  v_coupon app.coupons%rowtype;
  v_order_id uuid;
begin
  select * into v_existing from app.orders
    where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.request_hash = p_request_hash then
      return jsonb_build_object('outcome','duplicate','order_id',v_existing.id,'order_number',v_existing.order_number);
    else
      return jsonb_build_object('outcome','conflict');
    end if;
  end if;

  -- lock all touched variants up front, deterministic order
  perform 1 from app.product_variants v
    join (select distinct (x->>'variant_id')::uuid as vid
            from jsonb_array_elements(p_items) x) need on need.vid = v.id
    order by v.id
    for update of v;

  -- validate aggregated demand against available stock
  for v_need in
    select (x->>'variant_id')::uuid as variant_id, sum((x->>'quantity')::int) as qty
      from jsonb_array_elements(p_items) x group by 1
  loop
    if not exists (
      select 1 from app.product_variants
        where id = v_need.variant_id and stock - reserved >= v_need.qty
    ) then
      return jsonb_build_object('outcome','insufficient_stock','variant_id',v_need.variant_id);
    end if;
  end loop;

  if p_coupon_code is not null then
    select * into v_coupon from app.coupons where code = p_coupon_code for update;
    if not found
       or v_coupon.starts_at > now() or v_coupon.ends_at < now()
       or v_coupon.used + v_coupon.reserved >= v_coupon.limit_count then
      return jsonb_build_object('outcome','coupon_invalid');
    end if;
  end if;

  insert into app.orders(user_id, order_number, idempotency_key, request_hash,
      subtotal, discount, shipping, amount, coupon_code, address, status)
    values (p_user_id, p_order_number, p_idempotency_key, p_request_hash,
      p_subtotal, p_discount, p_shipping, p_amount, p_coupon_code, p_address, 'pending_payment')
    returning id into v_order_id;

  update app.product_variants v set reserved = reserved + need.qty
    from (select (x->>'variant_id')::uuid as variant_id, sum((x->>'quantity')::int) as qty
            from jsonb_array_elements(p_items) x group by 1) need
    where v.id = need.variant_id;

  if p_coupon_code is not null then
    update app.coupons set reserved = reserved + 1 where code = p_coupon_code;
  end if;

  -- Use (jsonb_agg(x->'snapshot')->0) instead of max(x->'snapshot') because max(jsonb) does not exist in Postgres
  insert into app.order_items(order_id, variant_id, quantity, unit_price, snapshot)
    select v_order_id, (x->>'variant_id')::uuid, sum((x->>'quantity')::int),
           max((x->>'unit_price')::int), (jsonb_agg(x->'snapshot')->0)
      from jsonb_array_elements(p_items) x group by 1;

  insert into app.outbox(effect_key, kind, payload)
    values ('order:' || v_order_id::text, 'ORDER_CREATED',
            jsonb_build_object('order_id', v_order_id));

  return jsonb_build_object('outcome','created','order_id',v_order_id,'order_number',p_order_number);
end;
$$;

grant execute on function app.place_order(uuid,text,text,text,integer,integer,integer,integer,text,jsonb,jsonb) to noeul_api, service_role;
