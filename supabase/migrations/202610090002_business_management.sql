-- 202610090002_business_management.sql
-- Business Management System: Expenses, Profit & Loss, and Cost Tracking

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
  payment_method text not null default 'card',
  order_id text,
  notes text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for date and category queries
create index if not exists idx_business_expenses_date on app.business_expenses(expense_date desc);
create index if not exists idx_business_expenses_category on app.business_expenses(category);

-- Optional cost_price on products for COGS calculations
alter table app.products add column if not exists cost_price integer default null;

-- Row Level Security and permissions
alter table app.business_expenses enable row level security;
grant select, insert, update, delete on app.business_expenses to authenticated, service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'app'
      and tablename = 'business_expenses'
      and policyname = 'staff_all_business_expenses'
  ) then
    create policy staff_all_business_expenses on app.business_expenses for all using (true) with check (true);
  end if;
end $$;
