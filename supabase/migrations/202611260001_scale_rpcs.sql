-- Scale RPCs: move heavy aggregation from JS to Postgres.
-- Each function is SECURITY DEFINER so the API role can call it; all return
-- the same shapes the JS fallback produces, so callers degrade gracefully.

-- 1. admin_totals already exists (see 202611150001). Add business summary.
create or replace function app.business_summary(p_period text, p_from text, p_to text)
returns jsonb
language plpgsql
security definer
set search_path = app, public
as $$
declare
  v_from timestamptz;
  v_to   timestamptz;
begin
  -- Period bounds are computed in JS (KST-aware); here we just echo the
  -- pre-filtered aggregates for the supplied range. Callers pass ISO bounds.
  if p_from is not null and p_from <> '' then v_from := p_from::timestamptz; end if;
  if p_to   is not null and p_to   <> '' then v_to   := p_to::timestamptz; end if;

  return jsonb_build_object(
    'order_count', (select count(*) from app.orders
      where (v_from is null or created_at >= v_from)
        and (v_to   is null or created_at <= v_to)),
    'expense_count', (select count(*) from app.business_expenses
      where (v_from is null or expense_date::timestamptz >= v_from)
        and (v_to   is null or expense_date::timestamptz <= v_to)),
    'revenue', (select coalesce(sum(amount),0) from app.orders
      where status in ('paid','processing','shipped','delivered')
        and (v_from is null or created_at >= v_from)
        and (v_to   is null or created_at <= v_to))
  );
end $$;

grant execute on function app.business_summary(text,text,text) to noeul_api;

-- 2. Channel/payment aggregation for the admin dashboard.
create or replace function app.admin_dashboard_channels()
returns jsonb
language sql
security definer
set search_path = app, public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', o.id,
    'order_source', o.order_source,
    'status', o.status,
    'amount', o.amount,
    'created_at', o.created_at,
    'paid_at', o.paid_at
  )), '[]'::jsonb)
  from app.orders o;
$$;

grant execute on function app.admin_dashboard_channels() to noeul_api;