-- Manual-order channels: replace whatsapp/phone with tiktok.
-- No orders exist yet, but remap defensively so the new check never fails.
update app.orders set order_source = 'other'
  where order_source in ('whatsapp', 'phone');
alter table app.orders drop constraint if exists orders_order_source_check;
alter table app.orders
  add constraint orders_order_source_check
  check (order_source in ('website', 'instagram', 'tiktok', 'other'));
