# Provider Outage Runbook

## Supabase Outage
1. Catalog remains readable (cached)
2. Checkout/payments fail closed
3. Ambiguous payments enter reconciliation
4. Admin displays degraded state

## Toss Outage
1. Toss widget unavailable, payment disabled
2. Existing pending orders remain in queue
3. Reconciliation runs when Toss recovers
4. No new orders can reach paid state

## Google Outage
1. New logins blocked
2. Existing sessions remain valid until expiry
3. Admin panel accessible with existing sessions
