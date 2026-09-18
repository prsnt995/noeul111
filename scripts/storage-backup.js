#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

console.log('[Storage Backup] Generating manifest...');
const manifest = {
  timestamp: new Date().toISOString(),
  version: 1,
  objects: [],
  checksums: []
};
const storageDir = path.join(process.cwd(), 'uploads');
if (fs.existsSync(storageDir)) {
  const files = fs.readdirSync(storageDir, { recursive: true });
  manifest.objects = files.map(f => ({ path: f, size: fs.statSync(path.join(storageDir, f)).size }));
}
const manifestPath = path.join(process.cwd(), 'backups', 'storage-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('[Storage Backup] Manifest saved:', manifestPath);
