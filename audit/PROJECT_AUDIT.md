# NOEUL project audit

Date: 2026-09-18 · Revision: de6a83a

**Assessment: not ready for production.** Critical authentication and payment weaknesses, unauthenticated customer-data access, and inventory corruption were found. No application fixes were applied during this audit.

## Scope and evidence

Reviewed the React/Vite storefront, Express routes, SQLite schema and persistence, authentication providers, Firestore rules, upload handling, payment/notification adapters, CMS/admin controls, deployment configuration, and dependency lockfile. Ran a production build, npm advisory audit, read-only SQLite checks, focused API reproductions, and browser checks of the built storefront.

API tests used a copied server with a fresh temporary database and synthetic records. Supabase sync and notification calls were stubbed to prevent external writes. The test harness mounted the relevant original routers and served the production build; it was not a production deployment test. Existing database contents were inspected read-only, without including personal values or hashes in this report.

Evidence labels: **Reproduced** means observed locally; **Source** means directly supported by code inspection; **Conditional** requires a particular deployment/configuration. Severity reflects impact, not a formal CVSS assessment.

## Critical findings

### 1. Payments succeed without payment-provider verification

**Reproduced.** `server/services/paymentService.js:15` and `server/routes/orders.js:146`.

Posting an order with `payment_method: "card"` returned HTTP 201 and `payment_status: "paid"`, without a payment token, gateway call, or confirmation. Any non-bank method other than `vbank` reaches the unconditional paid response; the UI's bank-transfer-only selection does not protect the API. Refunds are simulated too.

**Fix:** reject unsupported methods in production. Create pending orders and transition to paid only after authenticated provider verification of amount, currency, order identity, and transaction identity. Add replay/idempotency protection. Verify that fabricated payment methods cannot create paid orders.

### 2. A default JWT signing secret enables forged admin sessions

**Source; conditional on missing environment override.** `server/config.js:9`, `server/middleware/auth.js:26`.

The server falls back to a public, hardcoded signing secret. A token signed with it for an existing administrator ID passes verification; database role lookup does not prevent impersonation of that ID.

**Fix:** require a strong secret at startup, remove the fallback, and rotate deployed secrets/sessions if the fallback was used. Test startup failure when the secret is absent.

### 3. A committed administrator account still uses the seed password

**Reproduced through read-only bcrypt comparison.** `server/db/seed.js:10`, `server/db/noeul.db`, `src/context/AuthContext.jsx:361`.

One of the two admin accounts in the committed database matches the seed admin password. That password also appears in browser-delivered fallback login code. The database contains six users and 24 orders with contact data, and Git tracks two receipt screenshots. Whether these records are real or synthetic was not established.

**Fix:** rotate the affected account, remove production demo login paths, replace the committed database with sanitized fixtures, and exclude runtime databases/receipts from Git. Assess repository-history exposure before any history cleanup; removing current files alone does not erase older revisions.

### 4. Firestore users can grant themselves administrator privileges

**Source; conditional on deploying these rules.** `firestore.rules:18` and `firestore.rules:25`.

Owners can write arbitrary fields in their user document, while `isAdmin()` trusts that document's `role`. A user can assign their own role to admin and gain cross-user order read/write/delete privileges.

**Fix:** use server-issued custom claims or a server-only role store. Restrict profile writes to an explicit field allowlist. Add emulator tests for self-promotion and cross-user access. Deployed Firestore rules were not inspected.

## High-priority findings

### 5. Orders disclose personal data without ownership verification

**Reproduced.** `server/routes/orders.js:296`, `:328`, `:338`; identity assignment at `:157`.

Anonymous order-detail requests returned HTTP 200. The ownership guard only executes when a requester is already authenticated. The history endpoint accepts a caller-supplied Firebase UID without validating a Firebase token; querying the synthetic victim UID returned its order. Order creation also accepts unverified ownership IDs. Order numbers use a date and only 9,000 possible suffixes per day, making them unsuitable as access credentials.

**Fix:** derive identity from verified sessions, enforce ownership on every order operation, and issue separate high-entropy guest access tokens where guest checkout is supported. Never trust request-body/query identity fields.

### 6. Anyone can replace receipts and change payment state

**Reproduced.** `server/routes/orders.js:253`.

An anonymous request changed a paid synthetic order to `under_review` and replaced its receipt URL. The route has no ownership checks or payment-state transition restrictions and returns the complete updated order.

**Fix:** authenticate before processing uploads, enforce order ownership/guest access, and reject receipt changes after settlement unless an authorized workflow explicitly permits them.

### 7. Public uploads can serve attacker-controlled HTML on the application origin

**Reproduced.** `server/utils/uploader.js:30`, `server/index.js:52`.

A file named `audit.html` with a claimed `image/png` MIME type was accepted through the public receipt endpoint and served as `text/html`. The filter accepts extension OR client-supplied MIME matches, preserves arbitrary extensions, and also allows SVG. Active content opened by an administrator can execute on the application's origin, where auth tokens are stored in localStorage. Uploads happen before the order is checked, permitting orphaned files even for nonexistent orders.

**Fix:** validate content/signatures, use safe generated extensions, reject active formats or serve them as attachments from an isolated origin, restrict uploads before disk writes, and store receipts privately with authorized retrieval and quotas.

### 8. Customer inquiry administration is public

**Reproduced.** `server/routes/inquiries.js:51` and `:61`; mount at `server/index.js:86`.

Anonymous GET and PATCH requests returned HTTP 200 for listing and modifying synthetic inquiries. These routes are mounted before protected admin routers and have no authentication middleware.

**Fix:** apply administrator authorization directly to both routes. Test that anonymous/customer requests fail without disclosing names, contact details, messages, or status.

### 9. Editors and order managers have unrestricted administrator capabilities

**Reproduced.** `server/middleware/auth.js:42`, `server/routes/admin/users.js:26` and `:57`.

`verifyAdmin` treats all four staff roles as equivalent. An editor token successfully created a super-admin account. The same middleware permits staff role changes, password resets, settings changes, and customer/order access. Dedicated admin login inconsistently refuses editor/order-manager accounts, although customer login can issue their tokens.

**Fix:** implement per-action permissions, reserve staff/security management for explicitly authorized roles, protect the last administrator, and align login/UI permissions with server authorization.

### 10. Invalid quantities and repeated product lines corrupt inventory

**Reproduced.** `server/routes/orders.js:53`, `:59`, `:229`.

A quantity of -3 was accepted and increased stock from 9 to 12. Two lines requesting four units each against stock of five were accepted and reduced stock to -3. Normal carts can create separate lines for different sizes/colors of the same product. Product active status and valid variant selections are also not enforced.

**Fix:** require bounded positive integer quantities, validate purchasable status/variants, aggregate demand per inventory key, and use a conditional stock update inside a transaction. Test negative, fractional, repeated, inactive, and insufficient-stock cases.

### 11. Checkout writes are not atomic and retries are not idempotent

**Source.** `server/routes/orders.js:161`–`:230`.

Despite the comment saying “atomically,” order insertion, coupon usage, item insertion, and stock changes execute without a transaction. A later failure leaves earlier writes committed. No idempotency key prevents duplicate orders on retries. Payment awaits occur after validation, permitting overlapping requests to validate the same stock/coupon availability.

**Fix:** define a transactional order/reservation workflow, enforce idempotency with a unique key, and make final stock/coupon checks atomic. Inject failures between writes and verify rollback.

### 12. Firestore permits customers to alter trusted order fields

**Source; conditional on deploying these rules.** `firestore.rules:38`–`:49`.

Order owners can create/update arbitrary fields, including prices, payment status, and ownership. This does not directly update SQLite, but corrupts the Firestore representation consumed by customer account pages. All signed-in users can also read all user profiles under `firestore.rules:24`.

**Fix:** write authoritative orders through a trusted server and allow only narrowly scoped customer fields where necessary. Restrict profile reads to the owner and authorized administrators. Test amount/status/ownership changes and cross-profile reads.

## Functional and operational findings

### 13. Provider logins do not authenticate backend account operations

**Source.** `src/context/AuthContext.jsx:165`, `:234`, `:334`; `src/utils/api.js:4`; `server/middleware/auth.js:26`.

Successful Firebase/Supabase login sets frontend user state but does not obtain the local JWT required by protected API endpoints. Profile updates fail for these sessions; wishlist sync also requires that JWT. Google failure can create a fake logged-in customer, while localStorage restoration can display a stale session.

**Fix:** select a canonical identity model and verify provider tokens on the backend, or exchange them for a backend session. Remove demo success fallbacks and restore sessions only after verification.

### 14. Supabase auth listener calls a nonexistent method

**Reproduced in browser.** `src/context/AuthContext.jsx:100`.

The page logs `Supabase onAuthStateChanged error: TypeError ... is not a function`. The installed SDK exposes `onAuthStateChange`, not `onAuthStateChanged`; no session event subscription is established. The callback also lacks a null-session/sign-out branch.

**Fix:** use the supported SDK method and handle sign-in, refresh, sign-out, and cleanup. Verify state updates across tabs and session expiration.

### 15. Customer account fallback never runs on a Firestore error

**Source.** `src/pages/CustomerAccountPage.jsx:75`, `src/utils/firestoreOrders.js:109`.

Account history fetches the API only after a successful empty Firestore snapshot. The error handler merely logs; permission failures for local/Supabase users leave the loading state unresolved. When Firestore has any orders, it becomes the preferred source even if status updates failed. Admin JWT sessions are not Firebase admin sessions, yet admin UI status sync attempts direct Firestore writes whose failures are swallowed.

**Fix:** fetch authoritative orders independently, propagate subscription failures, and perform status synchronization server-side with monitored retries.

### 16. Wishlist routes are mounted twice

**Reproduced.** `server/index.js:82`, `server/routes/wishlist.js:8` and `:37`.

The frontend requests `/api/wishlist` and `/api/wishlist/toggle`; the actual routes are `/api/wishlist/wishlist` and `/api/wishlist/wishlist/toggle`. The expected read path returned 404 while the doubled path returned 200 with the same valid token.

**Fix:** make router paths relative to their mount and test both read and toggle through the frontend URLs.

### 17. A customer token takes precedence on admin API calls

**Source.** `src/utils/api.js:4`.

When customer and admin sessions coexist, shared API calls select the customer token first. Admin pages fail authorization despite a valid admin login. Some upload code uses the opposite precedence, creating inconsistent behavior.

**Fix:** explicitly select credentials by API scope and test simultaneous customer/admin sessions.

### 18. Shop filters and sorting change the URL but not the displayed state

**Reproduced in browser.** `src/pages/ShopPage.jsx:25`–`:38`, `:89`; same pattern in `src/pages/HomePage.jsx:23`–`:34`.

Selecting descending price changed the URL to `?sort=price_desc`, but the select remained `newest`. Clicking Women changed the URL but did not activate the filter. The effect depends on Wouter `useLocation()`, which tracks the pathname, not the query string. Query-only changes do not rerun it; calling both `pushState` and `setLocation` also adds redundant history entries.

**Fix:** subscribe to `useSearch`/search params or update controlled filter state directly; navigate once. Test sort, filters, search, and back/forward navigation without reloads.

### 19. Gender links and sale filtering do not match the API contract

**Source.** `src/components/common/Footer.jsx:356`, `src/pages/ShopPage.jsx:51`, `server/routes/products.js:56`.

Footer gender links use `category=men/women`, while the API expects `gender`. The frontend sends `isSale`, but the products endpoint never implements that filter. Even after fixing query reactivity, these views remain incorrect.

**Fix:** align parameter names and implement sale semantics consistently across API and fallback catalog. Add fixture-based contract tests.

### 20. Saved shipping settings do not control checkout charges

**Source.** `src/pages/admin/AdminSettingsPage.jsx:364`, `src/context/CartContext.jsx:7`, `server/routes/orders.js:138`.

Admins can save shipping threshold and fee settings, but both cart and checkout calculations use hardcoded constants. The public settings endpoint advertises values the order calculation ignores.

**Fix:** use one authoritative shipping configuration, quote it server-side, and display the returned quote in checkout. Test nondefault values and zero-cost shipping.

### 21. Cancelled/unpaid orders leave inventory and coupon usage consumed

**Source.** `server/routes/orders.js:197` and `:229`; `server/routes/admin/orders.js:121`.

Bank-transfer orders immediately decrement stock and consume coupons. Status changes only edit order fields; no cancellation restock, unpaid reservation expiry, or coupon restoration workflow exists. Repeated unpaid checkout can exhaust availability.

**Fix:** model inventory reservations with expiry, implement idempotent cancellation/release, and clearly define when a coupon is consumed.

### 22. Supabase synchronization lacks stable identity and reliable delivery

**Source.** `server/lib/supabaseSync.js:5`, `:63`, `:130`, `:166`.

Product/order inserts omit local IDs, but subsequent updates address Supabase rows using local SQLite IDs. Independently generated IDs can diverge, causing updates to miss or affect the wrong row. Calls are fire-and-forget with logged errors and no retry/outbox. Category upserts similarly lack an explicit conflict identity.

**Fix:** use explicit shared immutable IDs or persist a mapping, define uniqueness constraints, and add a transactional outbox with observable retries. Remote schemas, RLS, and actual deployed sync state were not available for verification.

### 23. Notifications report success without delivering anything

**Source.** `server/services/notificationService.js:9`, `server/services/emailService.js:24`.

Order/shipping notifications only log success. With no SMTP password, inquiry email uses a stream transporter and logs “sent” without delivery; the inquiry response claims forwarding regardless of the result.

**Fix:** implement real providers, distinguish queued/delivered/failed states, and fail configuration checks when production notification requirements are missing.

### 24. Catalog fallbacks conceal failures and can expose stale products

**Source.** `src/pages/ShopPage.jsx:60`, `src/pages/ProductDetailPage.jsx:56`.

API failures substitute a bundled demo catalog. A product 404 can become a purchasable local product; checkout still requires the real database record. Product navigation to an unknown ID does not clear the previous product when no fallback exists. Public product detail queries also omit the active-status condition used by listing queries.

**Fix:** show explicit unavailable/not-found states, restrict fixtures to development, clear state during product changes, and enforce visibility consistently.

### 25. Dependency, performance, accessibility, and delivery gaps

- **Advisories:** npm reports three moderate affected packages (`qs`, `express`, `body-parser`), reflecting two underlying qs advisories: [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) and [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g). Fixes are available. No updates were applied.
- **Bundle:** the production build passes, but emits one 1,603.22 kB JS bundle (388.57 kB gzip). `src/App.jsx` eagerly imports all storefront and admin pages. Introduce route-level splitting and measure resulting startup performance; no Lighthouse score was measured.
- **Accessibility:** `index.html:7` disables user zoom; auth form labels lack input associations; footer accordion headers are clickable divs. Fix these and run keyboard/screen-reader checks. This was a basic source review, not a complete WCAG assessment.
- **Testing/operations:** no test/lint scripts, test suite, CI configuration, setup README, or environment template was found. `node:sqlite` requires a compatible runtime, but package metadata does not declare one. Add repeatable validation, runtime requirements, migrations, backup/restore procedures, and configuration checks.
- **Abuse controls:** login, public reviews, inquiries, and order/upload creation lack rate limiting in this application. Reviews are immediately approved. Add endpoint-specific controls and moderation where intended; edge controls were not inspected.
- **Deployment:** `vercel.json` contains rewrites but no explicit backend target. Vite build output alone cannot run Express or provide durable SQLite/uploads. Verify the actual deployment topology and persistent storage before launch; no remote deployment was tested.
- **CMS:** homepage code renders a product grid rather than fetching the builder sections; section edits therefore do not drive the current home page. Public banners ignore scheduled dates, and public sections do not filter `is_draft`.

## Executed validation

| Check | Result |
|---|---|
| Locked dependency installation | Passed; scripts disabled |
| `npm run build` | Passed with large-bundle warning |
| `npm audit --json` | 3 moderate affected packages; no high/critical dependency advisories |
| SQLite integrity and foreign-key consistency | `integrity_check: ok`; zero existing FK violations |
| Paid order without provider evidence | Reproduced, HTTP 201 / paid |
| Anonymous order read and UID history lookup | Reproduced, HTTP 200 / victim order returned |
| Anonymous receipt change | Reproduced, paid → under_review |
| Anonymous inquiry read/write | Reproduced, HTTP 200 |
| Negative quantity | Reproduced, stock 9 → 12 |
| Duplicate product lines | Reproduced, stock 5 → -3 |
| Editor creates super-admin | Reproduced, HTTP 201 |
| Wishlist path mismatch | Expected path 404; doubled path 200 |
| HTML receipt upload | Accepted, served as text/html |
| Existing admin seed-password match | One matching admin, checked read-only |
| Browser storefront/shop rendering | Rendered; runtime auth-listener error observed |
| Browser filter/sort behavior | Query changed; controlled state did not |

No live payment, email, Firebase, Supabase, production penetration test, full mobile/assistive-technology run, or remote deployment verification was performed. Source findings about those services must be checked against actual deployment configuration. The repository application code and original database were unchanged.

## Recommended repair order

1. Close public order/inquiry/receipt access; disable simulated payments; rotate exposed/default credentials; harden Firestore rules and uploads.
2. Implement staff permissions and a canonical verified customer session.
3. Make order, stock, coupon, cancellation, and payment operations transactional and idempotent.
4. Repair wishlist routing, provider session handling, query filters, shipping settings, and reliable order synchronization.
5. Add regression checks for the reproduced failures, patch dependencies, validate deployment persistence, and complete responsive/accessibility/provider tests.
