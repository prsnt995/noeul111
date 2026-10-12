-- Password auth (email + password) alongside Google OAuth.
-- Run with migration credentials, never the API role.
-- Design: passwords live in app.credentials (out of the hot profiles path).
-- Google users are blocked from password flows by absence of a credential row
-- + auth_provider='google' on profiles. No linking in v1.

-- 1. Origin marker on profiles (existing rows stay 'google').
alter table app.profiles
  add column if not exists auth_provider text not null default 'google'
  check (auth_provider in ('google', 'password'));

-- 2. Password hashes, keyed by user, unique per email (case-insensitive).
create table if not exists app.credentials (
  user_id uuid primary key references app.profiles(id) on delete cascade,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists credentials_email_ci_idx
  on app.credentials(lower(email));

-- 3. Single-use reset tokens (sha256 hash stored, raw token only in email).
create table if not exists app.password_resets (
  id_hash text primary key,
  user_id uuid not null references app.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_resets_user_idx
  on app.password_resets(user_id);

alter table app.credentials enable row level security;
alter table app.password_resets enable row level security;

-- Backend service access (mirrors 202609180001_core.sql backend_access).
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='app' and tablename='credentials' and policyname='backend_access') then
    create policy backend_access on app.credentials to noeul_api using (true) with check (true);
  end if;
  if not exists(select 1 from pg_policies where schemaname='app' and tablename='password_resets' and policyname='backend_access') then
    create policy backend_access on app.password_resets to noeul_api using (true) with check (true);
  end if;
end $$;

grant select, insert, update, delete on app.credentials to noeul_api;
grant select, insert, update, delete on app.password_resets to noeul_api;
