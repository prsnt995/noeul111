-- Phase 5/6 follow-ups: tables required by api/app.js that 001 did not create.
-- Sole schema authority; run with migration credentials, never the API role.
create table if not exists app.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references app.orders,
  courier_name text not null default '', tracking_number text,
  status text not null default 'dispatched', created_at timestamptz not null default now()
);
create table if not exists app.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references app.orders, status text not null,
  note text not null default '', actor_id uuid references app.profiles,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on app.order_status_history(order_id, created_at desc);
-- Moderated product reviews (legacy SQLite parity for the Supabase path).
create table if not exists app.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references app.products, user_id uuid references app.profiles,
  author_name text not null, rating integer not null check(rating between 1 and 5),
  title text not null default '', comment text not null, image_url text not null default '',
  is_approved boolean not null default false,
  moderated_by uuid references app.profiles, moderated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on app.reviews(product_id, created_at desc) where is_approved;
-- Same privilege boundary as 001: least-privilege runtime role, RLS on,
-- browser roles denied. Mirrors 001 backend_access policy and 003 grants.
do $$ declare t text; begin
  foreach t in array array['shipments','order_status_history','reviews'] loop
    execute format('alter table app.%I enable row level security', t);
    if not exists(select from pg_policies where schemaname='app' and tablename=t and policyname='backend_access') then
      execute format('create policy backend_access on app.%I to noeul_api using (true) with check (true)', t);
    end if;
  end loop;
end $$;
grant usage on schema app to noeul_api, service_role;
grant select, insert, update, delete on app.shipments, app.order_status_history, app.reviews to noeul_api, service_role;
grant usage, select on all sequences in schema app to noeul_api, service_role;
