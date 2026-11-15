import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  paymentStatusFor,
  paymentMismatchFor,
  kstPeriodStart,
  kstDateKey,
  PAID_ORDER_STATUSES,
} from '../api/admin.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('paymentStatusFor — payment state is not the fulfillment status', () => {
  it('treats the whole paid family as paid', () => {
    for (const status of ['paid', 'processing', 'shipped', 'delivered']) {
      expect(paymentStatusFor({ status }, null)).toBe('paid');
    }
    expect(PAID_ORDER_STATUSES).toEqual(['paid', 'processing', 'shipped', 'delivered']);
  });

  it('keeps a shipped order paid even though its status is not "paid"', () => {
    // Regression: this used to fall through to pending_payment → "입금 대기".
    expect(paymentStatusFor({ status: 'shipped' }, { status: 'paid' })).toBe('paid');
    expect(paymentStatusFor({ status: 'delivered' }, { status: 'paid' })).toBe('paid');
  });

  it('surfaces the ledger while a card confirm is still resolving', () => {
    expect(paymentStatusFor({ status: 'pending_payment' }, { status: 'confirming' })).toBe('confirming');
    expect(paymentStatusFor({ status: 'pending_payment' }, { status: 'paid' })).toBe('paid');
  });

  it('distinguishes unpaid card checkout from a deposit order', () => {
    expect(paymentStatusFor({ status: 'pending_payment' }, null)).toBe('pending_payment');
  });

  it('maps terminal order states before looking at the ledger', () => {
    expect(paymentStatusFor({ status: 'canceled' }, { status: 'paid' })).toBe('canceled');
    expect(paymentStatusFor({ status: 'expired' }, null)).toBe('canceled');
    expect(paymentStatusFor({ status: 'refunded' }, { status: 'paid' })).toBe('refunded');
    expect(paymentStatusFor({ status: 'refund_pending' }, null)).toBe('refund_pending');
  });

  it('reports a failed charge instead of pretending the order is unpaid', () => {
    expect(paymentStatusFor({ status: 'pending_payment' }, { status: 'failed' })).toBe('failed');
    expect(paymentStatusFor({ status: 'shipped' }, { status: 'canceled' })).toBe('failed');
  });
});

describe('paymentMismatchFor — reconciliation queue', () => {
  it('is quiet when there is no ledger row (manual / pre-ledger orders)', () => {
    expect(paymentMismatchFor({ status: 'paid' }, null)).toBe(false);
  });

  it('flags money captured but the order still pending', () => {
    expect(paymentMismatchFor({ status: 'pending_payment' }, { status: 'paid' })).toBe(true);
  });

  it('flags a failed charge on an order that moved forward anyway', () => {
    expect(paymentMismatchFor({ status: 'processing' }, { status: 'canceled' })).toBe(true);
    expect(paymentMismatchFor({ status: 'delivered' }, { status: 'failed' })).toBe(true);
  });

  it('does not flag a healthy paid order', () => {
    expect(paymentMismatchFor({ status: 'shipped' }, { status: 'paid' })).toBe(false);
  });
});

describe('KST period boundaries', () => {
  it('starts the day at 15:00 UTC (midnight KST)', () => {
    const start = kstPeriodStart('day');
    expect(start.getUTCHours()).toBe(15);
    expect(start.getUTCMinutes()).toBe(0);
    expect(start.getUTCSeconds()).toBe(0);
    expect(start.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('starts the month on the 1st in KST', () => {
    expect(kstDateKey(kstPeriodStart('month')).endsWith('-01')).toBe(true);
  });

  it('formats timestamps in KST, not UTC', () => {
    // 15:30 UTC is 00:30 the next day in KST.
    expect(kstDateKey('2026-11-15T15:30:00Z')).toBe('2026-11-16');
    expect(kstDateKey('2026-11-15T14:30:00Z')).toBe('2026-11-15');
  });
});

describe('Admin API — payment truth contracts', () => {
  it('projects orders through a ledger-aware payment status', () => {
    const api = read('api/admin.js');
    expect(api.includes('payment_status: paymentStatusFor(o, pay)')).toBe(true);
    expect(api.includes('const derivedPay = o.status')).toBe(false);
    // Real approval time and method, not order creation time / hardcoded toss_card.
    expect(api.includes("payment_method: 'toss_card'")).toBe(false);
    expect(api.includes('paid_at: o.paid_at || (pay?.status')).toBe(true);
    expect(api.includes('loadPaymentsByOrder(ids)')).toBe(true);
  });

  it('filters "paid" across the whole paid family', () => {
    const api = read('api/admin.js');
    expect(api.includes("if (payment_status === 'paid') q = q.in('status', PAID_ORDER_STATUSES)")).toBe(true);
    expect(api.includes("payment_status === 'paid') q = q.eq('status', 'paid')")).toBe(false);
    expect(api.includes("payment_status === 'deposit_pending'")).toBe(true);
  });

  it('exposes a guarded deposit confirmation path', () => {
    const api = read('api/admin.js');
    expect(api.includes("app.patch('/api/v1/admin/orders/:id/confirm-deposit', authenticate, staff(R.money), stepUp")).toBe(true);
    expect(api.includes("if (order.status !== 'pending_payment') return error(res, 409, 'DEPOSIT_NOT_APPLICABLE')")).toBe(true);
    expect(api.includes('DEPOSIT_CONFIRM')).toBe(true);
  });

  it('records the payment method on manual orders', () => {
    const api = read('api/admin.js');
    expect(api.includes('payment_method: manualPaymentMethod')).toBe(true);
    expect(read('src/components/admin/ManualOrderModal.jsx').includes('payment_method: paymentMethod')).toBe(true);
  });

  it('dashboard uses exact aggregates and a projected recent list', () => {
    const api = read('api/admin.js');
    expect(api.includes('loadAdminTotals()')).toBe(true);
    expect(api.includes('const recentOrders = await adminOrderList(')).toBe(true);
    expect(api.includes('todaySales: totals.revenue_today')).toBe(true);
    expect(api.includes('monthSales: totals.revenue_month')).toBe(true);
    // The old "latest 500 rows" sums must be gone.
    expect(api.includes('recentOrders: list.slice(0, recentLimit).map')).toBe(false);
    expect(api.includes("select('id,order_number,status,amount,created_at,user_id,order_source')")).toBe(false);
  });

  it('ships a migration with the columns and the totals function', () => {
    const sql = read('supabase/migrations/202611150001_admin_payment_truth.sql');
    expect(sql.includes('add column if not exists payment_method')).toBe(true);
    expect(sql.includes('add column if not exists paid_at')).toBe(true);
    expect(sql.includes('add column if not exists depositor_name')).toBe(true);
    expect(sql.includes('create or replace function app.admin_totals()')).toBe(true);
    expect(sql.includes("at time zone 'Asia/Seoul'")).toBe(true);
    expect(sql.includes('grant execute on function app.admin_totals() to noeul_api, service_role')).toBe(true);
  });
});

describe('Admin UI — freshness and payment display', () => {
  it('polls every 15s and wakes on tab focus', () => {
    const hook = read('src/hooks/useAdminPolling.js');
    expect(hook.includes('intervalMs = 15000')).toBe(true);
    expect(hook.includes("document.addEventListener('visibilitychange'")).toBe(true);
    expect(hook.includes("window.addEventListener('focus'")).toBe(true);
    expect(hook.includes('document.hidden')).toBe(true);
  });

  it('wires polling into the dashboard and the orders list', () => {
    expect(read('src/pages/admin/AdminDashboardPage.jsx').includes('useAdminPolling(')).toBe(true);
    expect(read('src/pages/admin/AdminOrdersPage.jsx').includes('useAdminPolling(')).toBe(true);
  });

  it('renders payment status from the API instead of a guessed pill map', () => {
    const page = read('src/pages/admin/AdminOrdersPage.jsx');
    expect(page.includes('getAdminPaymentStatus(ord.payment_status)')).toBe(true);
    expect(page.includes('PAYMENT_STATUS_PILL')).toBe(false);
    expect(page.includes('결제 완료 (배송중 포함)')).toBe(true);
    expect(page.includes('무통장 입금 대기')).toBe(true);
  });

  it('offers a payment confirmation action only where money was collected outside the PG', () => {
    const page = read('src/pages/admin/AdminOrdersPage.jsx');
    // Guarded helper: pending_payment AND not an abandoned website card checkout
    // (marking that paid would invent revenue).
    expect(page.includes('function canConfirmPayment(order)')).toBe(true);
    expect(page.includes("!(method === 'card' && source === 'website')")).toBe(true);
    expect(page.includes('{canConfirmPayment(ord) && (')).toBe(true);
    expect(page.includes('/confirm-deposit')).toBe(true);
    expect(page.includes('입금 확인')).toBe(true);
  });

  it('surfaces a needs-attention strip on the dashboard', () => {
    const page = read('src/pages/admin/AdminDashboardPage.jsx');
    expect(page.includes('확인이 필요한 결제')).toBe(true);
    expect(page.includes('payment_status=confirming')).toBe(true);
    expect(page.includes('salesTrend.map')).toBe(true);
  });
});
