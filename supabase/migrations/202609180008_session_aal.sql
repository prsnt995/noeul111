-- Wave 1: session assurance level for step-up MFA on high-risk operations.
-- Sole schema authority; run with migration credentials, never the API role.
alter table app.sessions add column if not exists aal text not null default 'aal1';
