# Deployment & Operations Guide

## CI/CD Pipeline
1. `npm run ci` must pass (typecheck, lint, test, build)
2. Build immutable artifact
3. Promote same artifact through staging → production
4. Deploy with migration lock
5. Canary traffic (5% → 25% → 100%)
6. Feature flags for new functionality
7. Rollback criteria: error rate > 1%, latency > p95 target

## Environment Configuration
- Staging: isolated Supabase project, non-live Toss keys
- Production: dedicated Supabase project, live Toss keys
- All secrets in secret manager, never in code
- Environment variables validated at startup

## Health Checks
- `GET /health/live` - process is running
- `GET /health/ready` - database connection verified
- `GET /health/readiness` - full system readiness

## Worker Operations
- Outbox worker runs as separate process
- Job leases with exponential backoff
- Dead-letter queue for failed events
- Scheduled reconciliation jobs

## Monitoring Targets
- Auth abuse: > 10 failed logins/min from single IP
- Privilege changes: any staff role change
- Checkout failures: > 5% failure rate
- Stock conflicts: > 10 concurrent inventory updates
- Reconciliation mismatch: any divergence
- Outbox backlog: > 100 unprocessed events
- Backup failure: any missed backup
