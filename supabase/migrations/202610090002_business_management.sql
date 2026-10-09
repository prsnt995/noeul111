-- 202610090002_business_management.sql
-- Business Management System: Expenses, Profit & Loss, and Cost Tracking
-- Safe, additive migration. Preserves all existing production data.

create table if not exists app.business_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text not null check (category in (
    'product_purchase',
    'shipping_delivery',
    'packaging',
    'advertising_marketing',
    'living_expenses',
    'entertainment',
    'taxes_vat',
    'office_expenses',
    'other_expenses'
  )),
  description text not null,
  amount integer not null check (amount >= 0),
  payment_method text not null default 'card' check (payment_method in (
    'card',
    'bank_transfer',
    'cash',
    'simple_pay',
    'other'
  )),
  order_id text,
  notes text,
  receipt_url text,
  created_by uuid references app.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for efficient queries
create index if not exists idx_business_expenses_date on app.business_expenses(expense_date desc);
create index if not exists idx_business_expenses_category on app.business_expenses(category);
create index if not exists idx_business_expenses_created_by on app.business_expenses(created_by);

-- Optional cost_price on products for COGS calculations (in integer KRW)
alter table app.products add column if not exists cost_price integer default null check (cost_price is null or cost_price >= 0);

-- Row Level Security and Least-Privilege Access Control
alter table app.business_expenses enable row level security;

-- Strictly revoke all public, anonymous, and standard authenticated access
revoke all on app.business_expenses from public, anon, authenticated;

-- Grant access ONLY to server backend roles
grant select, insert, update, delete on app.business_expenses to service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'noeul_api') then
    grant select, insert, update, delete on app.business_expenses to noeul_api;
  end if;
end $$;

-- Server-only RLS policies (defense-in-depth)
drop policy if exists staff_all_business_expenses on app.business_expenses;
drop policy if exists server_only_business_expenses on app.business_expenses;

create policy server_only_business_expenses on app.business_expenses
  to service_role
  using (true)
  with check (true);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'noeul_api') then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'app'
        and tablename = 'business_expenses'
        and policyname = 'server_only_business_expenses_api'
    ) then
      create policy server_only_business_expenses_api on app.business_expenses
        to noeul_api
        using (true)
        with check (true);
    end if;
  end if;
end $$;
