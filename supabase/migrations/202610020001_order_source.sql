-- Manual / external orders: track the sales channel on app.orders.
-- Website orders keep 'website'; admin-created Instagram/WhatsApp/phone/other
-- orders reuse the bank-transfer verify flow, so no status-model change is needed.
alter table app.orders
  add column if not exists order_source text not null default 'website'
    check (order_source in ('website', 'instagram', 'whatsapp', 'phone', 'other'));
alter table app.orders
  add column if not exists source_detail text;
-- Meta Ads attribution: UTM parameters and click identifiers
alter table app.orders
  add column if not exists utm_source text;
alter table app.orders
  add column if not exists utm_medium text;
alter table app.orders
  add column if not exists utm_campaign text;
alter table app.orders
  add column if not exists utm_content text;
alter table app.orders
  add column if not exists utm_term text;
create index if not exists idx_orders_source_created on app.orders(order_source, created_at desc);
