# Architecture and safety review of the production plan

Date: 2026-09-18  
Reviewed document: [REMEDIATION_PLAN.md](./REMEDIATION_PLAN.md)  
Review type: design/plan review, not an implementation penetration test or compliance certification

## Executive verdict

The selected architecture is appropriate for a first production release: a TypeScript modular monolith, authoritative Node API, Supabase Postgres/Auth/Storage, background workers, Google-only identity, and Toss-hosted card payments. It is simpler to secure and operate than premature microservices and gives the order/payment/inventory path one transactional authority.

The original merged plan was strong but **not sufficient to call production-ready**. It described the right components while leaving several security-critical choices to implementation: session custody, cross-origin behavior, database privilege boundaries, migration ownership, webhook authenticity, payment/reservation races, Storage recovery, privacy retention, PCI scope, worker delivery semantics, and measurable availability/capacity gates.

Those gaps have now been added to the master plan. The revised plan is a production-oriented specification and is suitable to begin implementation. The system itself remains **not production-ready** until the Phase 8 evidence and sign-offs exist.

## Review conclusion by area

| Area | Verdict after revision | Release condition |
|---|---|---|
| Overall architecture | Accepted | Modular boundaries remain enforced; no direct browser business-data access |
| Authentication/session | Accepted with mandatory design | Opaque server sessions, PKCE/state/nonce, refresh serialization, revocation, CSRF, AAL2 tests pass |
| Authorization/admin | Accepted | Deny-by-default RBAC, staff allowlist, step-up, session revocation, audit evidence |
| Database/data integrity | Accepted | One migration authority, runtime/migration role separation, constraints, transaction/concurrency tests |
| Orders/inventory/coupons | Accepted | State machines and idempotent effects pass concurrent/reordered/retry tests |
| Toss card payments | Accepted conditionally | Merchant configuration, provider idempotency, reconciliation, compensation, PCI evidence |
| Webhooks | Accepted conditionally | Treated as untrusted notifications and verified by server-side Toss retrieval |
| Product media/uploads | Accepted after hardening | Quarantine, decode/re-encode, generated-only public objects, quotas and restore test |
| Privacy/Korean commerce | Incomplete until reviewed | Data map, disclosures, retention/deletion automation, qualified Korean review |
| Availability/recovery | Incomplete until targets set | Numeric SLO/RTO/RPO, capacity test, database-plus-Storage restore drill |
| Observability/response | Accepted conditionally | Redaction, actionable alerts, staffed on-call and exercised runbooks |
| CI/supply chain | Accepted after additions | Protected promotion, pinned dependencies/actions, SBOM/provenance and scans |
| Frontend UX/accessibility | Accepted | WCAG-oriented E2E/visual/accessibility and media-performance gates pass |

## What is architecturally sound

1. **Modular monolith first.** Catalog, cart, order, payment, inventory, CMS, and administration need strong transactional coordination. A single deployable API with domain boundaries is lower-risk than distributed transactions across early microservices.
2. **Backend authority.** Prices, discounts, shipping, stock, roles, ownership, order status, and payment results are recomputed or verified by the API. The client carries intent only.
3. **Supabase as managed primitives, not business logic.** Supabase supplies identity, Postgres, and objects; the application API owns commerce authorization and invariants.
4. **Hosted payment collection.** Toss owns card entry, while the backend confirms exact stored order/amount/currency and reconciles provider state.
5. **Transactional outbox.** Business state and the request to perform asynchronous work commit together, avoiding the classic committed-order/missing-notification gap.
6. **Variant-first catalog.** SKU, color, size, stock, price deltas, and media are tied to exact variants, which supports the requested storefront behavior without trusting UI-only mappings.
7. **Explicit release phases.** Containment comes before feature migration; live payments remain disabled until recovery and replay tests pass.

## Material findings and amendments

### A1. “Production-ready” lacked an evidence boundary — High

**Risk:** readers could treat an architecture document as approval to launch even while the known repository vulnerabilities or provider/configuration tasks remained open.

**Amendment:** the status now states that the document is a security-reviewed target architecture. Production approval requires linked tests, recovery results, security verification, privacy/consumer review, PCI evidence, and named-owner sign-off.

### A2. Browser/API session topology was underspecified — High

**Risk:** mixing Supabase browser sessions, server cookies, and a separate API can create refresh-token races, localStorage exposure, CSRF, permissive CORS, or ambiguous logout/revocation.

**Amendment:** prefer one public origin; use PKCE with state/nonce; keep encrypted provider tokens server-side; expose only a random host-only HTTP-only session cookie; serialize refresh; rotate sessions; apply origin plus CSRF checks; perform fresh identity checks for high-risk operations.

### A3. Supabase service credentials and RLS wording was unsafe by ambiguity — High

**Risk:** Supabase secret/service-role credentials bypass RLS. Using them for ordinary API queries would turn every missed API authorization check into broad data exposure.

**Amendment:** ordinary queries use a dedicated non-owner, non-`BYPASSRLS` Postgres role with minimal grants. Migration and runtime identities are separate. Elevated Supabase credentials use a separate narrowly scoped client only for necessary platform administration. Browser roles are denied access to private business schemas.

### A4. Multiple possible migration owners could create drift — High

**Risk:** “Prisma or Drizzle migrations” plus Supabase tooling allows two histories, destructive production auto-sync, and rollback uncertainty.

**Amendment:** versioned Supabase CLI SQL is the only schema migration authority; Drizzle supplies typed parameterized queries; production auto-sync is forbidden; changes use expand/backfill/switch/contract.

### A5. Exactly-once language was technically unsafe — High

**Risk:** networks and workers provide retries and ambiguous failures, not reliable exactly-once delivery. Designing around exactly once creates duplicate refunds, releases, messages, or stock changes.

**Amendment:** delivery is explicitly at-least-once. Durable unique effect keys, state-machine compare-and-set, transactional outbox records, leases, and idempotent handlers ensure one valid business effect under repetition or reordering.

### A6. Toss webhook and provider calls required stronger rules — Critical for launch

**Risk:** general Toss payment webhooks should not be trusted as signed commands; client redirects are attacker-controlled; provider timeouts can leave the provider and local database disagreeing.

**Amendment:** validate the immutable internal mapping, use provider idempotency keys, store/deduplicate notification identity, then retrieve authoritative payment state from Toss. Query after ambiguous timeouts. Reconcile confirms/cancels/refunds and provider-success/local-commit-failure cases. The live merchant configuration and accepted method are verified independently of the UI.

### A7. Payment completion can race inventory expiry — Critical for launch

**Risk:** a reservation may expire while the customer/provider is completing payment, producing a paid order that cannot be fulfilled.

**Amendment:** reservation TTL covers the Toss payment window plus margin. A late completed charge must atomically reacquire stock or trigger immediate full compensation and an operational alert. This branch gets explicit concurrency and provider-sandbox tests.

### A8. Hosted payments do not eliminate PCI responsibility — High

**Risk:** the storefront can still be compromised to redirect payment or tamper with scripts. Assuming “Toss handles PCI” without confirming scope is unsafe.

**Amendment:** NOEUL never collects or logs card fields, CSP restricts payment dependencies, script/supply-chain integrity is tested, and the merchant/acquirer confirms the applicable PCI scope and attestation before launch.

### A9. Public image handling needed a trust boundary — High

**Risk:** extension/MIME checks alone do not stop active content, polyglots, decompression bombs, metadata leakage, or dangerous parser workloads.

**Amendment:** uploads enter a private quarantine; the worker validates magic bytes and bounded decoding, rejects active/complex formats, strips metadata, re-encodes raster files, and publishes only generated immutable renditions. Originals are private or deleted.

### A10. Supabase database backup does not restore Storage objects — High

**Risk:** restoring database metadata without corresponding product objects creates a corrupt storefront and incomplete disaster recovery.

**Amendment:** define numeric RTO/RPO and maintain a separate versioned/off-site object recovery source. Restore drills cover database and Storage together and compare manifests/checksums.

### A11. Privacy and Korean commerce obligations were too generic — High

**Risk:** account deletion can conflict with legally required transaction retention; cross-border subprocessors and marketing consent can be undocumented; indefinite logs/backups can defeat deletion.

**Amendment:** the plan now requires a complete data map, purpose/basis/consent inventory, Korean-first disclosures, versioned consent, privacy-request workflow, legal holds, separated statutory records, subprocessor deletion tracking, and automated retention. Listed retention periods are only an initial legal-validation baseline and require qualified Korean review.

### A12. Reliability had no numeric acceptance targets — Medium/High

**Risk:** “fast,” “available,” and “restore succeeds” are not testable; capacity and incident response can fail without a release blocker.

**Amendment:** owners must approve traffic assumptions, SLOs, p95 latency/error targets, RTO/RPO, connection budgets, peak/load/soak tests, alert thresholds, and timed restore/rollback results.

### A13. Supply-chain and production-access controls were incomplete — High

**Risk:** payment-page compromise can originate through dependencies, CI actions, preview data, leaked artifacts, or unrestricted cloud-console access.

**Amendment:** protected promotion, pinned actions, lockfile installs, secrets/SAST/dependency/license scans, SBOM/provenance, immutable artifacts, isolated previews, audited/time-bounded production access, MFA, and emergency key rotation are mandatory.

### A14. The original delivery estimate was too optimistic — Medium

**Risk:** compressed timelines pressure teams to skip security tests, content migration, operational drills, accessibility, privacy, and provider edge cases.

**Amendment:** planning ranges are now 18–24 weeks for one experienced implementation engineer with supporting functions, or 12–16 weeks for two experienced engineers with parallel frontend/platform ownership. Phase 1 produces the evidence needed to re-estimate.

## Residual decisions that must be closed

These do not prevent containment and Phase 1 work, but they prevent final design freeze or production launch:

1. Exact production domains and whether `/api` can be reverse-proxied under the storefront origin.
2. API/worker host, stable egress availability, regions, rolling-deploy behavior, and operational owner.
3. Supabase organization/plan, project region, PITR window, network restrictions, and approved RTO/RPO.
4. Direct card only versus allowing card-backed easy-pay wallets; Toss merchant widget variant and contract evidence.
5. Expected daily/peak traffic, catalog/variant/media volume, sale-event multiplier, and acceptable checkout queueing.
6. Shipping geography/carriers, tax/invoice handling, cancellation/returns/refund rules, and stock allocation policy.
7. Email/SMS, analytics, support, error-monitoring, CDN, and malware-scanning providers and their data regions/contracts.
8. Staff roster, role matrix, refund/export approval thresholds, emergency access, and on-call schedule.
9. Korean privacy/consumer counsel approval, business registration/display requirements, cross-border transfers, retention, and incident-notification procedure.
10. Accessibility target (recommended WCAG 2.2 AA), supported browsers/devices, Korean/English content ownership, and image-alt-text workflow.

## Production approval evidence pack

Production remains off until one release record links all of the following:

- all 25 original audit findings, their regression tests, fixes, reviewers, and deployed versions;
- threat model and resolved high/critical abuse cases;
- architecture/data-flow diagrams, ADRs, schema and API specification;
- Google/Supabase auth, CSRF, IDOR, role/MFA, revocation, and session-race test results;
- migration/grant/RLS checks and Supabase Security Advisor/production-checklist results;
- order/inventory/coupon concurrency and invariant reports;
- Toss sandbox matrix, merchant card-only configuration, reconciliation/compensation/refund evidence, and PCI determination;
- upload/media adversarial tests and object restore manifest;
- Korean privacy/consumer documents, retention schedule, subprocessor inventory, and counsel approval;
- ASVS 5.0 Level 2 traceability plus selected Level 3 controls and independent penetration-test closure;
- accessibility, responsive, browser, performance, load, soak, and provider-degradation reports;
- numeric SLO/RTO/RPO/capacity sign-off and timed database-plus-Storage restore, rollback, and incident exercises;
- secrets/ownership/rotation register, SBOM/provenance, dependency exceptions, and production access review;
- signed approvals from engineering, security, product, legal/privacy, payment/business, and operations owners.

## Reference basis

- Supabase server-side authentication and PKCE: <https://supabase.com/docs/guides/auth/server-side/advanced-guide>
- Supabase user sessions: <https://supabase.com/docs/guides/auth/sessions>
- Supabase RLS and bypass behavior: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase production checklist: <https://supabase.com/docs/guides/deployment/going-into-prod>
- Supabase backups (including Storage exclusion): <https://supabase.com/docs/guides/platform/backups>
- Supabase connection pooling/limits: <https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits>
- Toss payment widget: <https://docs.tosspayments.com/en/integration-widget>
- Toss payment API and idempotency: <https://docs.tosspayments.com/en/api-guide>
- Toss webhooks: <https://docs.tosspayments.com/en/webhooks>
- OWASP ASVS 5.0: <https://owasp.org/projects/asvs>
- PCI SSC hosted-payment guidance: <https://www.pcisecuritystandards.org/faqs/1438/>
- Korean Personal Information Protection Act: <https://www.law.go.kr/lsInfoP.do?lsiSeq=270351&urlMode=engLsInfoR&viewCls=engLsInfoR>
- Korean e-commerce transaction-record retention decree: <https://www.law.go.kr/LSW/lsInfoP.do?chrClsCd=010202&efYd=20160930&lsId=009338&lsiSeq=186737&urlMode=engLsInfoR&viewCls=engLsInfoR>
