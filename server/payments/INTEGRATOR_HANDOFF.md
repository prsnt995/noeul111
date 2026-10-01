# NOEUL Toss Payments integration and staging acceptance

Please integrate the supplied direct Toss Payments module into the existing service and deploy it to an HTTPS **staging** server. Read [README.md](./README.md) and [TESTING.md](./TESTING.md) first. Do not mark the integration complete from a successful build or mock payment.

## Current evidence (2026-09-29)

- PG service, customer widget page, admin refund UI, recovery worker and mock tests are supplied through the reviewed PG change into `main`.
- The Rozena merchant dashboard shows MID `rozenazay6` as **under review**, with no contract date. A live UI entry does not prove live payment approval.
- Payment UI variant observed: `DEFAULT`. Verify the agreement variant in the merchant dashboard before using the default `AGREEMENT`.
- Matching merchant widget test keys were saved locally in ignored `.env.pg-test` (permission 600). Real SDK/payment methods and the `AGREEMENT` widget render successfully.
- Basic-authenticated order retrieval returned HTTP 200, status `READY`, amount 10,000 KRW and test MID `trozenazay6`. This verifies test key authentication and order visibility, not payment approval.
- Real merchant test acceptance passed: customer Toss Pay authentication → server approval (`DONE`, 10,000 KRW) → partial cancellation (3,000 KRW, balance 7,000) → remaining cancellation (7,000 KRW, balance 0). Provider order lookup and test history were checked. Storage is still ephemeral memory; persistent DB, webhook delivery and deployment remain unverified.
- The provider retained `PARTIAL_CANCELED` at balance 0 after two cancellations, both cancellation transactions `DONE`. Preserve the raw PG status and map completed zero-balance cancellation to domain `refunded` in the DB adapter. The test fixture now reproduces this observed behavior.
- `server/payments/store.js` now calls transactional Supabase functions supplied in `supabase/migrations/202610010001_toss_payment_store.sql`. Applying and verifying that migration in the company project is still required; do not import the memory fixture into the application.

## Keys and authentication

Use a matching widget test pair (`test_gck_…`, `test_gsk_…`) from the same merchant/service. The client key initializes the SDK. Only the server may use the secret key, with `Authorization: Basic base64(secretKey + ':')` over HTTPS. The core already applies this header. See [API keys](https://docs.tosspayments.com/reference/using-api/api-keys) and [authentication](https://docs.tosspayments.com/reference/using-api/authorization).

Keys are supplied separately through an approved private channel or server secret store. They are never included in this document, a Git commit, browser bundle or test result. Existing `.gitignore` excludes `.env` and `.env.*`, except `.env.example`.

The local-only `npm run pg:sandbox` reads `.env.pg-test`, uses the real Toss SDK/API and an ephemeral test order. It rejects live keys and individual API keys. Its authentication is replaced and records disappear on restart: never deploy it, expose it through a tunnel, or use it to prove DB durability. `npm run pg:lab` remains fully mocked.

## Required implementation and report

1. Prepare the company Supabase project, existing schema, customer/admin sessions and a server-priced KRW test order. Apply the supplied payment migration after confirming the existing schema; inspect any migration conflict before proceeding.
2. Inject matching widget test keys into the staging server environment only after the migration succeeds. Payment readiness is automatic from the keys and DB health; there is no `PAYMENTS_ENABLED` switch. Do not copy the local sandbox server into staging.
3. Run `npm run ci` and `npm run pg:preflight`; deploy the normal API and frontend. Configure HTTPS callbacks, session cookies, CSRF, payment recovery/outbox workers and frontend CSP/popup headers.
4. Register the HTTPS `/api/v1/payments/toss/webhook` endpoint for the appropriate test service. Confirm delivery and retries in the Toss developer center.
5. Verify test checkout → provider authentication → server confirmation → DB payment ledger/order paid → Toss test history. Refresh and duplicate callbacks must not approve twice.
6. Verify a 3,000 KRW partial cancellation and remaining balance cancellation on a 10,000 KRW order. Compare provider cancellation history, DB ledger and customer state.
7. Verify DB failure after approval, lost response, process restart recovery, duplicate/reordered webhook, ownership/admin/CSRF/MFA rejection and expiry races. Keep unsupported virtual-account/asynchronous payment methods disabled.
8. Return commit SHA, staging URL, test time, scenario PASS/FAIL, masked order/payment references, provider and DB states, remaining balance and sanitized evidence. Report blockers with exact error codes. Do not return keys, cookies or personal payment information.

Production activation, merchant approval and real-money settlement are separate acceptance steps.

## Copy-ready prompt for your coding agent

> Start with server/payments/START_HERE.md. The real Supabase adapter and SQL migration are already in this repository. Apply the new migration to the company project after checking the existing schema, then set the separately supplied matching widget test keys on the server. Run npm run ci and npm run pg:preflight, deploy the normal application to HTTPS staging, and verify test payment approval, DB ledger/order persistence, duplicate callbacks, partial/full cancellation, webhook retries and process-restart recovery. Report commit, staging URL, scenario results and sanitized provider/DB evidence. Never put secrets in Git, frontend code or output. Keep live keys out until merchant/payment-method approval and production acceptance.

For the normal server, inject `TOSS_CLIENT_KEY` and `TOSS_SECRET_KEY` into the process environment or an ignored `.env`. `.env.pg-test` is loaded automatically only by the local sandbox; copying that file beside the normal server alone will not load it. Start with `.env.example` for the other Supabase/session settings.
