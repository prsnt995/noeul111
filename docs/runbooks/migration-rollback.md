# Migration Rollback Runbook

## Procedure
1. Lock migration pipeline
2. Restore database from last verified backup
3. Restore Storage objects from manifest
4. Verify checksums match
5. Restart API and worker processes
6. Run smoke tests
7. Resume traffic with heightened monitoring

## RTO Target
- Database restore: < 15 minutes
- Storage restore: < 30 minutes
- Full recovery: < 45 minutes
