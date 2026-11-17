/**
 * NOEUL Business Management & Accounting System
 * Utilities for KST dates, revenue, expenses, and profit calculation.
 * Excel generation/parsing lives in ./businessExcel.js (lazy-loaded).
 */

export const EXPENSE_CATEGORIES = [
  { id: 'product_purchase', ko: '상품 사입/매입비', en: 'Product Purchase Cost', isOperating: true },
  { id: 'shipping_delivery', ko: '배송 및 택배비', en: 'Shipping & Delivery', isOperating: true },
  { id: 'packaging', ko: '포장 및 부자재비', en: 'Packaging Materials', isOperating: true },
  { id: 'advertising_marketing', ko: '광고 및 마케팅비', en: 'Advertising & Marketing', isOperating: true },
  { id: 'office_expenses', ko: '사무실 및 운영비', en: 'Office Expenses', isOperating: true },
  { id: 'entertainment', ko: '접대 및 식대비', en: 'Entertainment & Meals', isOperating: true },
  { id: 'taxes_vat', ko: '세금 및 부가세', en: 'Taxes & VAT', isOperating: false, isTax: true },
  { id: 'living_expenses', ko: '대표자 생활비 (개인)', en: 'Living Expenses (Personal)', isOperating: false, isPersonal: true },
  { id: 'other_expenses', ko: '기타 사업 지출', en: 'Other Expenses', isOperating: true },
];

export const PAYMENT_METHODS = [
  { id: 'card', ko: '신용/체크카드', en: 'Credit/Debit Card' },
  { id: 'bank_transfer', ko: '계좌이체/무통장', en: 'Bank Transfer' },
  { id: 'cash', ko: '현금', en: 'Cash' },
  { id: 'simple_pay', ko: '간편결제 (토스/네이버페이)', en: 'Easy Pay' },
  { id: 'other', ko: '기타', en: 'Other' },
];

export const ORDER_DATE_PERIODS = [
  { id: 'today', ko: '오늘의 주문 (Today)', en: 'Today' },
  { id: 'yesterday', ko: '어제의 주문 (Yesterday)', en: 'Yesterday' },
  { id: 'week', ko: '이번 주 (This Week)', en: 'This Week' },
  { id: 'month', ko: '이번 달 (This Month)', en: 'This Month' },
  { id: 'year', ko: '올해 (This Year)', en: 'This Year' },
  { id: 'all', ko: '전체 주문 (All Orders)', en: 'All' },
  { id: 'custom', ko: '직접 선택 (Custom Range)', en: 'Custom' },
];

/**
 * Returns YYYY-MM-DD formatted date in Korea Standard Time (Asia/Seoul).
 */
export function toKstDateString(date = new Date()) {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!d || Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d);
  } catch {
    return '';
  }
}

/**
 * Returns formatted date-time string in Korea Standard Time (Asia/Seoul).
 */
export function toKstDateTimeString(date = new Date()) {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!d || Number.isNaN(d.getTime())) return '';
    const parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
    return parts;
  } catch {
    return '';
  }
}

/**
 * Resolves category display label.
 */
export function getExpenseCategoryLabel(catId, lang = 'ko') {
  const found = EXPENSE_CATEGORIES.find((c) => c.id === catId);
  if (!found) return catId;
  return lang === 'en' ? found.en : found.ko;
}

/**
 * Returns payment method display label.
 */
export function getPaymentMethodLabel(methodId, lang = 'ko') {
  const found = PAYMENT_METHODS.find((m) => m.id === methodId);
  if (!found) return methodId;
  return lang === 'en' ? found.en : found.ko;
}

/**
 * Checks whether an order falls within a given KST period.
 */
export function isOrderInPeriod(orderCreatedAt, period = 'all', customFrom = '', customTo = '') {
  const orderDateKst = toKstDateString(orderCreatedAt);
  if (!orderDateKst) return false;

  const todayKst = toKstDateString(new Date());

  if (period === 'today') {
    return orderDateKst === todayKst;
  }

  if (period === 'yesterday') {
    const yest = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return orderDateKst === toKstDateString(yest);
  }

  if (period === 'week') {
    // Current Monday to Sunday in KST
    const now = new Date();
    const dayOfWeek = (now.getUTCDay() + 6) % 7; // Monday = 0
    const monday = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
    const mondayKst = toKstDateString(monday);
    return orderDateKst >= mondayKst && orderDateKst <= todayKst;
  }

  if (period === 'month') {
    const currentMonthPrefix = todayKst.slice(0, 7); // YYYY-MM
    return orderDateKst.startsWith(currentMonthPrefix);
  }

  if (period === 'year') {
    const currentYearPrefix = todayKst.slice(0, 4); // YYYY
    return orderDateKst.startsWith(currentYearPrefix);
  }

  if (period === 'custom') {
    if (customFrom && orderDateKst < customFrom) return false;
    if (customTo && orderDateKst > customTo) return false;
    return true;
  }

  return true; // 'all'
}

/**
 * Calculates financial metrics strictly respecting rules:
 * - Shipping fee counted ONCE per order.
 * - Revenue, Costs, Gross Profit, Operating Expenses, Net Profit separated.
 * - Personal living expenses kept separate from operating expenses.
 * @param {{ orders?: any[], expenses?: any[], products?: any[] }} [params]
 */
export function calculateBusinessMetrics({ orders = [], expenses = [], products = [] } = {}) {
  let totalOrdersCount = orders.length;
  let paidOrdersCount = 0;
  let pendingOrdersCount = 0;
  let canceledOrdersCount = 0;
  let refundedOrdersCount = 0;

  let productSalesRevenue = 0;
  let shippingRevenue = 0;
  let discountsTotal = 0;
  let refundsTotal = 0;

  for (const o of orders) {
    const st = String(o.status || o.order_status || '').toLowerCase();
    const isPaid = ['paid', 'processing', 'shipped', 'delivered'].includes(st);

    if (isPaid) {
      paidOrdersCount += 1;
      // Product line items subtotal
      const lineSubtotal = (o.items || []).reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
      productSalesRevenue += (Number(o.subtotal) || lineSubtotal);
      
      // Shipping fee counted STRICTLY ONCE per order
      shippingRevenue += (Number(o.shipping_fee ?? o.shipping ?? 0));
      discountsTotal += (Number(o.discount_amount ?? o.discount ?? 0));
      // Completed refunds (attached by the API) reduce realised revenue.
      refundsTotal += (Number(o.refunded_amount) || 0);
    } else if (st === 'pending_payment' || st === 'pending_verification') {
      pendingOrdersCount += 1;
    } else if (st === 'canceled' || st === 'cancelled') {
      canceledOrdersCount += 1;
    } else if (st === 'refunded') {
      refundedOrdersCount += 1;
    }
  }

  // Net sales revenue
  const totalRevenue = productSalesRevenue + shippingRevenue - discountsTotal - refundsTotal;

  // Expenses aggregation
  const expenseBreakdown = {};
  EXPENSE_CATEGORIES.forEach((cat) => {
    expenseBreakdown[cat.id] = 0;
  });

  let totalExpenses = 0;
  let operatingExpenses = 0;
  let livingExpenses = 0;
  let taxesAndVat = 0;
  let shippingDeliveryExpenses = 0;
  let productPurchaseCosts = 0;

  for (const exp of expenses) {
    const amt = Number(exp.amount) || 0;
    const cat = exp.category || 'other_expenses';
    totalExpenses += amt;
    if (expenseBreakdown[cat] !== undefined) {
      expenseBreakdown[cat] += amt;
    } else {
      expenseBreakdown.other_expenses = (expenseBreakdown.other_expenses || 0) + amt;
    }

    if (cat === 'living_expenses') {
      livingExpenses += amt;
    } else if (cat === 'taxes_vat') {
      taxesAndVat += amt;
    } else if (cat === 'shipping_delivery') {
      shippingDeliveryExpenses += amt;
      operatingExpenses += amt;
    } else if (cat === 'product_purchase') {
      productPurchaseCosts += amt;
      // Product purchases are COGS
    } else {
      operatingExpenses += amt;
    }
  }

  // Cost of Goods Sold: product purchases recorded, or calculated from product cost
  const cogs = productPurchaseCosts;
  const estimatedGrossProfit = totalRevenue - cogs;
  const estimatedNetProfit = estimatedGrossProfit - operatingExpenses;

  // Inventory value & low stock
  let totalInventoryUnits = 0;
  let totalInventoryRetailValue = 0;
  const lowStockItems = [];

  for (const p of products) {
    const variants = p.variants || p.product_variants || [];
    for (const v of variants) {
      const stock = Number(v.stock || 0);
      const reserved = Number(v.reserved || 0);
      const available = stock - reserved;
      totalInventoryUnits += stock;
      totalInventoryRetailValue += stock * (Number(p.discount_price || p.price) || 0);

      if (available <= 5) {
        lowStockItems.push({
          productId: p.id,
          productName: p.name_ko || p.name || p.name_en,
          sku: v.sku || p.sku,
          size: v.size || 'FREE',
          color: v.color || 'DEFAULT',
          stock,
          reserved,
          available,
        });
      }
    }
  }

  // Estimated VAT (10% on domestic consumer prices in Korea, labeled as estimate)
  const estimatedVatOnSales = Math.round(totalRevenue * (10 / 110));

  return {
    totalOrdersCount,
    paidOrdersCount,
    pendingOrdersCount,
    canceledOrdersCount,
    refundedOrdersCount,
    productSalesRevenue,
    shippingRevenue,
    discountsTotal,
    refundsTotal,
    totalRevenue,
    totalExpenses,
    operatingExpenses,
    livingExpenses,
    taxesAndVat,
    shippingDeliveryExpenses,
    productPurchaseCosts,
    cogs,
    estimatedGrossProfit,
    estimatedNetProfit,
    expenseBreakdown,
    totalInventoryUnits,
    totalInventoryRetailValue,
    lowStockCount: lowStockItems.length,
    lowStockItems,
    estimatedVatOnSales,
  };
}

