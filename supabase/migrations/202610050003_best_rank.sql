-- Merchant-controlled BEST ordering (P1 H7).
-- products previously had only is_best bool, so the homepage BEST strip order
-- was undefined (insertion order). Lower best_rank shows first; NULL ranks
-- last. Metadata-only DDL, idempotent, no backfill.
alter table app.products
  add column if not exists best_rank integer check (best_rank is null or best_rank >= 0);
create index if not exists products_best_rank_idx
  on app.products (is_best, best_rank) where is_best;
