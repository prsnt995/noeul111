-- 014: Coupon percentage support (admin % option was rejected with PERCENTAGE_UNSUPPORTED)
-- Adds discount_type ('fixed' | 'percentage'), max_discount cap, and description fields.
-- Existing rows default to fixed-amount; no data rewrite needed.
-- Supabase free-tier safe: metadata-only DDL, no backfill, idempotent.
alter table app.coupons
  add column if not exists discount_type text not null default 'fixed' check (discount_type in ('fixed','percentage')),
  add column if not exists max_discount integer check (max_discount is null or max_discount > 0),
  add column if not exists description_ko text not null default '',
  add column if not exists description_en text not null default '';
-- Percentage stores 1-100 in amount; fixed stores KRW amount.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coupons_percentage_range') then
    alter table app.coupons
      add constraint coupons_percentage_range
      check ((discount_type = 'fixed' and amount > 0) or (discount_type = 'percentage' and amount between 1 and 100));
  end if;
end $$;
