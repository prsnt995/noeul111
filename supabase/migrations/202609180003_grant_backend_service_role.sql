-- The Node API uses Supabase's server key, which authenticates as service_role.
-- Keep anon/authenticated denied; grant only the server role access to app.
grant usage on schema app to service_role;
grant select, insert, update, delete on all tables in schema app to service_role;
grant usage, select on all sequences in schema app to service_role;
alter default privileges in schema app grant select, insert, update, delete on tables to service_role;
alter default privileges in schema app grant usage, select on sequences to service_role;
notify pgrst, 'reload config';
