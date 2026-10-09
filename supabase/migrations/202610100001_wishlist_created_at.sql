-- 202610100001_wishlist_created_at.sql
-- Add created_at timestamp to app.wishlists for chronological sorting in GET /api/v1/wishlist.
-- Safe, non-destructive, rerunnable with default now() for existing and future rows.

alter table app.wishlists
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_wishlists_user_created
  on app.wishlists(user_id, created_at desc);
