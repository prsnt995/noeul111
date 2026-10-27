-- Meta Ads monitoring tables
-- ad_platforms: supported ad platforms (meta, tiktok, google)
create table if not exists app.ad_platforms (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed default platforms
insert into app.ad_platforms (key, name) values
  ('meta', 'Meta (FB+IG)'),
  ('tiktok', 'TikTok'),
  ('google', 'Google Ads')
on conflict (key) do nothing;

-- ad_campaigns: ad campaigns across platforms
create table if not exists app.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid references app.ad_platforms(id),
  external_id text, -- platform-specific campaign ID
  name text not null,
  objective text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  daily_budget numeric(12,2),
  lifetime_budget numeric(12,2),
  start_at timestamptz,
  end_at timestamptz,
  product_skus text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ad_spend_daily: daily spend and performance metrics per campaign/adset/ad
create table if not exists app.ad_spend_daily (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references app.ad_campaigns(id),
  adset_id text,
  ad_id text,
  platform text not null default 'meta',
  campaign_name text,
  date date not null,
  spend numeric(12,2) not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  link_clicks integer not null default 0,
  conversions_reported integer not null default 0,
  raw jsonb default '{}',
  created_at timestamptz not null default now(),
  unique (campaign_id, adset_id, ad_id, date)
);

create index if not exists idx_ad_spend_daily_date on app.ad_spend_daily(date desc);
create index if not exists idx_ad_spend_daily_campaign on app.ad_spend_daily(campaign_id);

-- ad_alert_rules: configurable alert rules
create table if not exists app.ad_alert_rules (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('low_stock', 'spend_cap', 'cpa_spike', 'zero_conversions')),
  threshold numeric(12,2),
  enabled boolean not null default true,
  channels text[] default '{}',
  created_at timestamptz not null default now()
);

-- ad_alert_log: triggered alerts
create table if not exists app.ad_alert_log (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references app.ad_alert_rules(id),
  fired_at timestamptz not null default now(),
  payload jsonb default '{}',
  acknowledged_at timestamptz,
  acknowledged_by uuid
);

create index if not exists idx_ad_alert_log_fired on app.ad_alert_log(fired_at desc);

-- Grant access to service role
grant select, insert, update, delete on app.ad_platforms to service_role;
grant select, insert, update, delete on app.ad_campaigns to service_role;
grant select, insert, update, delete on app.ad_spend_daily to service_role;
grant select, insert, update, delete on app.ad_alert_rules to service_role;
grant select, insert, update, delete on app.ad_alert_log to service_role;