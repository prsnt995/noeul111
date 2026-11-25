-- Atomic upsert/append for JSON content documents (media, banners, ...).
-- Replaces the read-modify-write pattern in api/admin.js saveDocItem, which
-- lost entries when multiple upload batches or admins wrote concurrently.
create or replace function app.doc_item_upsert(
  p_key text,
  p_id text,
  p_item jsonb,
  p_mode text default 'upsert'  -- 'upsert' | 'append'
) returns jsonb
language plpgsql
set search_path = app
as $$
declare
  v_value jsonb;
  v_items jsonb;
  v_idx integer;
begin
  -- Lock the document row (or create it) so concurrent writers serialize.
  select value into v_value from app.content where key = p_key and published = true for update;
  if v_value is null then
    v_value := '[]'::jsonb;
    insert into app.content (key, value, published)
    values (p_key, '[]'::jsonb, true)
    on conflict (key) do nothing;
    select value into v_value from app.content where key = p_key and published = true for update;
  end if;
  if jsonb_typeof(v_value) <> 'array' then
    v_value := '[]'::jsonb;
  end if;

  if p_mode = 'delete' then
    v_value := (
      select coalesce(jsonb_agg(x), '[]'::jsonb)
      from jsonb_array_elements(v_value) as x
      where (x->>'id') is distinct from p_id
    );
  elsif p_mode = 'append' then
    v_value := v_value || jsonb_build_array(p_item);
  else
    -- upsert by id
    v_idx := null;
    for i in 0..jsonb_array_length(v_value)-1 loop
      if (v_value->i->>'id') = p_id then v_idx := i; exit; end if;
    end loop;
    if v_idx is null then
      v_value := v_value || jsonb_build_array(p_item);
    else
      v_value := jsonb_set(v_value, array[v_idx::text], p_item, true);
    end if;
  end if;

  update app.content set value = v_value where key = p_key and published = true;
  return v_value;
end $$;

grant execute on function app.doc_item_upsert(text, text, jsonb, text) to noeul_api, service_role;
