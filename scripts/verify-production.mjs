import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['deny-all Firestore rules', read('firestore.rules').includes('allow read, write: if false')],
  ['production upload isolation', read('server/index.js').includes("process.env.NODE_ENV !== 'production'")],
  ['cookie credentials API', read('src/utils/api.js').includes("credentials: 'include'"),],
  ['no Firebase client imports', !fs.existsSync(path.join(root, 'src/config/firebase.js')) && !fs.existsSync(path.join(root, 'src/utils/firestoreOrders.js'))],
  ['Google-only frontend entry', read('src/context/AuthContext.jsx').includes("/api/v1/auth/google/start")],
  ['no demo admin password', !read('src/pages/admin/AdminLoginPage.jsx').includes('admin1234')],
  ['no simulated payment success', read('server/services/paymentService.js').includes('Legacy payments disabled')],
  ['idempotent orders schema', read('supabase/migrations/202609180001_core.sql').includes('unique(user_id,idempotency_key)')],
  ['Toss card validation', read('api/payments.ts').includes("payment.method==='카드'||payment.method==='CARD'")],
  ['production checklist exists', fs.existsSync(path.join(root, 'audit/IMPLEMENTATION_CHECKLIST.md'))],
  ['outbox worker exists', fs.existsSync(path.join(root, 'server/workers/outbox.js'))],
  ['notification service exists', fs.existsSync(path.join(root, 'server/services/notificationService.js'))],
  ['rate limiting on auth endpoints', read('api/app.js').includes('authLimiter')],
  ['audit logging implemented', read('api/app.js').includes('auditLog')],
  ['privacy request endpoint', read('api/app.js').includes('/api/v1/me/privacy-request')],
  ['shipment tracking endpoint', read('api/app.js').includes('/api/v1/orders/:publicId/tracking')],
  ['review moderation endpoint', read('api/app.js').includes('/api/v1/reviews/:id/moderate')],
  ['health/readiness endpoints', read('api/app.js').includes('/health/ready')],
  ['migration script exists', fs.existsSync(path.join(root, 'scripts/migrate.js'))],
  ['backup script exists', fs.existsSync(path.join(root, 'scripts/backup.js'))],
  ['recovery docs exist', fs.existsSync(path.join(root, 'docs/ops/recovery.md'))],
  ['compliance docs exist', fs.existsSync(path.join(root, 'docs/compliance/asvs-traceability.md'))],
  ['shipments/history/reviews migration', fs.existsSync(path.join(root, 'supabase/migrations/202609180004_shipments_history_reviews.sql'))],
  ['outbox aligned to app.outbox', read('api/app.js').includes("from('outbox')") && !read('api/app.js').includes('outbox_events')],
  ['outbox worker uses leases', read('server/workers/outbox.js').includes('lease_until')],
  ['expiry sweeper exists', fs.existsSync(path.join(root, 'server/workers/expiry.js'))],
  ['dual-write sync removed', !fs.existsSync(path.join(root, 'server/lib/supabaseSync.js'))],
  ['honest email delivery states', read('server/services/emailService.js').includes("transport: 'stream'")],
  ['payments fail closed by default', read('api/app.js').includes("PAYMENTS_ENABLED !== 'true'")],
  ['admin bundle is route-split', read('src/App.jsx').includes('React.lazy') || read('src/App.jsx').includes('lazy(')],

];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);
