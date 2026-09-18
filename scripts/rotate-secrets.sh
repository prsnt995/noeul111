#!/usr/bin/env bash
set -euo pipefail
# Phase A — Secrets rotation scaffold (manual steps required in dashboards)
# 1) Supabase: Dashboard → Project Settings → API → Rotate service_role secret (sb_secret_...)
# 2) Google Cloud: APIs & Credentials → OAuth 2.0 Client → Regenerate client secret (GOCSPX-...)
# 3) Session/JWT: generated below
# 4) Purge git history if .env was ever pushed: git filter-repo --path .env --invert-paths  (or BFG)
#    then force-push and rotate again.
echo "Generating SESSION_KEY (32 bytes hex) and JWT_SECRET (48 bytes hex)..."
SESSION_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 48)
echo "SESSION_KEY=$SESSION_KEY"
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "Add to .env (development) and to Vercel/Supabase secret manager (production):"
echo "  SESSION_KEY=$SESSION_KEY"
echo "  JWT_SECRET=$JWT_SECRET"
echo ""
echo "Also rotate in dashboards:"
echo "  SUPABASE_SECRET_KEY=sb_secret_... (Supabase → API → service_role)"
echo "  GOOGLE_CLIENT_SECRET=GOCSPX-... (Google Cloud → Credentials)"
echo "  SUPABASE_PUBLISHABLE_KEY=sb_publishable_... (if rotated)"
echo ""
echo "After updating envs: DELETE FROM app.sessions; — forces re-login."
echo "Verify: npm run verify:production && npm run ci"
