import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeLowStock,
  buildPaidSalesTrend,
  refundsByOrderFrom,
  kstPeriodStart,
  kstDateKey,
  LOW_STOCK_LIMIT,
} from '../api/admin.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('dashboard low stock', () => {
  const products = [
    { id: 1, is_active: true, sku: 'A', name_ko: '활성 상품' },
    { id: 2, is_active: false, sku: 'B', name_ko: '숨김 상품' },
    { id: 3, is_active: true, sku: 'C', name_ko: '재고 충분' },
  ];

  it('uses available stock (stock - reserved) and ignores hidden products/variants', () => {
    const { count, items } = computeLowStock([
      { product_id: 1, stock: 20, reserved: 10, active: true }, // 10 sellable → low
      { product_id: 2, stock: 1, reserved: 0, active: true },   // hidden product → ignored
      { product_id: 3, stock: 100, reserved: 0, active: true }, // plenty
      { product_id: 3, stock: 0, reserved: 0, active: false },  // retired variant → ignored
    ], products);

    expect(count).toBe(1);
    expect(items[0]).toMatchObject({ id: 1, stock: 10, sku: 'A', name_ko: '활성 상품' });
  });

  it('counts a fully reserved variant as sold out', () => {
    const { count, items } = computeLowStock(
      [{ product_id: 1, stock: 5, reserved: 5, active: true }],
      [{ id: 1, is_active: true, sku: 'A', name_ko: 'A' }],
    );
    expect(count).toBe(1);
    expect(items[0].stock).toBe(0);
  });

  it('reports the full count even when the alert list is capped', () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ id: 10 + i, is_active: true, sku: `S${i}`, name_ko: `P${i}` }));
    const variants = many.map((p, i) => ({ product_id: p.id, stock: i, reserved: 0, active: true }));
    const { count, items } = computeLowStock(variants, many);
    expect(count).toBe(13);
    expect(items).toHaveLength(LOW_STOCK_LIMIT);
    expect(items[0].stock).toBe(0); // sorted by lowest availability
  });

  it('does not cap the KPI at the 10-row display limit', () => {
    const admin = read('api/admin.js');
    expect(admin.includes('lowStockCount: lowStock.count')).toBe(true);
    expect(admin.includes('const lowStockItems = lowStock.items;')).toBe(true);
  });
});

describe('dashboard paid revenue trend', () => {
  it('buckets by paid_at (KST) and nets completed refunds', () => {
    const todayStart = new Date('2026-11-25T00:00:00+09:00');
    const orders = [
      { id: 'a', status: 'paid', amount: 50000, created_at: '2026-11-10T12:00:00Z', paid_at: '2026-11-24T16:00:00Z' }, // 11-25 KST
      { id: 'b', status: 'shipped', amount: 30000, created_at: '2026-11-20T01:00:00Z', paid_at: '2026-11-24T02:00:00Z' }, // 11-24 KST
      { id: 'c', status: 'pending_payment', amount: 99999, created_at: '2026-11-25T01:00:00Z', paid_at: null },
    ];
    const refunds = refundsByOrderFrom([{ order_id: 'a', amount: 10000 }]);
    const trend = buildPaidSalesTrend(orders, refunds, { days: 14, todayStart });

    expect(trend).toHaveLength(14);
    expect(trend[trend.length - 1]).toEqual({ date: '2026-11-25', revenue: 40000 });
    expect(trend.find(d => d.date === '2026-11-24')).toEqual({ date: '2026-11-24', revenue: 30000 });
    // Unpaid orders never inflate the chart.
    expect(trend.reduce((s, d) => s + d.revenue, 0)).toBe(70000);
  });

  it('falls back to created_at when paid_at is missing', () => {
    const todayStart = kstPeriodStart('day');
    const key = kstDateKey(todayStart);
    const trend = buildPaidSalesTrend(
      [{ id: 'x', status: 'delivered', amount: 12000, created_at: new Date().toISOString() }],
      new Map(), { todayStart },
    );
    expect(trend[trend.length - 1]).toEqual({ date: key, revenue: 12000 });
  });

  it('uses the capture-date trend helper in the dashboard handler', () => {
    const admin = read('api/admin.js');
    expect(admin.includes('buildPaidSalesTrend(channelRows, refundsByOrder')).toBe(true);
    expect(admin.includes("make('id,order_source,status,amount,created_at,paid_at')")).toBe(true);
  });
});

describe('dashboard reconciliation wiring', () => {
  it('counts payment mismatches across every order, not only the recent page', () => {
    const admin = read('api/admin.js');
    expect(admin.includes('(channelRows || []).reduce')).toBe(true);
    expect(admin.includes('paymentMismatchFor(o, paymentByOrder.get(o.id))')).toBe(true);
  });

  it('nets refunds out of the channel breakdown so it matches total revenue', () => {
    const admin = read('api/admin.js');
    expect(admin.includes('netChannelRows')).toBe(true);
    expect(admin.includes('buildSalesBySource(netChannelRows)')).toBe(true);
  });

  it('shows expired orders in the pipeline so stage counts reconcile with total orders', () => {
    const page = read('src/pages/admin/AdminDashboardPage.jsx');
    expect(page.includes('orderStatuses.expired')).toBe(true);
  });
});
