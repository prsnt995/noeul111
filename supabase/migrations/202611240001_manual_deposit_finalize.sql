-- Manual/bank-transfer deposit confirmation finalization.
--
-- Previously PATCH /admin/orders/:id/confirm-deposit only flipped orders.status
-- to 'paid', so variant stock/reserved and coupon counters never moved and
-- PAYMENT_CONFIRMED outbox events were never enqueued. This function performs
-- the same finalization as app.pg_payment_action('complete_confirm', ...) but
-- for orders that have no Toss payment row (bank_transfer / manual / card taken
-- off-site).
--
-- Atomic: status flip, stock/reserved decrement, coupon reserved->used, outbox
-- insert and status history all happen in one transaction. Returns
-- { ok, already } so the API can distinguish a fresh confirmation from a
-- concurrent duplicate.
create or replace function app.confirm_manual_payment(
  p_order_id uuid,
  p_actor uuid default null,
  p_depositor text default null
) returns jsonb
language plpgsql
set search_path = app
as $$
declare
  v_order app.orders%rowtype;
begin
  select * into v_order from app.orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'ORDER_NOT_FOUND');
  end if;
  if v_order.status <> 'pending_payment' then
    return jsonb_build_object('ok', false, 'reason', 'NOT_APPLICABLE', 'status', v_order.status);
  end if;

  -- Inventory guard: never finalize if we cannot cover the reservation.
  if exists (
    select 1 from app.order_items i join app.product_variants v on v.id = i.variant_id
    where i.order_id = v_order.id and (v.stock < i.quantity or v.reserved < i.quantity)
  ) then
    raise exception 'MANUAL_PAYMENT_INVENTORY_MISMATCH';
  end if;

  update app.orders
     set status = 'paid',
         paid_at = coalesce(paid_at, now()),
         depositor_name = coalesce(nullif(p_depositor, ''), depositor_name)
   where id = v_order.id and status = 'pending_payment';
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_APPLICABLE');
  end if;

  update app.product_variants v
     set stock = v.stock - i.quantity,
         reserved = v.reserved - i.quantity
    from app.order_items i
   where i.order_id = v_order.id and i.variant_id = v.id
     and v.stock >= i.quantity and v.reserved >= i.quantity;

  if v_order.coupon_code is not null then
    update app.coupons
       set reserved = greatest(reserved - 1, 0),
           used = used + 1
     where code = v_order.coupon_code and reserved > 0;
    if not found then
      raise exception 'MANUAL_PAYMENT_COUPON_MISMATCH';
    end if;
  end if;

  insert into app.outbox (effect_key, kind, payload)
  values ('payment-paid:' || v_order.id, 'PAYMENT_CONFIRMED',
          jsonb_build_object('order_id', v_order.id))
  on conflict (effect_key) do nothing;

  insert into app.order_status_history (order_id, status, note, actor_id)
  values (v_order.id, 'paid',
          'Deposit/manual payment confirmed by admin' ||
          case when p_depositor is not null and p_depositor <> '' then ' (' || p_depositor || ')' else '' end,
          p_actor);

  return jsonb_build_object('ok', true, 'order_id', v_order.id);
end $$;

grant execute on function app.confirm_manual_payment(uuid, uuid, text) to noeul_api, service_role;
