-- Allow the backend's Supabase REST client to address the protected app schema.
-- This does not grant anon/authenticated access; table privileges and RLS remain
-- controlled by 202609180001_core.sql.
alter role authenticator set pgrst.db_schemas = 'public, app';
notify pgrst, 'reload config';
