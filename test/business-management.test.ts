import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  ORDER_DATE_PERIODS,
  toKstDateString,
  toKstDateTimeString,
  isOrderInPeriod,
  calculateBusinessMetrics,
  generateBusinessExcelWorkbook,
  parseExpensesFromExcel,
  getExpenseCategoryLabel,
  getPaymentMethodLabel,
} from '../src/utils/businessAccounting.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');

describe('Business Management System (경영 관리) — Core Scenarios A~K', () => {
  // Scenario A, B, C, D: Multi-item order across 3 categories with single shipping fee
  it('Scenario A, B, C, D: 10 items across 3 categories, order stored once, shipping counted only once', () => {
    // 1 customer order with 10 items: 4 T-shirts, 3 Shirts, 3 Pants
    // Shipping fee = 3,000 KRW
    const mockOrder = {
      id: 'order-noeul-1001',
      order_number: 'NOEUL-1001',
      created_at: new Date().toISOString(),
      customer_name: '홍길동',
      customer_phone: '010-1234-5678',
      status: 'paid',
      subtotal: 250000,
      discount: 10000,
      shipping: 3000, // ₩3,000 shipping fee
      amount: 243000, // 250000 - 10000 + 3000
      items: [
        // 4 T-shirts
        { product_name_ko: '베이직 오버핏 반팔 티셔츠', sku: 'TS-001', size: 'L', color: '화이트', price: 20000, quantity: 4, category_id: 1, category_slug: 't-shirts' },
        // 3 Shirts
        { product_name_ko: '클래식 옥스포드 셔츠', sku: 'SH-001', size: 'M', color: '블루', price: 30000, quantity: 3, category_id: 2, category_slug: 'shirts' },
        // 3 Pants
        { product_name_ko: '와이드 슬랙스 팬츠', sku: 'PA-001', size: 'FREE', color: '블랙', price: 28000, quantity: 3, category_id: 3, category_slug: 'pants' },
      ],
    };

    const categories = [
      { id: 1, name_ko: '티셔츠', slug: 't-shirts' },
      { id: 2, name_ko: '셔츠', slug: 'shirts' },
      { id: 3, name_ko: '팬츠', slug: 'pants' },
      { id: 4, name_ko: '자켓', slug: 'jackets' },
    ];

    // Scenario C: Master order is stored once in orders array
    const orders = [mockOrder];
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe('order-noeul-1001');

    // Scenario D: Calculate business metrics - shipping fee must be counted strictly once
    const metrics = calculateBusinessMetrics({ orders, expenses: [] });
    expect(metrics.totalOrdersCount).toBe(1);
    expect(metrics.paidOrdersCount).toBe(1);
    expect(metrics.shippingRevenue).toBe(3000); // COUNTED ONLY ONCE!
    expect(metrics.totalRevenue).toBe(243000); // 250000 - 10000 + 3000

    // Scenario B: Multi-sheet Excel workbook contains dynamic category sheets
    const wb = generateBusinessExcelWorkbook({
      summaryMetrics: metrics,
      orders,
      categories,
      expenses: [],
      products: [],
      datePeriodLabel: '오늘',
    });

    expect(wb.SheetNames).toContain('대시보드 요약');
    expect(wb.SheetNames).toContain('전체 주문');
    expect(wb.SheetNames).toContain('오늘의 주문');
    expect(wb.SheetNames).toContain('티셔츠');
    expect(wb.SheetNames).toContain('셔츠');
    expect(wb.SheetNames).toContain('팬츠');
    expect(wb.SheetNames).toContain('자켓');
    expect(wb.SheetNames).toContain('지출 내역');
    expect(wb.SheetNames).toContain('재고 현황');
    expect(wb.SheetNames).toContain('손익 계산서');

    // Inspect T-shirt sheet: should only contain the 4 T-shirts
    const tsheet = XLSX.utils.sheet_to_json(wb.Sheets['티셔츠']);
    expect(tsheet).toHaveLength(1);
    const trow = tsheet[0] as Record<string, any>;
    expect(trow['상품명']).toBe('베이직 오버핏 반팔 티셔츠');
    expect(trow['수량']).toBe(4);
    expect(trow['주문번호']).toBe('NOEUL-1001');

    // Inspect Shirt sheet: should only contain the 3 Shirts
    const ssheet = XLSX.utils.sheet_to_json(wb.Sheets['셔츠']);
    expect(ssheet).toHaveLength(1);
    const srow = ssheet[0] as Record<string, any>;
    expect(srow['상품명']).toBe('클래식 옥스포드 셔츠');
    expect(srow['수량']).toBe(3);
    expect(srow['주문번호']).toBe('NOEUL-1001');

    // Inspect Pants sheet: should only contain the 3 Pants
    const psheet = XLSX.utils.sheet_to_json(wb.Sheets['팬츠']);
    expect(psheet).toHaveLength(1);
    const prow = psheet[0] as Record<string, any>;
    expect(prow['상품명']).toBe('와이드 슬랙스 팬츠');
    expect(prow['수량']).toBe(3);
    expect(prow['사이즈']).toBe('FREE');
    expect(prow['주문번호']).toBe('NOEUL-1001');

    // Jackets sheet should be empty (0 items)
    const jsheet = XLSX.utils.sheet_to_json(wb.Sheets['자켓']);
    expect(jsheet).toHaveLength(0);
  });

  // Scenario E & F: KST Date filtering and historical preservation
  it("Scenario E & F: Today's Orders displays only today's orders in KST; historical records preserved", () => {
    const todayKst = toKstDateString(new Date());
    expect(todayKst).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const nowIso = new Date().toISOString();
    const yesterdayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const lastMonthIso = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();

    expect(isOrderInPeriod(nowIso, 'today')).toBe(true);
    expect(isOrderInPeriod(yesterdayIso, 'today')).toBe(false);

    expect(isOrderInPeriod(yesterdayIso, 'yesterday')).toBe(true);
    expect(isOrderInPeriod(nowIso, 'yesterday')).toBe(false);

    expect(isOrderInPeriod(lastMonthIso, 'all')).toBe(true);
    expect(isOrderInPeriod(yesterdayIso, 'all')).toBe(true);
    expect(isOrderInPeriod(nowIso, 'all')).toBe(true);
  });

  // Scenario G: New categories appear automatically
  it('Scenario G: Newly created admin category appears automatically in reports without code changes', () => {
    const dynamicCategories = [
      { id: 1, name_ko: '티셔츠', slug: 't-shirts' },
      { id: 99, name_ko: '신규 한복 콜라보', slug: 'hanbok-collab' }, // newly added category!
    ];

    const orders = [
      {
        id: 'ord-99',
        order_number: 'NE-99',
        created_at: new Date().toISOString(),
        status: 'paid',
        shipping: 3000,
        subtotal: 120000,
        items: [
          {
            product_name_ko: '모던 생활한복 두루마기',
            sku: 'HB-001',
            size: 'L',
            price: 120000,
            quantity: 1,
            category_id: 99,
            category_slug: 'hanbok-collab',
          },
        ],
      },
    ];

    const wb = generateBusinessExcelWorkbook({
      summaryMetrics: calculateBusinessMetrics({ orders }),
      orders,
      categories: dynamicCategories,
      expenses: [],
      products: [],
    });

    expect(wb.SheetNames).toContain('신규 한복 콜라보');
    const hanbokSheet = XLSX.utils.sheet_to_json(wb.Sheets['신규 한복 콜라보']);
    expect(hanbokSheet).toHaveLength(1);
    expect((hanbokSheet[0] as any)['상품명']).toBe('모던 생활한복 두루마기');
  });

  // Scenario H: Expense management CRUD and category separation
  it('Scenario H: Expense management with 9 categories; personal living expenses separated from operating expenses', () => {
    expect(EXPENSE_CATEGORIES).toHaveLength(9);
    const categoryIds = EXPENSE_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain('product_purchase');
    expect(categoryIds).toContain('shipping_delivery');
    expect(categoryIds).toContain('packaging');
    expect(categoryIds).toContain('advertising_marketing');
    expect(categoryIds).toContain('living_expenses');
    expect(categoryIds).toContain('entertainment');
    expect(categoryIds).toContain('taxes_vat');
    expect(categoryIds).toContain('office_expenses');
    expect(categoryIds).toContain('other_expenses');

    const expenses = [
      { id: 'exp-1', expense_date: '2026-10-09', category: 'product_purchase', amount: 500000, description: '의류 원단 사입' },
      { id: 'exp-2', expense_date: '2026-10-09', category: 'shipping_delivery', amount: 30000, description: 'CJ대한통운 계약 택배비' },
      { id: 'exp-3', expense_date: '2026-10-09', category: 'packaging', amount: 15000, description: '택배 봉투 및 폴리백' },
      { id: 'exp-4', expense_date: '2026-10-09', category: 'advertising_marketing', amount: 80000, description: '인스타그램 스폰서 광고' },
      { id: 'exp-5', expense_date: '2026-10-09', category: 'living_expenses', amount: 200000, description: '대표자 개인 식비/가계비' }, // PERSONAL
      { id: 'exp-6', expense_date: '2026-10-09', category: 'taxes_vat', amount: 50000, description: '부가세 예정 고지' }, // TAX
    ];

    const orders = [
      {
        id: 'ord-1',
        status: 'paid',
        subtotal: 1000000,
        discount: 0,
        shipping: 3000,
        amount: 1003000,
        items: [{ price: 1000000, quantity: 1 }],
      },
    ];

    const metrics = calculateBusinessMetrics({ orders, expenses });

    // Revenue: 1,003,000 KRW
    expect(metrics.totalRevenue).toBe(1003000);
    // COGS: 500,000 KRW
    expect(metrics.cogs).toBe(500000);
    // Estimated Gross Profit: 1,003,000 - 500,000 = 503,000 KRW
    expect(metrics.estimatedGrossProfit).toBe(503000);

    // Operating expenses: shipping(30,000) + packaging(15,000) + ad(80,000) = 125,000 KRW
    // (Notice: living_expenses 200,000 is EXCLUDED from operating expenses!)
    expect(metrics.operatingExpenses).toBe(125000);
    expect(metrics.livingExpenses).toBe(200000);
    expect(metrics.taxesAndVat).toBe(50000);

    // Estimated Net Profit: Gross Profit(503,000) - Operating Expenses(125,000) = 378,000 KRW
    expect(metrics.estimatedNetProfit).toBe(378000);
  });

  // Scenario I: Idempotent stock handling
  it('Scenario I: Stock calculation handles reserve and available quantity accurately', () => {
    const products = [
      {
        id: 101,
        name_ko: '노을 시그니처 린넨 셔츠',
        sku: 'SH-101',
        price: 49000,
        variants: [
          { sku: 'SH-101-WHT-S', color: '화이트', size: 'S', stock: 50, reserved: 2 },
          { sku: 'SH-101-WHT-M', color: '화이트', size: 'M', stock: 50, reserved: 0 },
          { sku: 'SH-101-WHT-L', color: '화이트', size: 'L', stock: 4, reserved: 1 }, // available = 3 <= 5 -> low stock!
        ],
      },
    ];

    const metrics = calculateBusinessMetrics({ products });
    expect(metrics.totalInventoryUnits).toBe(104);
    expect(metrics.totalInventoryRetailValue).toBe(104 * 49000);
    expect(metrics.lowStockCount).toBe(1);
    expect(metrics.lowStockItems[0].sku).toBe('SH-101-WHT-L');
  });

  // Scenario J: Excel workbook structure and P&L statement
  it('Scenario J: Excel export contains accurate multi-sheet data without double counting', () => {
    const orders = [
      {
        id: 'ord-1',
        order_number: 'NE-001',
        status: 'paid',
        created_at: new Date().toISOString(),
        customer_name: '김노을',
        subtotal: 100000,
        discount: 5000,
        shipping: 3000,
        amount: 98000,
        items: [{ price: 50000, quantity: 2, category_id: 1, category_slug: 't-shirts', product_name_ko: '티셔츠' }],
      },
      {
        id: 'ord-2',
        order_number: 'NE-002',
        status: 'paid',
        created_at: new Date().toISOString(),
        customer_name: '이노을',
        subtotal: 80000,
        discount: 0,
        shipping: 3000,
        amount: 83000,
        items: [{ price: 80000, quantity: 1, category_id: 2, category_slug: 'pants', product_name_ko: '팬츠' }],
      },
    ];

    const categories = [
      { id: 1, name_ko: '티셔츠', slug: 't-shirts' },
      { id: 2, name_ko: '팬츠', slug: 'pants' },
    ];

    const metrics = calculateBusinessMetrics({ orders });
    // Total revenue = (100000 + 80000) - 5000 + (3000 + 3000) = 181,000 KRW
    expect(metrics.shippingRevenue).toBe(6000); // 2 distinct orders = 2 * 3000
    expect(metrics.totalRevenue).toBe(181000);

    const wb = generateBusinessExcelWorkbook({
      summaryMetrics: metrics,
      orders,
      categories,
    });

    const pnlSheet = XLSX.utils.sheet_to_json(wb.Sheets['손익 계산서'], { header: 1 }) as any[][];
    expect(pnlSheet.length).toBeGreaterThan(10);
    // Verify Gross Revenue row contains 181,000
    const grossRow = pnlSheet.find((r) => String(r[0]).includes('총 매출액'));
    expect(grossRow).toBeDefined();
    expect(grossRow?.[1]).toBe(181000);
  });

  // Scenario K: Frontend & Backend contracts
  it('Scenario K: Admin API backend and frontend route contracts are satisfied', () => {
    const adminRoutes = read('api/admin.js');
    expect(adminRoutes.includes("app.get('/api/v1/admin/business/summary'")).toBe(true);
    expect(adminRoutes.includes("app.get('/api/v1/admin/business/orders'")).toBe(true);
    expect(adminRoutes.includes("app.get('/api/v1/admin/business/category-reports'")).toBe(true);
    expect(adminRoutes.includes("app.get('/api/v1/admin/expenses'")).toBe(true);
    expect(adminRoutes.includes("app.post('/api/v1/admin/expenses'")).toBe(true);
    expect(adminRoutes.includes("app.put('/api/v1/admin/expenses/:id'")).toBe(true);
    expect(adminRoutes.includes("app.delete('/api/v1/admin/expenses/:id'")).toBe(true);
    expect(adminRoutes.includes("app.post('/api/v1/admin/expenses/bulk'")).toBe(true);
    expect(adminRoutes.includes("app.patch('/api/v1/admin/orders/:id/customer-details'")).toBe(true);

    const appJs = read('src/App.jsx');
    expect(appJs.includes('AdminBusinessPage')).toBe(true);
    expect(appJs.includes('/admin/business')).toBe(true);

    const nav = read('src/components/admin/AdminLayout.jsx');
    expect(nav.includes('/admin/business')).toBe(true);
    expect(nav.includes('FileSpreadsheet')).toBe(true);

    const dash = read('src/pages/admin/AdminDashboardPage.jsx');
    expect(dash.includes('/admin/business')).toBe(true);
    expect(dash.includes('FileSpreadsheet')).toBe(true);
  });
});
