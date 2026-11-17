/**
 * Excel (.xlsx) import/export for the admin business dashboard.
 *
 * Kept in its own module and loaded with `await import(...)` from the page so
 * the several-hundred-kB SheetJS bundle is only fetched when an admin actually
 * exports or imports a spreadsheet.
 */
import * as XLSX from 'xlsx';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  getExpenseCategoryLabel,
  getPaymentMethodLabel,
  toKstDateString,
  toKstDateTimeString,
} from './businessAccounting.js';

/** Write a generated workbook to the browser as a downloaded file. */
export function writeBusinessExcelWorkbook(wb, fileName) {
  XLSX.writeFile(wb, fileName);
}

/**
 * Builds multi-sheet Excel (.xlsx) workbook.
 * @param {{ summaryMetrics?: any, orders?: any[], categories?: any[], expenses?: any[], products?: any[], datePeriodLabel?: string }} [params]
 */
export function generateBusinessExcelWorkbook({
  summaryMetrics,
  orders = [],
  categories = [],
  expenses = [],
  products = [],
  datePeriodLabel = '전체 기간',
} = {}) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Dashboard Summary
  const summaryRows = [
    ['NOEUL 경영 관리 및 손익 요약 보고서 (Business Summary Report)'],
    ['기준 기간 (Period)', datePeriodLabel],
    ['보고서 생성 일시 (Generated At)', toKstDateTimeString(new Date())],
    [],
    ['[1. 매출 및 주문 현황 (Revenue & Orders)]', '금액 / 수치 (KRW / Count)'],
    ['총 주문 건수 (Total Orders)', summaryMetrics.totalOrdersCount],
    ['결제 완료 건수 (Paid Orders)', summaryMetrics.paidOrdersCount],
    ['입금 대기 건수 (Pending Orders)', summaryMetrics.pendingOrdersCount],
    ['취소/환불 건수 (Canceled/Refunded)', summaryMetrics.canceledOrdersCount + summaryMetrics.refundedOrdersCount],
    ['순 상품 매출액 (Product Sales)', summaryMetrics.productSalesRevenue],
    ['배송비 매출액 (Shipping Revenue - 주문당 1회 집계)', summaryMetrics.shippingRevenue],
    ['쿠폰 및 프로모션 할인액 (Discounts)', summaryMetrics.discountsTotal],
    ['총 매출 합계 (Total Revenue)', summaryMetrics.totalRevenue],
    [],
    ['[2. 원가 및 비용 현황 (Costs & Expenses)]', '금액 (KRW)'],
    ['상품 사입/매출원가 (COGS - Product Purchase)', summaryMetrics.cogs],
    ['실제 배송 지출비 (Delivery Expenses)', summaryMetrics.shippingDeliveryExpenses],
    ['사업 운영비 합계 (Operating Expenses - 포장/마케팅/운영 등)', summaryMetrics.operatingExpenses],
    ['대표자 개인 생활비 (Personal Living - 사업비 제외 별도 관리)', summaryMetrics.livingExpenses],
    ['세금 및 부가세 납부액 (Taxes & VAT)', summaryMetrics.taxesAndVat],
    ['총 지출 합계 (Total Expenses)', summaryMetrics.totalExpenses],
    [],
    ['[3. 손익 계산 (Profitability Analysis)]', '금액 (KRW)'],
    ['추정 매출총이익 (Estimated Gross Profit = 매출 - 사입원가)', summaryMetrics.estimatedGrossProfit],
    ['추정 영업순이익 (Estimated Net Profit = 매출총이익 - 운영비)', summaryMetrics.estimatedNetProfit],
    ['추정 부가세 과세표준 참고치 (Estimated VAT Portion)', summaryMetrics.estimatedVatOnSales],
    [],
    ['[4. 재고 자산 현황 (Inventory Status)]', '수치 / 금액'],
    ['총 보유 재고 수량 (Total Inventory Units)', summaryMetrics.totalInventoryUnits],
    ['재고 소매 자산 가치 (Retail Asset Value)', summaryMetrics.totalInventoryRetailValue],
    ['품절 임박 품목수 (Low Stock Items <= 5)', summaryMetrics.lowStockCount],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, '대시보드 요약');

  // Sheet 2: All Orders (Master)
  const orderHeaders = [
    '주문번호',
    '주문일시(KST)',
    '고객명',
    '연락처',
    '이메일',
    '배송주소',
    '주문상태',
    '결제상태',
    '상품합계',
    '할인금액',
    '배송비(주문당1회)',
    '총결제금액',
    '주문상품품목수',
  ];
  const orderRows = orders.map((o) => [
    o.order_number || o.id,
    toKstDateTimeString(o.created_at),
    o.customer_name || o.address?.recipient || '',
    o.customer_phone || o.address?.phone || '',
    o.customer_email || o.address?.email || '',
    `${o.address?.address || o.address || ''} ${o.address?.detail_address || o.detail_address || ''}`.trim(),
    o.order_status || o.status || '',
    o.payment_status || o.status || '',
    Number(o.subtotal) || 0,
    Number(o.discount_amount ?? o.discount ?? 0),
    Number(o.shipping_fee ?? o.shipping ?? 0),
    Number(o.total_amount ?? o.amount ?? 0),
    (o.items || []).length,
  ]);
  const wsOrders = XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows]);
  XLSX.utils.book_append_sheet(wb, wsOrders, '전체 주문');

  // Sheet 3: Today's Orders
  const todayKst = toKstDateString(new Date());
  const todayOrders = orders.filter((o) => toKstDateString(o.created_at) === todayKst);
  const todayOrderRows = todayOrders.map((o) => [
    o.order_number || o.id,
    toKstDateTimeString(o.created_at),
    o.customer_name || o.address?.recipient || '',
    o.customer_phone || o.address?.phone || '',
    o.customer_email || o.address?.email || '',
    `${o.address?.address || o.address || ''} ${o.address?.detail_address || o.detail_address || ''}`.trim(),
    o.order_status || o.status || '',
    o.payment_status || o.status || '',
    Number(o.subtotal) || 0,
    Number(o.discount_amount ?? o.discount ?? 0),
    Number(o.shipping_fee ?? o.shipping ?? 0),
    Number(o.total_amount ?? o.amount ?? 0),
    (o.items || []).length,
  ]);
  const wsTodayOrders = XLSX.utils.aoa_to_sheet([orderHeaders, ...todayOrderRows]);
  XLSX.utils.book_append_sheet(wb, wsTodayOrders, '오늘의 주문');

  // Dynamic Category Sheets (Sheet 4..N)
  // Group all order line items by product category
  const categoryHeaders = [
    '주문번호',
    '주문일시(KST)',
    '고객명',
    '고객연락처',
    '상품명',
    'SKU',
    '사이즈',
    '색상',
    '수량',
    '개별단가',
    '상품소계',
    '주문총배송비(참고용-합산제외)',
    '결제상태',
    '주문상태',
  ];

  for (const cat of categories) {
    const catRows = [];
    const catName = cat.name_ko || cat.name || cat.slug;
    const catId = cat.id;
    const catSlug = (cat.slug || '').toLowerCase();

    for (const o of orders) {
      for (const it of o.items || []) {
        // Match by category_id or slug
        const itCatId = it.category_id || it.product?.category_id;
        const itCatSlug = (it.category_slug || it.category || '').toLowerCase();

        const match = (itCatId && String(itCatId) === String(catId)) || (itCatSlug && itCatSlug === catSlug);
        if (match) {
          catRows.push([
            o.order_number || o.id,
            toKstDateTimeString(o.created_at),
            o.customer_name || o.address?.recipient || '',
            o.customer_phone || o.address?.phone || '',
            it.product_name_ko || it.product_name || it.name || '',
            it.product_sku || it.sku || '',
            it.size || 'FREE',
            it.color || 'DEFAULT',
            Number(it.quantity) || 1,
            Number(it.price) || 0,
            (Number(it.price) || 0) * (Number(it.quantity) || 1),
            Number(o.shipping_fee ?? o.shipping ?? 0),
            o.payment_status || o.status || '',
            o.order_status || o.status || '',
          ]);
        }
      }
    }

    // Clean sheet name (Excel limits sheet names to 31 chars and bans certain characters)
    const cleanSheetName = String(catName).replace(/[/\\?*[\]:]/g, '_').slice(0, 28);
    const wsCat = XLSX.utils.aoa_to_sheet([categoryHeaders, ...catRows]);
    XLSX.utils.book_append_sheet(wb, wsCat, cleanSheetName);
  }

  // Sheet N+1: Expenses
  const expenseHeaders = [
    '지출 ID',
    '지출일자',
    '지출 분류',
    '내역 설명',
    '금액(KRW)',
    '결제수단',
    '관련 주문번호',
    '비고/메모',
  ];
  const expRows = expenses.map((e) => [
    e.id,
    toKstDateString(e.expense_date),
    getExpenseCategoryLabel(e.category, 'ko'),
    e.description || '',
    Number(e.amount) || 0,
    getPaymentMethodLabel(e.payment_method, 'ko'),
    e.order_id || '',
    e.notes || '',
  ]);
  const wsExp = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expRows]);
  XLSX.utils.book_append_sheet(wb, wsExp, '지출 내역');

  // Sheet N+2: Inventory
  const inventoryHeaders = [
    '상품 ID',
    '상품명',
    'SKU',
    '카테고리',
    '색상',
    '사이즈',
    '현재 재고',
    '예약(주문진행)',
    '실가용 재고',
    '판매단가',
    '재고 자산 가치',
    '재고 상태',
  ];
  const invRows = [];
  for (const p of products) {
    const variants = p.variants || p.product_variants || [];
    const catName = p.category_name_ko || p.category_name || '';
    const price = Number(p.discount_price || p.price) || 0;
    for (const v of variants) {
      const stock = Number(v.stock || 0);
      const reserved = Number(v.reserved || 0);
      const available = stock - reserved;
      invRows.push([
        p.id,
        p.name_ko || p.name || p.name_en || '',
        v.sku || p.sku || '',
        catName,
        v.color || 'DEFAULT',
        v.size || 'FREE',
        stock,
        reserved,
        available,
        price,
        stock * price,
        available <= 0 ? '품절' : available <= 5 ? '품절임박' : '정상',
      ]);
    }
  }
  const wsInv = XLSX.utils.aoa_to_sheet([inventoryHeaders, ...invRows]);
  XLSX.utils.book_append_sheet(wb, wsInv, '재고 현황');

  // Sheet N+3: Profit & Loss Statement (손익계산서)
  const pnlRows = [
    ['손익 계산서 (Profit and Loss Statement)'],
    ['회사명', '노을 (NOEUL ENTERPRISES)'],
    ['기간', datePeriodLabel],
    [],
    ['항목 (Item)', '금액 (KRW)', '구성비 (%)'],
    ['I. 총 매출액 (Gross Revenue)', summaryMetrics.totalRevenue, '100.0%'],
    ['   1. 상품 판매 매출', summaryMetrics.productSalesRevenue, summaryMetrics.totalRevenue ? ((summaryMetrics.productSalesRevenue / summaryMetrics.totalRevenue) * 100).toFixed(1) + '%' : '-'],
    ['   2. 배송비 수입 (주문당 1회 집계)', summaryMetrics.shippingRevenue, summaryMetrics.totalRevenue ? ((summaryMetrics.shippingRevenue / summaryMetrics.totalRevenue) * 100).toFixed(1) + '%' : '-'],
    ['   3. 할인 및 에누리', -summaryMetrics.discountsTotal, summaryMetrics.totalRevenue ? ((-summaryMetrics.discountsTotal / summaryMetrics.totalRevenue) * 100).toFixed(1) + '%' : '-'],
    ['II. 매출원가 (COGS - 상품 사입비)', summaryMetrics.cogs, summaryMetrics.totalRevenue ? ((summaryMetrics.cogs / summaryMetrics.totalRevenue) * 100).toFixed(1) + '%' : '-'],
    ['III. 매출총이익 (Gross Profit)', summaryMetrics.estimatedGrossProfit, summaryMetrics.totalRevenue ? ((summaryMetrics.estimatedGrossProfit / summaryMetrics.totalRevenue) * 100).toFixed(1) + '%' : '-'],
    ['IV. 판매비와 관리비 (Operating Expenses)', summaryMetrics.operatingExpenses, summaryMetrics.totalRevenue ? ((summaryMetrics.operatingExpenses / summaryMetrics.totalRevenue) * 100).toFixed(1) + '%' : '-'],
    ['   1. 택배 및 배송 지출비', summaryMetrics.shippingDeliveryExpenses, ''],
    ['   2. 포장 및 부자재비', summaryMetrics.expenseBreakdown.packaging || 0, ''],
    ['   3. 광고 및 마케팅비', summaryMetrics.expenseBreakdown.advertising_marketing || 0, ''],
    ['   4. 사무실 및 일반 운영비', summaryMetrics.expenseBreakdown.office_expenses || 0, ''],
    ['   5. 접대 및 식대비', summaryMetrics.expenseBreakdown.entertainment || 0, ''],
    ['   6. 기타 사업 경비', summaryMetrics.expenseBreakdown.other_expenses || 0, ''],
    ['V. 추정 영업이익 / 순이익 (Estimated Net Profit)', summaryMetrics.estimatedNetProfit, summaryMetrics.totalRevenue ? ((summaryMetrics.estimatedNetProfit / summaryMetrics.totalRevenue) * 100).toFixed(1) + '%' : '-'],
    [],
    ['[비영업/개인 분류 항목 (별도 집계)]', '', ''],
    ['* 대표자 개인 생활비 (사업 비용 제외)', summaryMetrics.livingExpenses, ''],
    ['* 세금 및 부가세 납부액 (별도 세무 계정)', summaryMetrics.taxesAndVat, ''],
  ];
  const wsPnl = XLSX.utils.aoa_to_sheet(pnlRows);
  XLSX.utils.book_append_sheet(wb, wsPnl, '손익 계산서');

  return wb;
}

/**
 * Parses uploaded Excel file (.xlsx) into structured expense items for review and import.
 */
export function parseExpensesFromExcel(fileData) {
  const wb = XLSX.read(fileData, { type: fileData instanceof ArrayBuffer ? 'array' : 'binary' });
  // Find '지출 내역' sheet or use first sheet
  const sheetName = wb.SheetNames.find((s) => s.includes('지출') || s.toLowerCase().includes('expense')) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error('NO_VALID_EXPENSE_SHEET');

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (rows.length < 2) return [];

  // Look for header row
  let headerIndex = -1;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const r = rows[i] || [];
    if (r.some((cell) => String(cell).includes('분류') || String(cell).includes('금액') || String(cell).includes('설명') || String(cell).includes('일자'))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 0;

  const headers = (rows[headerIndex] || []).map((h) => String(h || '').trim());
  const dateCol = headers.findIndex((h) => h.includes('일자') || h.toLowerCase().includes('date'));
  const catCol = headers.findIndex((h) => h.includes('분류') || h.toLowerCase().includes('category'));
  const descCol = headers.findIndex((h) => h.includes('설명') || h.includes('내역') || h.toLowerCase().includes('desc'));
  const amtCol = headers.findIndex((h) => h.includes('금액') || h.toLowerCase().includes('amount'));
  const payCol = headers.findIndex((h) => h.includes('결제') || h.toLowerCase().includes('payment'));
  const orderCol = headers.findIndex((h) => h.includes('주문') || h.toLowerCase().includes('order'));
  const notesCol = headers.findIndex((h) => h.includes('비고') || h.includes('메모') || h.toLowerCase().includes('note'));

  const parsedItems = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    if (!row.length || row.every((c) => c === undefined || c === null || String(c).trim() === '')) continue;

    const rawDate = row[dateCol >= 0 ? dateCol : 1];
    let expDate = '';
    if (typeof rawDate === 'number') {
      // Excel serial date
      const d = XLSX.SSF.parse_date_code(rawDate);
      if (d) expDate = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    } else if (rawDate) {
      expDate = toKstDateString(rawDate) || String(rawDate).trim().slice(0, 10);
    }
    if (!expDate) expDate = toKstDateString(new Date());

    const rawCat = String(row[catCol >= 0 ? catCol : 2] || '').trim();
    // Match category
    let category = 'other_expenses';
    const foundCat = EXPENSE_CATEGORIES.find((c) => (
      c.id === rawCat || c.ko === rawCat || rawCat.includes(c.ko) || c.en.toLowerCase() === rawCat.toLowerCase()
    ));
    if (foundCat) category = foundCat.id;

    const description = String(row[descCol >= 0 ? descCol : 3] || '지출 내역').trim() || '지출 내역';
    const rawAmt = row[amtCol >= 0 ? amtCol : 4];
    const amount = Math.max(0, Math.round(Number(String(rawAmt).replace(/[^0-9.-]/g, '')) || 0));

    const rawPay = String(row[payCol >= 0 ? payCol : 5] || '').trim();
    let payment_method = 'card';
    const foundPay = PAYMENT_METHODS.find((m) => m.id === rawPay || m.ko === rawPay || rawPay.includes(m.ko));
    if (foundPay) payment_method = foundPay.id;

    const order_id = orderCol >= 0 && row[orderCol] ? String(row[orderCol]).trim() : null;
    const notes = notesCol >= 0 && row[notesCol] ? String(row[notesCol]).trim() : null;

    if (amount > 0) {
      parsedItems.push({
        expense_date: expDate,
        category,
        description,
        amount,
        payment_method,
        order_id,
        notes,
      });
    }
  }

  return parsedItems;
}
