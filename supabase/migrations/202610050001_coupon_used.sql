-- Mark claimed coupons used when their order transitions to paid.
-- complete_confirm already moves coupons.reserved -> used, but nothing flips
-- user_coupons(status) out of 'active', so claimed coupons stayed redeemable
-- in the ownership check and /me/coupons kept listing them (P0 coupon fix).
-- Trigger-only: fires once per transition into paid, only touches active rows,
-- so replays and concurrent transitions are idempotent. No counter changes
-- here (complete_confirm owns the counters); no backfill by design.
create or replace function app.mark_coupon_used() returns trigger
language plpgsql set search_path = app as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid'
     and new.coupon_code is not null then
    update app.user_coupons set status = 'used', used_at = now()
      where user_id = new.user_id
        and coupon_code = new.coupon_code
        and status = 'active';
  end if;
  return new;
end $$;

drop trigger if exists trg_orders_coupon_used on app.orders;
create trigger trg_orders_coupon_used after update of status on app.orders
  for each row execute function app.mark_coupon_used();
