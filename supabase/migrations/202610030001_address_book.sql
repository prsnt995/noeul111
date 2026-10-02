-- Address book hardening: ordering + default flag.
-- Run with migration credentials, never the API role.
alter table app.addresses
  add column if not exists created_at timestamptz not null default now();
alter table app.addresses
  add column if not exists label text not null default '';
alter table app.addresses
  add column if not exists is_default boolean not null default false;

create index if not exists addresses_user_created_idx
  on app.addresses(user_id, created_at desc);

-- First address per user becomes default when no default exists yet.
update app.addresses a set is_default = true
where not exists (
  select 1 from app.addresses b
  where b.user_id = a.user_id and b.is_default = true
) and a.id = (
  select c.id from app.addresses c
  where c.user_id = a.user_id
  order by c.created_at desc nulls last
  limit 1
);
