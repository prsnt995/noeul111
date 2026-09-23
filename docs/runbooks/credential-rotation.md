# Credential Rotation Runbook

## Scope
Rotate Supabase keys, SMTP credentials, Toss API keys, and session secrets.

## Procedure
1. Generate new credentials in provider dashboard
2. Update `.env` with new values
3. Deploy new environment configuration
4. Invalidate all existing sessions via `DELETE FROM sessions`
5. Verify new sessions can be created
6. Monitor for authentication failures for 30 minutes
7. Update secret manager and CI/CD pipeline

## Rollback
Restore previous `.env` values and restart. All old sessions will be invalid by new secret.
