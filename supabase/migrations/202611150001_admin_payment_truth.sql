-- Admin payment truth.
--
-- Two things were impossible to represent before this migration:
--   1. A manual / bank-transfer order could never be marked as paid. The only
--      money endpoints required the order to ALREADY be `paid`, so deposit
--      orders were stuck in `pending_payment` forever and never counted as
--      revenue.
--   2. The admin console guessed the payment state from the fulfillment status.
--      `app.payments` is keyed by `order_id` (one row per order), so "was this
--      a card order or a deposit order" is not derivable from the ledger alone
--      either — it has to be an explicit attribute of the order.
--
-- Also adds `app.admin_totals()` so dashboard revenue/counts are exact instead
-- of being summed from the latest 500 rows.

alter table app.orders
  add column if not exists payment_method text not null default 'card',
  add column if not exists paid_at timestamptz,
  add column if not exists depositor_name text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'app.orders'::regclass
       and conname = 'orders_payment_method_check'
  ) then
    alter table app.orders
      add constraint orders_payment_method_check
      check (payment_method in ('card', 'bank_transfer', 'manual'));
  end if;
end $$;

-- Backfill: an order with no Toss ledger row that never reached a paid state
-- was created as a deposit / manual order. Website checkouts that were simply
-- abandoned before paying stay marked as card.
update app.orders o
   set payment_method = 'bank_transfer'
 where o.payment_method = 'card'
   and coalesce(o.order_source, 'website') <> 'website'
   and o.status in ('pending_payment', 'expired', 'canceled')
   and not exists (select 1 from app.payments p where p.order_id = o.id);

-- Real approval timestamps for orders that are already paid.
update app.orders o
   set paid_at = coalesce(
         (select p.updated_at from app.payments p where p.order_id = o.id and p.status = 'paid'),
         o.created_at
       )
 where o.paid_at is null
   and o.status in ('paid', 'processing', 'shipped', 'delivered');

create index if not exists orders_paid_at_idx on app.orders(paid_at desc);
create index if not exists orders_payment_method_idx on app.orders(payment_method, status);

-- Exact totals with KST day/month boundaries. The server runs in UTC, so day
-- boundaries must be shifted explicitly or "today" would start at 09:00 KST.
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
  o as (
    select status, amount, created_at from app.orders
  ),
  paid as (
    select amount, created_at from o
     where status in ('paid', 'processing', 'shipped', 'delivered')
  )
  select jsonb_build_object(
    'revenue_today', coalesce((select sum(amount) from paid, b where created_at >= b.day_start), 0),
    'revenue_month', coalesce((select sum(amount) from paid, b where created_at >= b.month_start), 0),
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
