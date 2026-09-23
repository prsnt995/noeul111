# Payment Failure Runbook

## Card Payment Failure (Toss)
Card-only checkout. No bank transfer / receipt workflow exists.

1. **Toss webhook** (`POST /api/v1/payments/toss/webhook`) receives `orderId` + `status`. Order must exist (`orders` table) before the webhook event is recorded.
2. **State transitions**: `pending_payment` → `confirming` (callback) → `paid`/`confirmed` (verification path).
3. **Timeout**: if `pending_payment` persists past `PAYMENT_TIMEOUT_MS`, the expiry sweeper (`server/workers/expiry.js`) marks the order `expired` and releases reservations.
4. **Confirm failure**: if Toss reports failed/declined, the order stays `pending_payment` and the customer can retry.
5. **Ambiguous**: query Toss `orders/confirmations/{orderId}` directly before declaring failure; reconcile via the outbox worker if the webhook was missed.

## Reconciliation
1. The outbox worker (`server/workers/outbox.js`) handles `ORDER_CREATED`, `ORDER_CANCELED`, `ORDER_EXPIRED`, `PAYMENT_CONFIRMED` events with lease protocol and dead-letter surfacing.
2. Stuck `confirming` orders are detected by the expiry sweeper's `reconcileStuckConfirming` pass.
3. Any dead-letter outbox events trigger `alertOps('outbox.dead_letter')` and surface in monitoring.
4. Page operations on divergence: query the order's `payment_status` and `order_status` directly; never use a manual `UPDATE` on `paid`/`confirmed` — only the `verify-payment` admin endpoint can produce those states.
