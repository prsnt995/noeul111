#!/usr/bin/env node
// Production dependency audit gate.
//
// `npm audit --omit=dev --audit-level=moderate` currently fails on xlsx,
// which has two advisories and no patched release on npm (SheetJS publishes
// newer builds outside the npm registry). The admin-only spreadsheet import/
// export is the sole consumer; we keep the dependency pinned and allowlist it
// here so every other production advisory still fails CI.
//
// Usage: npm audit --omit=dev --json > audit.json || true
//        node scripts/audit-gate.mjs audit.json
import { readFileSync } from 'node:fs';

const ALLOWLIST = new Map([
  ['xlsx', 'No patched npm release (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9); admin-only import/export.'],
]);

const severityRank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const MIN_RANK = severityRank.moderate;

let raw = '';
try {
  raw = readFileSync(process.argv[2] || 0, 'utf8');
} catch (err) {
  console.error(`[audit-gate] cannot read audit report: ${err.message}`);
  process.exit(2);
}

let report;
try {
  report = JSON.parse(raw);
} catch (err) {
  console.error(`[audit-gate] invalid JSON: ${err.message}`);
  process.exit(2);
}

const vulnerabilities = report.vulnerabilities || {};
const blocking = [];
const allowed = [];

for (const [name, vuln] of Object.entries(vulnerabilities)) {
  const rank = severityRank[vuln.severity] ?? 0;
  if (rank < MIN_RANK) continue;
  if (ALLOWLIST.has(name)) {
    allowed.push({ name, severity: vuln.severity, reason: ALLOWLIST.get(name) });
  } else {
    blocking.push({ name, severity: vuln.severity, via: vuln.via });
  }
}

for (const item of allowed) {
  console.warn(`[audit-gate] allowed ${item.name} (${item.severity}): ${item.reason}`);
}

if (blocking.length > 0) {
  console.error('[audit-gate] blocking production advisories:');
  for (const item of blocking) {
    const via = Array.isArray(item.via)
      ? item.via.map(v => (typeof v === 'string' ? v : v.title || v.url)).join('; ')
      : String(item.via);
    console.error(`  - ${item.name} (${item.severity}): ${via}`);
  }
  process.exit(1);
}

console.log(`[audit-gate] OK — ${allowed.length} allowlisted, 0 blocking.`);
