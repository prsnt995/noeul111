# Recovery & Disaster Recovery Plan

## RTO/RPO Targets
| Data Class | RTO | RPO |
|---|---|---|
| Orders | 15 min | 0 (transactional) |
| Products/Catalog | 5 min | 5 min |
| Customer Data | 15 min | 0 |
| Media/Storage | 30 min | 1 hour |
| Audit Logs | 1 hour | 1 hour |

## Database Recovery
1. Restore from Supabase PITR backup
2. Verify checksums against manifest
3. Run migration drift check
4. Restart API and workers
5. Smoke test all critical paths
6. Resume traffic with heightened monitoring

## Storage Recovery
1. Restore from versioned Storage backup
2. Verify object checksums
3. Update CDN cache invalidation
4. Verify public media URLs

## Capacity Planning
- Connection budget: 100 max connections per process
- Query timeout: 30 seconds
- Idle timeout: 60 seconds
- Pool size: 5 minimum, 20 maximum

## Graceful Shutdown
1. Stop accepting new requests
2. Drain in-flight requests (30 second timeout)
3. Release job leases
4. Close database connections
5. Process final outbox events
