#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const projectDir = process.cwd();
const backupDir = path.join(projectDir, 'backups', new Date().toISOString().split('T')[0]);
fs.mkdirSync(backupDir, { recursive: true });

console.log('[Backup] Starting database backup...');
try {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) { console.error('[Backup] DATABASE_URL required'); process.exit(1); }
  execSync(`pg_dump "${connectionString}" > "${path.join(backupDir, 'database.sql')}"`, { cwd: projectDir });
  console.log('[Backup] Database backup saved to:', path.join(backupDir, 'database.sql'));
} catch (err) {
  console.error('[Backup] Database backup failed:', err.message);
  process.exit(1);
}

console.log('[Backup] Starting Storage backup manifest...');
const manifest = { timestamp: new Date().toISOString(), type: 'storage-manifest', version: 1 };
fs.writeFileSync(path.join(backupDir, 'storage-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('[Backup] Storage manifest saved.');
