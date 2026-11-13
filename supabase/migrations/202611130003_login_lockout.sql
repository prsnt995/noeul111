-- Brute-force lockout for password logins.
-- The rate limiter is per-IP; this adds per-account protection so a distributed
-- attacker cannot keep guessing a single account's password.
alter table app.credentials add column if not exists failed_attempts integer not null default 0;
alter table app.credentials add column if not exists locked_until timestamptz;
