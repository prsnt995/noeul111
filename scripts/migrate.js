#!/usr/bin/env node
import { execSync } from 'node:child_process';

const projectDir = process.cwd();
const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  console.error('SUPABASE_URL is required. Run: export SUPABASE_URL=your_project_url');
  process.exit(1);
}

console.log('[Migrate] Running Supabase migrations...');
try {
  execSync('npx supabase db push --project-ref ' + supabaseUrl.split('/').pop(), { cwd: projectDir, stdio: 'inherit' });
  console.log('[Migrate] Migrations completed successfully.');
} catch (err) {
  console.error('[Migrate] Migration failed:', err.message);
  process.exit(1);
}
