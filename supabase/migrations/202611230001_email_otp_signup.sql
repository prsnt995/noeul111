-- Email OTP signup (email verification before account creation).
-- Run with migration credentials, never the API role.
-- Design: a signup is first staged in app.pending_signups and only promoted
-- to app.profiles + app.credentials after the 6-digit email code is verified.
-- This keeps unverified rows out of profiles and makes "only new users can
-- create an account" enforceable at one point.

-- 1. Staging table for in-progress signups.
create table if not exists app.pending_signups (
  email          text primary key,        -- normalized lowercase
  name           text not null,
  phone          text,
  password_hash  text not null,
  otp_hash       text not null,
  otp_expires_at timestamptz not null,
  attempts       integer not null default 0,
  send_count     integer not null default 1,
  last_sent_at   timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create index if not exists pending_signups_expiry_idx
  on app.pending_signups(otp_expires_at);

alter table app.pending_signups enable row level security;

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='app' and tablename='pending_signups' and policyname='backend_access') then
    create policy backend_access on app.pending_signups to noeul_api using (true) with check (true);
  end if;
end $$;

grant select, insert, update, delete on app.pending_signups to noeul_api;

-- 2. Persist the phone number the signup form already collects.
alter table app.profiles add column if not exists phone text;

-- 3. Close the profile race: one email = one profile. Pre-flight duplicates
--    (see plan) before applying this index; otherwise the migration aborts,
--    which is the desired fail-loud behavior.
create unique index if not exists profiles_email_ci_idx
  on app.profiles(lower(email));
