import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Follow-ups: ManualOrderModal adm conversion, CSV export, privacy resolution.
// Static analysis (no runtime imports) per repo test conventions.

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');
const app = read('api/app.js');
const manual = read('src/components/admin/ManualOrderModal.jsx');
const csvUtil = read('src/utils/csv.js');
const ordersPage = read('src/pages/admin/AdminOrdersPage.jsx');
const customersPage = read('src/pages/admin/AdminCustomersPage.jsx');
const privacyPage = read('src/pages/admin/AdminPrivacyPage.jsx');

describe('Follow-ups — ManualOrderModal adm conversion', () => {
  it('uses adm shell classes instead of fixed inline modal', () => {
    expect(manual.includes('adm-backdrop'), 'adm backdrop').toBe(true);
    expect(manual.includes('adm-modal'), 'adm modal').toBe(true);
    expect(manual.includes('className="backdrop"'), 'no legacy backdrop').toBe(false);
  });

  it('two-column grids collapse on mobile via adm-form-grid', () => {
    expect(manual.includes('adm-form-grid'), 'adm form grid').toBe(true);
    expect(manual.includes("gridTemplateColumns: '1fr 1fr'"), 'no fixed 2-col grid').toBe(false);
  });

  it('supports Esc-to-close and labelled controls', () => {
    expect(manual.includes('Escape'), 'esc handler').toBe(true);
    expect(manual.includes('aria-label'), 'aria labels').toBe(true);
    expect(manual.includes('adm-label'), 'adm labels').toBe(true);
  });

  it('keeps the manual-order API contract untouched', () => {
    expect(manual.includes("adminApi.post('/admin/orders/manual'"), 'manual create route').toBe(true);
    expect(manual.includes('adminApi.get(`/admin/coupons/validate'), 'coupon pre-check').toBe(true);
  });
});

describe('Follow-ups — CSV export', () => {
  it('csv util escapes, BOM-prefixes, and downloads', () => {
    expect(csvUtil.includes('\\uFEFF'), 'BOM for Excel').toBe(true);
    expect(csvUtil.includes('replace(/"/g'), 'quote escaping').toBe(true);
    expect(csvUtil.includes('export function toCsv'), 'toCsv').toBe(true);
    expect(csvUtil.includes('export function downloadCsv'), 'downloadCsv').toBe(true);
    expect(csvUtil.includes('export function csvFilename'), 'csvFilename').toBe(true);
  });

  it('orders page exports the current filter across pages', () => {
    expect(ordersPage.includes('handleExportCsv'), 'export handler').toBe(true);
    expect(ordersPage.includes('downloadCsv(csvFilename('), 'download wiring').toBe(true);
    expect(ordersPage.includes('pageSize: 200'), 'paged fetch').toBe(true);
  });

  it('customers page exports the current search across pages', () => {
    expect(customersPage.includes('handleExportCsv'), 'export handler').toBe(true);
    expect(customersPage.includes('downloadCsv(csvFilename('), 'download wiring').toBe(true);
  });
});

describe('Follow-ups — privacy request resolution', () => {
  const marker = "app.patch('/api/v1/admin/privacy-requests/:id'";
  const idx = app.indexOf(marker);
  const block = idx === -1 ? '' : app.slice(idx, idx + 1500);

  it('PATCH route exists and is staff-gated with step-up', () => {
    expect(idx, marker).toBeGreaterThan(-1);
    expect(block.includes("staff(['super_admin','admin'])"), 'role gate').toBe(true);
    expect(block.includes('stepUp'), 'step-up').toBe(true);
  });

  it('only allows terminal transitions with validation', () => {
    expect(block.includes('INVALID_STATUS'), '400 on bad status').toBe(true);
    expect(block.includes('PRIVACY_NOT_FOUND'), '404 on missing').toBe(true);
    expect(block.includes('PRIVACY_ALREADY_RESOLVED'), '409 on resolved').toBe(true);
  });

  it('audit-logs the resolution with before/after', () => {
    expect(block.includes("'PRIVACY_RESOLVE'"), 'audit action').toBe(true);
    expect(block.includes('before:'), 'before state').toBe(true);
    expect(block.includes('after:'), 'after state').toBe(true);
  });

  it('privacy page confirms resolve/reject through the new endpoint', () => {
    expect(privacyPage.includes('adminApi.patch(`/admin/privacy-requests/'), 'patch call').toBe(true);
    expect(privacyPage.includes('setResolveAction'), 'confirm flow').toBe(true);
    expect(privacyPage.includes('되돌릴 수 없'), 'terminal warning').toBe(true);
  });
});
