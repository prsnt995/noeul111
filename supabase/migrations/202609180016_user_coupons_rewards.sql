-- 017: User coupons and reward points for customer loyalty program
create table if not exists app.user_coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  coupon_code text not null references app.coupons(code),
  claimed_at timestamptz not null default now(),
  used_at timestamptz,
  status text not null default 'active' check (status in ('active', 'used', 'expired')),
  unique (user_id, coupon_code)
);

create table if not exists app.reward_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  total_earned integer not null default 0,
  total_used integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists app.reward_points_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  order_id uuid references app.orders(id),
  points_change integer not null,
  balance_after integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table app.user_coupons enable row level security;
alter table app.reward_points enable row level security;
alter table app.reward_points_log enable row level security;

-- RLS policies for user_coupons
create policy "Users can view own coupons" on app.user_coupons
  for select using (auth.uid() = user_id);
create policy "Users can claim coupons" on app.user_coupons
  for insert with check (auth.uid() = user_id);

-- RLS policies for reward_points
create policy "Users can view own points" on app.reward_points
  for select using (auth.uid() = user_id);

-- RLS policies for reward_points_log
create policy "Users can view own points log" on app.reward_points_log
  for select using (auth.uid() = user_id);

-- Grant permissions
grant select, insert, update on app.user_coupons to noeul_api;
grant select, insert, update on app.reward_points to noeul_api;
grant select, insert on app.reward_points_log to noeul_api;

-- Indexes
create index if not exists idx_user_coupons_user_id on app.user_coupons(user_id);
create index if not exists idx_user_coupons_coupon_code on app.user_coupons(coupon_code);
create index if not exists idx_user_coupons_status on app.user_coupons(status);
create index if not exists idx_reward_points_user_id on app.reward_points(user_id);
create index if not exists idx_reward_points_log_user_id on app.reward_points_log(user_id);

-- Trigger to update reward_points.updated_at
create or replace function app.update_reward_points_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_reward_points_updated_at
  before update on app.reward_points
  for each row execute function app.update_reward_points_updated_at();