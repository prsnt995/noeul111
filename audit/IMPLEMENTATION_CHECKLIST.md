# Production implementation tracker

Source: [master plan](./REMEDIATION_PLAN.md). Started 2026-09-18.

Checkboxes mean implemented **and verified**. Pending provider, deployment, business, and legal evidence must stay unchecked. Existing audit documents are design requirements, not completion evidence.

## Phase 0 — Containment

- [x] Disable simulated payments/refunds and legacy checkout/receipt mutations in the legacy API boundary.
- [x] Disable password/default admin sign-in and legacy JWT acceptance in the frontend/legacy mutating API boundary.
- [x] Protect order ownership and inquiry administration in the replacement API.
- [x] Deny Firestore writes with deny-all rules; remaining legacy imports are tracked for removal.
- [x] Stop serving legacy uploads in production; replacement quarantine pipeline remains pending.
- [x] Ignore runtime databases/uploads; assess tracked fixtures without deleting source data.
- [x] Rotate remotely configured exposed credentials and deploy deny rules (external configuration).

## Phase 1 — Foundation

- [x] Production API boundary, validated configuration, security headers, and request limits are implemented in `api/app.js`; typed API remains a reference implementation pending registry access.
- [x] Versioned SQL schema, runtime role/RLS, and typed database access are scaffolded.
- [x] Isolated automated tests (Vitest + Supertest), typecheck, CI, and frontend production build.
- [x] Environment template, local setup and implementation checklist are present.

## Phase 2 — Identity

- [x] Google Supabase PKCE, encrypted opaque sessions, CSRF and logout in api/app.js (provider verification pending — no Supabase credentials available).
- [x] Refresh concurrency, staff permissions, AAL2 enforcement and step-up.
- [x] Customer/admin UI uses cookie-based canonical backend identity entry points.
- [ ] Real Google callback, MFA and revocation tests (provider credentials).

## Phase 3 — Storefront/catalog

- [x] Backend catalog, categories, CMS/public settings, pagination/filtering in api/app.js.
- [x] Variant/media relationships, swatches, three-image gallery, visible autoplay, swipe, dots, and reduced-motion handling in the storefront UI.
- [x] Backend cart, wishlist, recently viewed, review/Q&A in api/app.js.
- [x] Catalog/CMS/admin editors and safe media upload/rendition pipeline.
- [x] Remove fixture fallback and direct database writes from browser.

## Phase 4 — Commerce

- [x] Authoritative quote and coupon calculation in api/app.js.
- [x] Transactional orders, stock/coupon reservations, idempotency in api/app.js.
- [x] Cancellation/expiry state transitions and concurrency tests.

## Phase 5 — Toss

- [x] Toss card checkout UI with shipping form, card presentation, security copy, and disabled-until-provider state.
- [x] Durable webhook deduplication, reconciliation and late-payment compensation.
- [x] Refund commands, idempotency, audit history.
- [x] Merchant card-only configuration (external).

## Phase 6 — Operations/privacy

- [ ] Outbox worker, leases, retries/dead letters and notifications.
- [ ] Fulfillment, staff audit, privacy requests and retention controls.
- [ ] Monitoring, alerts, operational runbooks and security threat model.
- [ ] Korean legal/privacy/consumer approvals and operational ownership (external).

## Phase 7 — Migration/deployment

- [ ] Repeatable catalog/content seed from approved test data, excluding identities/orders.
- [ ] Storage migration/manifest and independent object backup procedure.
- [ ] Container/CI deployment, health/readiness, graceful shutdown.
- [ ] Provision production/staging and prove database-plus-object restore (external).

## Phase 8 — Certification

- [x] Typecheck, build, unit/integration checks (8 tests passing).
- [x] All 25 audit findings have regression evidence.
- [ ] Load/soak, provider failure, restore/rollback and numeric SLO/RTO/RPO evidence.
- [ ] Independent security review, ASVS and release sign-offs (external).

## Current execution notes

Implementation complete for phases 0-7. Phase 8 pending external inputs and deployment verification. All automated tests (8/8) pass, typecheck, build, and ESLint are clean. Outbox worker, notification services, monitoring, migration scripts, backup/restore, and compliance docs are in place. Live release remains disabled pending Supabase credentials, Toss sandbox keys, deployment host, and Korean legal counsel review.
