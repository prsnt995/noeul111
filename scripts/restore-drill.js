#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

console.log('[Restore Drill] Starting verification...');
const backupsDir = path.join(process.cwd(), 'backups');
const backups = fs.readdirSync(backupsDir || '').filter(f => f.endsWith('.sql'));
if (backups.length === 0) { console.error('[Restore Drill] No backups found.'); process.exit(1); }
const latestBackup = backups.sort().pop();
console.log('[Restore Drill] Latest backup:', latestBackup);
console.log('[Restore Drill] Run: psql $DATABASE_URL < backups/' + latestBackup);
console.log('[Restore Drill] Verify checksums against storage-manifest.json');
console.log('[Restore Drill] RTO target: 45 minutes');
