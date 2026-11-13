-- ad_spend_daily upsert key.
-- The original unique(campaign_id, adset_id, ad_id, date) never matched the
-- campaign-level Meta Insights rows because all three id columns are NULL
-- (Postgres treats NULLs as distinct), so every cron run appended duplicate
-- spend rows. sync_key is a deterministic text key for each daily row.
alter table app.ad_spend_daily add column if not exists sync_key text;

update app.ad_spend_daily
set sync_key = platform || ':' || coalesce(campaign_id::text, campaign_name, '') || ':' || coalesce(adset_id, '') || ':' || coalesce(ad_id, '') || ':' || date::text
where sync_key is null;

create unique index if not exists ad_spend_daily_sync_key_key on app.ad_spend_daily(sync_key);
