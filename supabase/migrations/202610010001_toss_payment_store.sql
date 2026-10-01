-- Transactional Toss ledger. Apply to the company Supabase project before adding
-- keys to the normal server. Existing paid orders must be reconciled separately.
alter table app.payments
  add column if not exists amount integer,
  add column if not exists balance_amount integer,
  add column if not exists provider_status text,
  add column if not exists recovery_required boolean not null default false,
  add column if not exists next_recovery_at timestamptz,
  add column if not exists recovery_attempts integer not null default 0,
  add column if not exists needs_review boolean not null default false,
  add column if not exists lease_token uuid,
  add column if not exists lease_until timestamptz;

create table if not exists app.payment_refunds (
  operation_id text primary key,
  order_id uuid not null references app.orders(id),
  actor_id uuid not null references app.profiles(id),
  amount integer not null check (amount > 0),
  reason text not null,
  status text not null check (status in ('claimed','completed')),
  transaction_key text unique,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payment_refunds_active on app.payment_refunds(order_id) where status = 'claimed';
alter table app.payment_refunds enable row level security;
drop policy if exists backend_access on app.payment_refunds;
create policy backend_access on app.payment_refunds to noeul_api using (true) with check (true);
grant select,insert,update on app.payment_refunds to noeul_api, service_role;

create or replace function app.pg_payment_health() returns boolean
language sql stable set search_path = app as $$
  select to_regclass('app.payment_refunds') is not null
     and to_regprocedure('app.pg_payment_action(text,jsonb)') is not null
     and exists (select 1 from app.content where key='pg_payment_schema_version'
       and value->>'version'='1' and published=false);
$$;

create or replace function app.pg_payment_action(p_action text, p_input jsonb) returns jsonb
language plpgsql set search_path = app as $$
declare
  v_order app.orders%rowtype;
  v_payment app.payments%rowtype;
  v_refund app.payment_refunds%rowtype;
  v_provider jsonb := p_input->'payment';
  v_key text := p_input->>'paymentKey';
  v_amount integer;
  v_balance integer;
  v_op text := p_input->>'operationId';
  v_cancel jsonb;
  v_token uuid;
  v_jobs jsonb;
begin
  if p_action = 'claim_recovery' then
    with claimed as (
      select q.order_id from app.payments q
        where q.recovery_required and q.next_recovery_at <= now()
          and (q.lease_until is null or q.lease_until < now())
        order by q.next_recovery_at for update skip locked
        limit least(greatest(coalesce((p_input->>'limit')::integer,1),1),20)
    ), updated as (
      update app.payments p set lease_token = gen_random_uuid(),
        lease_until = now() + make_interval(secs => least(greatest(coalesce((p_input->>'leaseMs')::integer,120000),1000),300000)/1000.0),
        updated_at = now()
      from claimed c where p.order_id=c.order_id
      returning p.order_id,p.lease_token,p.recovery_attempts
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', x.order_id, 'orderId', x.order_id, 'leaseToken', x.lease_token,
      'attempts', x.recovery_attempts)), '[]'::jsonb) into v_jobs
    from updated x;
    return v_jobs;
  end if;

  if p_action = 'defer_recovery' then
    update app.payments set recovery_attempts = greatest(coalesce((p_input->>'attempts')::integer,0),0),
      next_recovery_at = case when recovery_required then to_timestamp((p_input->>'nextRunAt')::numeric/1000) else null end,
      needs_review = needs_review or coalesce((p_input->>'needsReview')::boolean,false),
      lease_token = null, lease_until = null, updated_at = now()
      where order_id = (p_input->>'jobId')::uuid and lease_token = (p_input->>'leaseToken')::uuid;
    if not found then raise exception 'PAYMENT_RECOVERY_LEASE_LOST'; end if;
    if coalesce((p_input->>'needsReview')::boolean,false) then
      insert into app.outbox(effect_key,kind,payload)
        values ('payment-review:'||(p_input->>'jobId'),'PAYMENT_NEEDS_REVIEW',
          jsonb_build_object('order_id',p_input->>'jobId')) on conflict(effect_key) do nothing;
    end if;
    return jsonb_build_object('ok',true);
  end if;

  if p_action in ('prepare','claim_confirm','complete_confirm','claim_refund','complete_refund') then
    select * into v_order from app.orders
      where (case when p_action in ('claim_refund','complete_refund') then id::text else order_number end) = p_input->>'orderId'
      for update;
  elsif p_action = 'reconcile' then
    select o.* into v_order from app.orders o join app.payments p on p.order_id = o.id
      where p.payment_key = v_provider->>'paymentKey' for update of o;
  else
    raise exception 'UNKNOWN_PAYMENT_ACTION';
  end if;
  if not found then raise exception 'PAYMENT_ORDER_NOT_FOUND'; end if;

  select * into v_payment from app.payments where order_id = v_order.id for update;

  if p_action = 'prepare' then
    if v_order.status <> 'pending_payment' or v_order.expires_at <= now() then
      raise exception 'PAYMENT_ORDER_NOT_READY';
    end if;
    if not exists (select 1 from app.order_items where order_id=v_order.id)
       or exists (select 1 from app.order_items i join app.product_variants v on v.id=i.variant_id
         where i.order_id=v_order.id and v.reserved < i.quantity) then
      raise exception 'PAYMENT_ORDER_ITEMS_NOT_READY';
    end if;
    if v_payment.order_id is null then
      insert into app.payments(order_id,status,amount) values (v_order.id,'prepared',v_order.amount);
    elsif v_payment.status <> 'prepared' or v_payment.recovery_required then
      raise exception 'PAYMENT_ORDER_BUSY';
    end if;
    return jsonb_build_object('ok',true);
  end if;

  if p_action = 'claim_confirm' then
    v_amount := (p_input->>'amount')::integer;
    if v_order.user_id::text <> p_input->>'userId' or v_order.amount <> v_amount then
      raise exception 'PAYMENT_OWNER_OR_AMOUNT_MISMATCH';
    end if;
    if v_order.status = 'paid' and v_payment.payment_key = v_key and v_payment.status = 'paid' then
      return jsonb_build_object('state','paid');
    end if;
    if v_order.status <> 'pending_payment' or v_order.expires_at <= now()
       or v_payment.status <> 'prepared' or v_payment.recovery_required
       or v_payment.payment_key is not null then
      return jsonb_build_object('state','busy');
    end if;
    update app.payments set payment_key = v_key, status = 'confirming',
      recovery_required = true, next_recovery_at = now() + interval '90 seconds', updated_at = now()
      where order_id = v_order.id;
    update app.orders set status = 'confirming' where id = v_order.id;
    return jsonb_build_object('state','claimed');
  end if;

  if p_action = 'complete_confirm' then
    if v_order.status <> 'confirming' or v_payment.status <> 'confirming'
       or v_payment.payment_key <> v_key or v_order.amount <> (p_input->>'amount')::integer
       or v_provider->>'paymentKey' <> v_key or v_provider->>'orderId' <> v_order.order_number
       or (v_provider->>'totalAmount')::integer <> v_order.amount
       or v_provider->>'currency' <> 'KRW' or v_provider->>'status' <> 'DONE' then
      raise exception 'PAYMENT_CONFIRM_MISMATCH';
    end if;
    update app.payments set status='paid', amount=v_order.amount, balance_amount=v_order.amount,
      provider_status='DONE', recovery_required=false, next_recovery_at=null,
      lease_token=null, lease_until=null, updated_at=now() where order_id=v_order.id;
    update app.orders set status='paid' where id=v_order.id;
    if exists (select 1 from app.order_items i join app.product_variants v on v.id=i.variant_id
      where i.order_id=v_order.id and (v.stock<i.quantity or v.reserved<i.quantity)) then
      raise exception 'PAYMENT_INVENTORY_MISMATCH';
    end if;
    update app.product_variants v set stock=v.stock-i.quantity, reserved=v.reserved-i.quantity
      from app.order_items i where i.order_id=v_order.id and i.variant_id=v.id
        and v.stock >= i.quantity and v.reserved >= i.quantity;
    if v_order.coupon_code is not null then
      update app.coupons set reserved=reserved-1, used=used+1
        where code=v_order.coupon_code and reserved>0;
      if not found then raise exception 'PAYMENT_COUPON_MISMATCH'; end if;
    end if;
    insert into app.outbox(effect_key,kind,payload)
      values ('payment-paid:'||v_order.id,'PAYMENT_CONFIRMED',jsonb_build_object('order_id',v_order.id))
      on conflict(effect_key) do nothing;
    return jsonb_build_object('ok',true);
  end if;

  if p_action = 'claim_refund' then
    v_amount := (p_input->>'amount')::integer;
    select * into v_refund from app.payment_refunds where operation_id=v_op for update;
    if found then
      if v_refund.order_id<>v_order.id or v_refund.amount<>v_amount or v_refund.reason<>p_input->>'reason' then
        raise exception 'REFUND_IDEMPOTENCY_CONFLICT';
      end if;
      if v_refund.status='completed' then return jsonb_build_object('state','completed','result',v_refund.result); end if;
      return jsonb_build_object('state','busy');
    end if;
    if v_order.status <> 'paid' or v_payment.status<>'paid'
       or v_payment.recovery_required or v_payment.balance_amount < v_amount
       or v_amount<=0 or v_payment.payment_key is null
       or exists (select 1 from app.payment_refunds where order_id=v_order.id and status='claimed') then
      return jsonb_build_object('state','busy');
    end if;
    insert into app.payment_refunds(operation_id,order_id,actor_id,amount,reason,status)
      values (v_op,v_order.id,(p_input->>'actorId')::uuid,v_amount,p_input->>'reason','claimed');
    update app.payments set status='refund_pending', recovery_required=true,
      next_recovery_at=now()+interval '90 seconds',updated_at=now() where order_id=v_order.id;
    update app.orders set status='refund_pending' where id=v_order.id;
    return jsonb_build_object('state','claimed','orderId',v_order.order_number,
      'paymentKey',v_payment.payment_key,'amount',v_amount,
      'originalAmount',v_order.amount,'balanceBefore',v_payment.balance_amount,
      'isPartialCancelable',true);
  end if;

  if p_action = 'complete_refund' then
    select * into v_refund from app.payment_refunds where operation_id=v_op and order_id=v_order.id for update;
    v_balance := (v_provider->>'balanceAmount')::integer;
    select x into v_cancel from jsonb_array_elements(coalesce(v_provider->'cancels','[]'::jsonb)) x
      where x->>'transactionKey'=v_provider->>'lastTransactionKey' limit 1;
    if v_refund.operation_id is null or v_cancel is null
       or v_refund.status<>'claimed' or v_payment.status<>'refund_pending'
       or v_provider->>'paymentKey'<>v_payment.payment_key
       or v_provider->>'orderId'<>v_order.order_number
       or (v_provider->>'totalAmount')::integer<>v_order.amount
       or v_provider->>'status' not in ('CANCELED','PARTIAL_CANCELED')
       or v_balance<>v_payment.balance_amount-v_refund.amount
       or v_cancel->>'cancelStatus'<>'DONE'
       or (v_cancel->>'cancelAmount')::integer<>v_refund.amount then
      raise exception 'PAYMENT_REFUND_MISMATCH';
    end if;
    update app.payment_refunds set status='completed',transaction_key=v_cancel->>'transactionKey',
      result=jsonb_build_object('status',v_provider->>'status','balanceAmount',v_balance),updated_at=now()
      where operation_id=v_op;
    update app.payments set status='paid', balance_amount=v_balance,
      provider_status=v_provider->>'status',recovery_required=false,next_recovery_at=null,
      lease_token=null,lease_until=null,updated_at=now() where order_id=v_order.id;
    update app.orders set status=case when v_balance=0 then 'refunded' else 'paid' end where id=v_order.id;
    insert into app.outbox(effect_key,kind,payload)
      values ('payment-refund:'||v_op,'PAYMENT_REFUNDED',jsonb_build_object('order_id',v_order.id,'amount',v_refund.amount))
      on conflict(effect_key) do nothing;
    return jsonb_build_object('ok',true);
  end if;

  if p_action = 'reconcile' then
    if v_provider->>'orderId'<>v_order.order_number or v_provider->>'paymentKey'<>v_payment.payment_key
       or (v_provider->>'totalAmount')::integer<>v_order.amount or v_provider->>'currency'<>'KRW' then
      raise exception 'PAYMENT_RECONCILE_MISMATCH';
    end if;
    if v_payment.status='confirming' and v_provider->>'status'='DONE' then
      return app.pg_payment_action('complete_confirm',jsonb_build_object(
        'orderId',v_order.order_number,'amount',v_order.amount,
        'paymentKey',v_payment.payment_key,'payment',v_provider));
    end if;
    if v_payment.status='refund_pending' and v_provider->>'status' in ('CANCELED','PARTIAL_CANCELED') then
      select * into v_refund from app.payment_refunds where order_id=v_order.id and status='claimed' for update;
      if found and exists (select 1 from jsonb_array_elements(coalesce(v_provider->'cancels','[]'::jsonb)) x
        where x->>'transactionKey'=v_provider->>'lastTransactionKey'
          and x->>'cancelStatus'='DONE' and (x->>'cancelAmount')::integer=v_refund.amount) then
        return app.pg_payment_action('complete_refund',jsonb_build_object(
          'orderId',v_order.id,'operationId',v_refund.operation_id,'payment',v_provider));
      end if;
    end if;
    if not v_payment.recovery_required and
       ((v_payment.status='paid' and v_payment.provider_status=v_provider->>'status'
         and v_payment.balance_amount=coalesce((v_provider->>'balanceAmount')::integer,v_order.amount))
         or (v_payment.status='paid' and v_payment.provider_status='DONE'
           and v_provider->>'status'='DONE')) then
      return jsonb_build_object('ok',true);
    end if;
    raise exception 'PAYMENT_REQUIRES_MANUAL_REVIEW';
  end if;
  raise exception 'UNKNOWN_PAYMENT_ACTION';
end;
$$;

-- A pending payment attempt must never be expired or canceled as a plain order.
create or replace function app.release_hold(
  p_order_id uuid, p_from text[], p_to text, p_effect_key text, p_kind text
) returns jsonb language plpgsql set search_path=app as $$
declare v_order app.orders%rowtype;
begin
  select * into v_order from app.orders where id=p_order_id for update;
  if not found then return jsonb_build_object('outcome','not_found'); end if;
  if v_order.status=p_to then return jsonb_build_object('outcome','already'); end if;
  if not (v_order.status=any(p_from)) then
    return jsonb_build_object('outcome','invalid','status',v_order.status);
  end if;
  if exists (select 1 from app.payments where order_id=p_order_id
    and (status <> 'prepared' or payment_key is not null or recovery_required)) then
    return jsonb_build_object('outcome','invalid','status','payment_attempt_exists');
  end if;
  update app.orders set status=p_to where id=p_order_id;
  update app.product_variants v set reserved=v.reserved-i.quantity
    from app.order_items i where i.order_id=p_order_id and i.variant_id=v.id and v.reserved>=i.quantity;
  if v_order.coupon_code is not null then
    update app.coupons set reserved=reserved-1 where code=v_order.coupon_code and reserved>0;
  end if;
  insert into app.outbox(effect_key,kind,payload)
    values (p_effect_key,p_kind,jsonb_build_object('order_id',p_order_id)) on conflict(effect_key) do nothing;
  return jsonb_build_object('outcome','released','order_number',v_order.order_number);
end;
$$;

revoke all on function app.pg_payment_health() from public;
revoke all on function app.pg_payment_action(text,jsonb) from public;
grant execute on function app.pg_payment_health() to noeul_api, service_role;
grant execute on function app.pg_payment_action(text,jsonb) to noeul_api, service_role;
insert into app.content(key,value,published)
  values ('pg_payment_schema_version','{"version":1}'::jsonb,false)
  on conflict(key) do update set value=excluded.value,published=false;
