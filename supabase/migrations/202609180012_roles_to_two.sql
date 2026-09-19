-- 012: Collapse staff roles 4→2 (super_admin, admin) — lean cloth store
-- Data migration: editor/order_manager → admin (no data loss, audit via audit_logs)
update app.staff_members set role='admin' where role in ('editor','order_manager');
-- Replace CHECK constraint (auto-named staff_members_role_check)
do $$ begin
  if exists (select 1 from pg_constraint where conname='staff_members_role_check') then
    alter table app.staff_members drop constraint staff_members_role_check;
  end if;
end $$;
alter table app.staff_members add constraint staff_members_role_check check (role in ('super_admin','admin'));
