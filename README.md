# NOEUL — Korean Contemporary Fashion E-Commerce

NOEUL (노을) is a premium Seoul contemporary fashion e-commerce platform built with React, Vite, Express, Supabase, and Toss Payments.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, Wouter routing, Lucide React icons |
| Backend | Express 4, Node.js (ESM) |
| Database | Supabase (PostgreSQL 15) with RLS |
| Payments | Toss Payments (card, easy pay) |
| Auth | Cookie-session + Google OAuth + email/password |
| Styling | Inline CSS + CSS variables, custom design system |
| Tests | Vitest (302 tests, 25 files) |
| Lint | ESLint + Prettier |

## Project Structure

```
noeul111/
├── api/                 # Supabase-backed API routes (/api/v1)
│   ├── app.js           # Main Express app (auth, catalog, orders, payments, admin)
│   ├── admin.js         # Admin routes (products, orders, coupons, media, business)
│   ├── index.js         # Vercel serverless entry
│   ├── orderSources.js  # Order source helpers (website, instagram, tiktok, other)
│   └── related.js       # Related-product scoring
├── server/              # Legacy SQLite server (read-only migration aid)
│   ├── routes/          # Legacy route handlers
│   ├── services/        # Email, notification, payment services
│   ├── workers/         # Outbox, expiry, payment recovery workers
│   ├── db/              # SQLite database + seed
│   └── middleware/      # Auth middleware (legacy JWT)
├── src/                 # React frontend
│   ├── pages/           # Storefront + admin pages
│   ├── components/      # Shared UI components
│   ├── context/         # React context providers (auth, cart, wishlist, etc.)
│   ├── utils/           # API client, formatters, image helpers, upload, SKU
│   ├── config/          # Business info, upload limits
│   ├── data/            # Product dataset
│   ├── styles/          # CSS design system
│   └── locales/         # i18n (ko.json)
├── supabase/            # Supabase config + migrations
├── scripts/             # Verify, backup, migrate, upload assets, rotate secrets
├── test/                # Vitest test suite
├── public/              # Static assets (robots.txt, sitemap.xml, product images)
└── package.json
```

## Quick Start

### 1. Install Dependencies

```bash
cd noeul111
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

**Required environment variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend server port | `5001` |
| `APP_ORIGIN` | Frontend origin (for CORS) | `http://localhost:5173` |
| `SESSION_KEY` | 64-hex char session encryption key | `openssl rand -hex 32` |
| `JWT_SECRET` | 48-hex char JWT secret | `openssl rand -hex 48` |
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_SECRET_KEY` | Supabase service_role key | `sb_secret_...` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key | `sb_publishable_...` |
| `SMTP_HOST` | SMTP host (email) | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | |
| `SMTP_PASS` | SMTP password (required for production email) | |
| `EMAIL_FROM` | From address | `noeulenterprises@gmail.com` |
| `TOSS_CLIENT_KEY` | Toss Payments client key | `test_gck_...` or `live_gck_...` |
| `TOSS_SECRET_KEY` | Toss Payments secret key | `test_gsk_...` or `live_gsk_...` |

Generate secrets:

```bash
./scripts/rotate-secrets.sh
```

### 3. Run Supabase Migrations

```bash
export SUPABASE_URL=https://your-project.supabase.co
npm run migrate
```

### 4. Upload Product Assets to Supabase Storage

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SECRET_KEY=sb_secret_...
npm run upload:assets
```

### 5. Start Development

```bash
# Start both backend (port 5001) and frontend (port 5173)
npm run dev

# Or start individually
npm run server   # Backend API
npm run client   # Vite dev server
```

Frontend: `http://localhost:5173`
Backend API: `http://localhost:5001`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run server` | Start Express backend on port 5001 |
| `npm run client` | Start Vite dev server on port 5173 |
| `npm run build` | Production Vite build |
| `npm run preview` | Preview production build |
| `npm start` | Start production API server |
| `npm test` | Run Vitest test suite |
| `npm run test:watch` | Watch mode for tests |
| `npm run test:coverage` | Test coverage report |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run typecheck` | TypeScript type check |
| `npm run format` | Prettier format |
| `npm run ci` | Full CI pipeline (typecheck + lint + test + build) |
| `npm run verify:production` | Production readiness audit (37 checks) |
| `npm run seed` | Seed the database (catalog/content only, no users) |
| `npm run migrate` | Run Supabase migrations |
| `npm run backup` | Backup database + storage manifest |
| `npm run upload:assets` | Upload product images to Supabase Storage |
| `npm run backfill:skus` | Backfill category-based SKUs (dry-run by default) |

## Authentication

### Customer Auth
- **Google OAuth:** `/api/v1/auth/google/start` → redirects to Google → callback sets session cookie
- **Email/Password:** `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/request-password-reset`, `/api/v1/auth/reset-password`
- Sessions are cookie-based (`noeul_session`), HttpOnly, SameSite=Lax, with CSRF protection

### Admin Auth
- **Google OAuth:** Staff accounts sign in with allowlisted Google accounts
- **Email/Password:** `POST /api/v1/auth/admin/login` — staff-only, requires `staff_members` row with `super_admin` or `admin` role
- Admin routes are under `/api/v1/admin/*` and require staff authentication + step-up (MFA) for sensitive operations

## Payments

Toss Payments integration with:
- **Prepare:** Reserve payment amount, generate widget config
- **Confirm:** Confirm payment via Toss `confirm` API with reconciliation
- **Recover:** Recover payment state after browser exit/callback loss
- **Refund:** Partial/full refunds with idempotency keys
- **Webhook:** Reconciliation-only (re-verifies against Toss, never trusts payload)
- **Recovery Worker:** Durable payment recovery with lease protocol and exponential backoff

## Testing

```bash
npm test              # All 302 tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Test files cover: auth gating, password auth, payments, SKU system, product save, upload robustness, business management, admin pagination, migration contracts, storefront paging, related products, and wave 0-4 critical paths.

## Production Deployment

### Vercel

1. Connect repository to Vercel
2. Add environment variables in Vercel project settings
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. The `vercel.json` handles API route rewrites and SPA fallback

### Production Checklist

- [ ] `SESSION_KEY` and `JWT_SECRET` are 64/48 hex chars respectively
- [ ] `SMTP_PASS` is configured for production email delivery
- [ ] `TOSS_SECRET_KEY` is live mode (`live_gsk_...`)
- [ ] Supabase migrations applied
- [ ] `npm run verify:production` passes all checks
- [ ] `npm run ci` passes
- [ ] Product images uploaded to Supabase Storage

## Key Design Decisions

- **Cookie-session auth** (not JWT in localStorage) — CSRF protected, HttpOnly
- **Fail-closed payments** — legacy adapter throws, only verified Toss integration works
- **Atomic order placement** — PostgreSQL RPC with row-level locks prevents overselling
- **Durable payment recovery** — lease protocol, no re-charging on ambiguity
- **Honest email states** — stream transport buffers in dev, never reports false delivery
- **No default admin credentials** — seed creates no users/passwords/orders
- **Route-split admin bundle** — lazy-loaded admin pages reduce storefront bundle size

## License

Private — NOEUL ENTERPRISES
