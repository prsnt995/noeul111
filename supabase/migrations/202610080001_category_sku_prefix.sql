-- Category SKU prefixes for auto-generated product SKUs (e.g. TSH-00001).
-- Additive + idempotent. Existing categories keep NULL prefix (the admin UI
-- falls back to a slug-derived suggestion until one is set); sku_seq starts
-- at 0 and is only ever a hint — the products.sku unique constraint plus a
-- pre-check loop stays the source of truth, so concurrent creates stay safe.
alter table app.categories
  add column if not exists sku_prefix text,
  add column if not exists sku_seq integer not null default 0;
create unique index if not exists categories_sku_prefix_idx
  on app.categories (sku_prefix) where sku_prefix is not null;
