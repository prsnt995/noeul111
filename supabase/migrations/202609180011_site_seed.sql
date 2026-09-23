-- Wave 4 (M9): seed the public site document so /store/settings/public
-- returns stored values instead of hardcoded fallbacks. Idempotent.
insert into app.content(key, value, published) values
  ('site', '{"name":"NOEUL"}', true)
on conflict (key) do nothing;
