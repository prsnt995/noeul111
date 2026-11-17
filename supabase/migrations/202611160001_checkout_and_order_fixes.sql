-- 202611160001_checkout_and_order_fixes.sql
--
-- Fixes found in the November 2026 audit:
--
-- 1. app.place_order inserted order_items with `GROUP BY 1`, which grouped by
--    the constant v_order_id and left variant_id ungrouped. PostgreSQL rejects
--    that at runtime (42803), so production checkout failed closed with
--    503 ORDER_UNAVAILABLE. The insert now aggregates per variant and keeps a
--    deterministic snapshot.
-- 2. Orders had no customer contact snapshot. app.orders only stored address
--    jsonb, so the outbox worker addressed notification emails to `undefined`
--    and every order email was silently dropped. Customer name/email/phone are
--    now snapshotted on the order.
-- 3. app.orders.paid_at was only written by the manual-deposit endpoint. A
--    trigger now stamps it for every transition into the paid family, which
--    makes revenue-by-payment-date reporting possible.
-- 4. admin_totals() counted the gross order amount and bucketed by created_at.
--    It now uses paid_at (falling back to created_at) and subtracts completed
--    refunds, so partial refunds reduce reported revenue.
-- 5. profiles.email was not unique; Google/password signups could both create
--    the same address. A case-insensitive unique index is added when the
--    existing data is clean (skipped, with a notice, when duplicates exist so
--    the migration never fails a live database).

-- ---------------------------------------------------------------------------
-- 1. Customer contact snapshot on orders
-- ---------------------------------------------------------------------------
alter table app.orders
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text;

-- Backfill from the address snapshot and, where the address has no email,
-- from the owning profile.
update app.orders o
   set customer_name  = coalesce(o.customer_name,  o.address->>'recipient', p.name, ''),
       customer_email = coalesce(o.customer_email, o.address->>'email', p.email, ''),
       customer_phone = coalesce(o.customer_phone, o.address->>'phone', '')
  from app.profiles p
 where p.id = o.user_id
   and (o.customer_name is null or o.customer_email is null or o.customer_phone is null);

-- ---------------------------------------------------------------------------
-- 2. Corrected atomic order placement
-- ---------------------------------------------------------------------------
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
  v_needed record;
  v_coupon app.coupons%rowtype;
  v_profile record;
  v_order_id uuid;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('outcome','invalid_items');
  end if;

  select * into v_existing from app.orders
    where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.request_hash = p_request_hash then
      return jsonb_build_object('outcome','duplicate','order_id',v_existing.id,'order_number',v_existing.order_number);
    end if;
    return jsonb_build_object('outcome','conflict');
  end if;

  select email, name into v_profile from app.profiles where id = p_user_id;

  -- Lock all touched variants up front in a deterministic order.
  perform 1 from app.product_variants v
    join (select distinct (x->>'variant_id')::uuid as vid
            from jsonb_array_elements(p_items) x) need on need.vid = v.id
    order by v.id
    for update of v;

  -- Validate aggregated demand against available stock.
  for v_needed in
    select (x->>'variant_id')::uuid as variant_id, sum((x->>'quantity')::int) as qty
      from jsonb_array_elements(p_items) x
     group by (x->>'variant_id')::uuid
  loop
    if not exists (
      select 1 from app.product_variants
       where id = v_needed.variant_id and stock - reserved >= v_needed.qty
    ) then
      return jsonb_build_object('outcome','insufficient_stock','variant_id',v_needed.variant_id);
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

  -- The unique (user_id, idempotency_key) constraint is the final guard for
  -- two concurrent requests with the same key.
  begin
    insert into app.orders(
        user_id, order_number, idempotency_key, request_hash,
        subtotal, discount, shipping, amount, coupon_code, address, status,
        customer_name, customer_email, customer_phone)
      values (
        p_user_id, p_order_number, p_idempotency_key, p_request_hash,
        p_subtotal, p_discount, p_shipping, p_amount, p_coupon_code, p_address, 'pending_payment',
        coalesce(p_address->>'recipient', v_profile.name, ''),
        coalesce(p_address->>'email', v_profile.email, ''),
        coalesce(p_address->>'phone', ''))
      returning id into v_order_id;
  exception when unique_violation then
    select * into v_existing from app.orders
      where user_id = p_user_id and idempotency_key = p_idempotency_key;
    if v_existing.request_hash = p_request_hash then
      return jsonb_build_object('outcome','duplicate','order_id',v_existing.id,'order_number',v_existing.order_number);
    end if;
    return jsonb_build_object('outcome','conflict');
  end;

  update app.product_variants v set reserved = reserved + need.qty
    from (select (x->>'variant_id')::uuid as variant_id, sum((x->>'quantity')::int) as qty
            from jsonb_array_elements(p_items) x
           group by (x->>'variant_id')::uuid) need
   where v.id = need.variant_id;

  if p_coupon_code is not null then
    update app.coupons set reserved = reserved + 1 where code = p_coupon_code;
  end if;

  -- One row per variant (order_items PK is (order_id, variant_id)). The
  -- snapshot is chosen deterministically from the same variant's lines.
  insert into app.order_items(order_id, variant_id, quantity, unit_price, snapshot)
    select v_order_id,
           need.variant_id,
           need.qty,
           need.unit_price,
           coalesce(need.snapshot, '{}'::jsonb)
      from (
        select (x->>'variant_id')::uuid as variant_id,
               sum((x->>'quantity')::int) as qty,
               max((x->>'unit_price')::int) as unit_price,
               (jsonb_agg(coalesce(x->'snapshot', '{}'::jsonb)))->0 as snapshot
          from jsonb_array_elements(p_items) x
         group by (x->>'variant_id')::uuid
      ) need;

  insert into app.outbox(effect_key, kind, payload)
    values ('order:' || v_order_id::text, 'ORDER_CREATED',
            jsonb_build_object('order_id', v_order_id));

  return jsonb_build_object('outcome','created','order_id',v_order_id,'order_number',p_order_number);
end;
$$;

grant execute on function app.place_order(uuid,text,text,text,integer,integer,integer,integer,text,jsonb,jsonb) to noeul_api, service_role;

-- ---------------------------------------------------------------------------
-- 3. Stamp paid_at on every entry into the paid family
-- ---------------------------------------------------------------------------
create or replace function app.stamp_order_paid_at()
returns trigger
language plpgsql
set search_path = app
as $$
begin
  if new.paid_at is null and new.status in ('paid','processing','shipped','delivered') then
    if tg_op = 'INSERT' then
      new.paid_at := now();
    elsif old.status is distinct from new.status then
      new.paid_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_stamp_paid_at on app.orders;
create trigger orders_stamp_paid_at
  before insert or update of status on app.orders
  for each row execute function app.stamp_order_paid_at();

update app.orders
   set paid_at = now()
 where paid_at is null
   and status in ('paid','processing','shipped','delivered');

-- ---------------------------------------------------------------------------
-- 4. Exact, net-of-refund totals
-- ---------------------------------------------------------------------------
create or replace function app.admin_totals()
returns jsonb
language sql
stable
security definer
set search_path = app, public
as $$
  with b as (
    select (date_trunc('day',   now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul') as day_start,
           (date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul') as month_start
  ),
  refunds as (
    select order_id, sum(amount)::int as refunded
      from app.payment_refunds
     where status = 'completed'
     group by order_id
  ),
  o as (
    select id, status, created_at, paid_at, amount from app.orders
  ),
  paid as (
    select o.amount - coalesce(r.refunded, 0) as amount,
           coalesce(o.paid_at, o.created_at) as paid_at
      from o
      left join refunds r on r.order_id = o.id
     where o.status in ('paid', 'processing', 'shipped', 'delivered')
  )
  select jsonb_build_object(
    'revenue_today', coalesce((select sum(amount) from paid, b where paid_at >= b.day_start), 0),
    'revenue_month', coalesce((select sum(amount) from paid, b where paid_at >= b.month_start), 0),
    'revenue_all',   coalesce((select sum(amount) from paid), 0),
    'orders_today',  (select count(*) from o, b where created_at >= b.day_start),
    'orders_month',  (select count(*) from o, b where created_at >= b.month_start),
    'orders_all',    (select count(*) from o),
    'status_counts', (
      select coalesce(jsonb_object_agg(status, c), '{}'::jsonb)
        from (select status, count(*)::int as c from o group by status) s
    )
  );
$$;

grant execute on function app.admin_totals() to noeul_api, service_role;

-- ---------------------------------------------------------------------------
-- 5. Case-insensitive uniqueness for profile emails (best effort)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from app.profiles group by lower(email) having count(*) > 1
  ) then
    raise notice 'profiles.email has duplicates; skipping profiles_email_ci_idx (resolve duplicates, then re-run)';
  else
    create unique index if not exists profiles_email_ci_idx on app.profiles(lower(email));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Refund balance guard
-- ---------------------------------------------------------------------------
-- app.pg_payment_action('claim_refund') compares
-- `v_payment.balance_amount < v_amount`. When balance_amount is NULL the whole
-- condition is NULL and the guard does not fire, so a refund could be claimed
-- against a payment with no known balance. The trigger makes the invariant
-- explicit for every insert path and fails closed.
create or replace function app.guard_refund_balance()
returns trigger
language plpgsql
set search_path = app
as $$
declare
  v_balance integer;
begin
  select balance_amount into v_balance
    from app.payments where order_id = new.order_id
    for update;
  if v_balance is null or v_balance < new.amount then
    raise exception 'REFUND_EXCEEDS_BALANCE' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists payment_refunds_guard_balance on app.payment_refunds;
create trigger payment_refunds_guard_balance
  before insert on app.payment_refunds
  for each row execute function app.guard_refund_balance();
