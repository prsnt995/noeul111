-- Atomic coupon claim (audit #3 finding: claim race).
-- POST /me/coupons previously read limit_count then inserted in two steps,
-- so concurrent claims could overshoot the limit. This function holds a row
-- lock on the coupon, enforces window + limit + per-user uniqueness, and
-- inserts the user_coupon in a single transaction. Metadata-only DDL.
create or replace function app.claim_coupon(p_user_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_coupon record;
begin
  select * into v_coupon from app.coupons where code = p_code for update;
  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;
  if v_coupon.starts_at > now() or v_coupon.ends_at < now() then
    return jsonb_build_object('outcome', 'expired');
  end if;
  if v_coupon.used + coalesce(v_coupon.reserved, 0) >= v_coupon.limit_count then
    return jsonb_build_object('outcome', 'limit');
  end if;
  if exists (select 1 from app.user_coupons where user_id = p_user_id and coupon_code = p_code) then
    return jsonb_build_object('outcome', 'duplicate');
  end if;
  insert into app.user_coupons(user_id, coupon_code, status)
  values (p_user_id, p_code, 'active');
  return jsonb_build_object('outcome', 'created');
end;
$$;

grant execute on function app.claim_coupon(uuid, text) to noeul_api, service_role;
