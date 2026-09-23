# Supabase Production Checklist

## Authentication
- [ ] Google OAuth configured with authorized redirect URLs
- [ ] Email confirmations disabled (Google-only)
- [ ] Phone/SMS auth disabled
- [ ] Anonymous sessions disabled
- [ ] MFA enforced for staff (AAL2)

## Database
- [ ] RLS enabled on all tables
- [ ] `anon` and `authenticated` roles revoked on `app` schema
- [ ] Dedicated service-role key for API (least-privilege)
- [ ] SSL enforcement enabled
- [ ] Database network restrictions configured
- [ ] Organization MFA enabled
- [ ] Security Advisor review completed
- [ ] Connection pool monitoring configured

## Storage
- [ ] Public bucket for product media only
- [ ] Private bucket for operational artifacts
- [ ] File size limits configured
- [ ] MIME type validation enabled
- [ ] CDN cache headers configured

## Security
- [ ] API keys rotated
- [] .env files in .gitignore
- [ ] Row-level security policies tested
- [ ] SQL injection testing completed
- [ ] Audit logging enabled

## Backup
- [ ] Database backups enabled (PITR)
- [ ] Storage object backup configured
- [ ] Restore drill scheduled
- [ ] RTO/RPO targets documented

## Monitoring
- [ ] Connection pool alerts
- [ ] Database performance monitoring
- [ ] Auth failure rate alerts
- [ ] Storage bucket usage alerts
