# Payment Failure Runbook

## Timeout
1. Query Toss for payment status before declaring failure
2. If confirmed: update order to paid, release reservations
3. If failed: update order to failed, release inventory
4. If ambiguous: enter reconciliation queue

## Reconciliation
1. Daily scheduled job queries unsettled payments
2. Compare Toss records with local orders
3. Auto-resolve matched records
4. Page operations on divergence
