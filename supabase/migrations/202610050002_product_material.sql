-- Product material columns + honest gender values (P1 admin-form fix).
-- The admin form collected material_ko/en and silently dropped them (no
-- column); gender was accepted by the API but had no form input, so creates
-- defaulted to 'women' and edits never changed it. Metadata-only DDL,
-- idempotent, no backfill (existing rows keep '' material).
alter table app.products
  add column if not exists material_ko text not null default '',
  add column if not exists material_en text not null default '';
