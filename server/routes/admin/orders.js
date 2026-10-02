import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin, verifyRole } from '../../middleware/auth.js';
import { notificationService } from '../../services/notificationService.js';
import { normalizeOrderSource, isValidOrderSource, ORDER_SOURCES } from '../../lib/orderSources.js';

const router = express.Router();
router.use(verifyAdmin);

function hasOrderSourceColumn() {
  try {
    const cols = query.all("PRAGMA table_info(orders)");
    return cols.some(c => c.name === 'order_source');
  } catch {
    return false;
  }
}

function generateManualOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `NE${year}${month}${day}-${randomSuffix}`;
}

// 0. Manual / external order creation (Instagram, WhatsApp, phone, other).
// Bank-transfer flow only: starts pending_payment/pending_verification with
// stock decremented, payment confirmed via verify-payment.
router.post('/orders/manual', verifyRole(['super_admin', 'admin', 'order_manager']), (req, res) => {
  try {
    const {
      order_source,
      source_detail,
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      postal_code,
      address,
      detail_address,
      shipping_memo,
      items,
      coupon_code,
      payment_sender_name,
    } = req.body || {};

    if (order_source !== undefined && !isValidOrderSource(order_source)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 주문 채널입니다.' });
    }
    const source = normalizeOrderSource(order_source);
    const name = String(customer_name || '').trim();
    const phone = String(customer_phone || '').trim();
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: '주문자 이름과 연락처를 입력해주세요.' });
    }
    if (!postal_code || !address) {
      return res.status(400).json({ success: false, message: '배송지 우편번호와 주소를 입력해주세요.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: '주문할 상품을 선택해주세요.' });
    }

    let linkedUserId = null;
    if (customer_id) {
      const linked = query.get("SELECT id FROM users WHERE id = ? AND role = 'customer'", Number(customer_id));
      if (!linked) return res.status(404).json({ success: false, message: '고객을 찾을 수 없습니다.' });
      linkedUserId = linked.id;
    }

    let computedSubtotal = 0;
    const validatedItems = [];
    const demandByProduct = new Map();
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        return res.status(400).json({ success: false, message: '수량은 1개 이상 99개 이하의 정수여야 합니다.' });
      }
      if (!item.product_id) return res.status(400).json({ success: false, message: '상품 정보가 올바르지 않습니다.' });
      demandByProduct.set(item.product_id, (demandByProduct.get(item.product_id) || 0) + item.quantity);
    }
    for (const item of items) {
      const product = query.get('SELECT * FROM products WHERE id = ?', item.product_id);
      if (!product) return res.status(400).json({ success: false, message: `상품(ID: ${item.product_id})을 찾을 수 없습니다.` });
      if (product.stock < (demandByProduct.get(item.product_id) || item.quantity)) {
        return res.status(400).json({ success: false, message: `[${product.name_ko}] 상품의 재고가 부족합니다. (현재 재고: ${product.stock}개)` });
      }
      const unitPrice = product.discount_price || product.price;
      computedSubtotal += unitPrice * item.quantity;
      let images = [];
      try { images = JSON.parse(product.images || '[]'); } catch { images = []; }
      validatedItems.push({
        product_id: product.id,
        product_name_ko: product.name_ko,
        product_name_en: product.name_en,
        product_sku: product.sku,
        image_url: images[0] || '',
        price: unitPrice,
        quantity: item.quantity,
        size: item.size || 'FREE',
        color: item.color || 'DEFAULT',
      });
    }

    let discountAmount = 0;
    let appliedCode = null;
    if (coupon_code && String(coupon_code).trim()) {
      const cleanCode = String(coupon_code).toUpperCase().trim();
      const coupon = query.get('SELECT * FROM coupons WHERE code = ? AND is_active = 1', cleanCode);
      if (!coupon) return res.status(400).json({ success: false, message: '유효하지 않은 쿠폰 코드입니다.' });
      const todayStr = new Date().toISOString().split('T')[0];
      if (coupon.start_date && coupon.start_date > todayStr) return res.status(400).json({ success: false, message: '아직 사용할 수 없는 쿠폰입니다.' });
      if (coupon.end_date && coupon.end_date < todayStr) return res.status(400).json({ success: false, message: '만료된 쿠폰입니다.' });
      if (coupon.discount_type === 'percentage') {
        discountAmount = Math.round((computedSubtotal * coupon.discount_value) / 100);
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) discountAmount = coupon.max_discount_amount;
      } else {
        discountAmount = coupon.discount_value;
      }
      discountAmount = Math.min(computedSubtotal, discountAmount);
      appliedCode = coupon.code;
      query.run('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?', coupon.id);
    }

    const discountedSubtotal = Math.max(0, computedSubtotal - discountAmount);
    const shippingFee = computedSubtotal >= 70000 ? 0 : 3000;
    const totalAmount = Math.max(0, discountedSubtotal + shippingFee);
    if (totalAmount < 1) return res.status(400).json({ success: false, message: '주문 금액이 유효하지 않습니다.' });
    const orderNumber = generateManualOrderNumber();
    const senderName = payment_sender_name ? String(payment_sender_name).trim() : name;
    const useSource = hasOrderSourceColumn();

    const orderRes = useSource
      ? query.run(`
        INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          postal_code, address, detail_address, shipping_memo,
          subtotal, discount_amount, coupon_code, shipping_fee, total_amount,
          payment_method, payment_status, order_status, payment_sender_name,
          order_source, source_detail, created_by_admin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        orderNumber, linkedUserId, name, customer_email ? String(customer_email).trim() : '',
        phone, String(postal_code).trim(), String(address).trim(),
        detail_address ? String(detail_address).trim() : '',
        shipping_memo ? String(shipping_memo).trim() : '',
        computedSubtotal, discountAmount, appliedCode, shippingFee, totalAmount,
        'bank_transfer', 'pending_payment', 'pending_verification', senderName,
        source, source_detail ? String(source_detail).slice(0, 200) : null,
        req.user?.name || 'admin')
      : query.run(`
        INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          postal_code, address, detail_address, shipping_memo,
          subtotal, discount_amount, coupon_code, shipping_fee, total_amount,
          payment_method, payment_status, order_status, payment_sender_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        orderNumber, linkedUserId, name, customer_email ? String(customer_email).trim() : '',
        phone, String(postal_code).trim(), String(address).trim(),
        detail_address ? String(detail_address).trim() : '',
        shipping_memo ? String(shipping_memo).trim() : '',
        computedSubtotal, discountAmount, appliedCode, shippingFee, totalAmount,
        'bank_transfer', 'pending_payment', 'pending_verification', senderName);

    const orderId = Number(orderRes.lastInsertRowid);
    for (const vItem of validatedItems) {
      query.run(`
        INSERT INTO order_items (
          order_id, product_id, product_name_ko, product_name_en, product_sku,
          image_url, price, quantity, size, color
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        orderId, vItem.product_id, vItem.product_name_ko, vItem.product_name_en,
        vItem.product_sku, vItem.image_url, vItem.price, vItem.quantity, vItem.size, vItem.color);
      query.run('UPDATE products SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ?',
        vItem.quantity, vItem.quantity, vItem.product_id);
    }

    const created = query.get('SELECT * FROM orders WHERE id = ?', orderId);
    const createdItems = query.all('SELECT * FROM order_items WHERE order_id = ?', orderId);
    res.status(201).json({ success: true, message: '외부 주문이 등록되었습니다. 입금 확인 후 배송을 진행해주세요.', data: { ...created, items: createdItems } });
  } catch (err) {
    console.error('Manual order create error:', err);
    res.status(500).json({ success: false, message: '외부 주문 등록 중 오류가 발생했습니다.' });
  }
});

// Sales report by source: totals, unpaid, receipts pending, refunds + CSV.
router.get('/reports/sales', (req, res) => {
  try {
    const { from, to, source, format } = req.query;
    const useSource = hasOrderSourceColumn();
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    if (from) { sql += ' AND date(created_at) >= date(?)'; params.push(String(from)); }
    if (to) { sql += ' AND date(created_at) <= date(?)'; params.push(String(to)); }
    if (source && source !== 'all') {
      if (!ORDER_SOURCES.includes(String(source).toLowerCase())) {
        return res.status(400).json({ success: false, message: '유효하지 않은 주문 채널입니다.' });
      }
      if (useSource) { sql += ' AND order_source = ?'; params.push(String(source).toLowerCase()); }
    }
    sql += ' ORDER BY created_at DESC LIMIT 1000';
    let orders = query.all(sql, ...params);
    if (source && source !== 'all' && !useSource) {
      orders = orders.filter(o => normalizeOrderSource(o.order_source) === String(source).toLowerCase());
    }
    const bySource = ORDER_SOURCES.map(s => ({
      source: s, order_count: 0, paid_count: 0, unpaid_count: 0, revenue_paid: 0, refunded_amount: 0,
    }));
    const byMap = Object.fromEntries(bySource.map(r => [r.source, r]));
    const paidSet = new Set(['paid', 'confirmed', 'processing', 'shipped', 'delivered']);
    const unpaidSet = new Set(['pending_payment', 'pending_verification', 'under_review', 'pending']);
    for (const o of orders) {
      const row = byMap[normalizeOrderSource(o.order_source)];
      row.order_count += 1;
      if (paidSet.has(o.payment_status) || paidSet.has(o.order_status)) {
        row.paid_count += 1;
        row.revenue_paid += Number(o.total_amount || 0);
      } else if (o.order_status === 'refunded') {
        row.refunded_amount += Number(o.total_amount || 0);
      } else if (unpaidSet.has(o.payment_status) || unpaidSet.has(o.order_status)) {
        row.unpaid_count += 1;
      } else {
        row.unpaid_count += 1;
      }
    }
    const filtered = (source && source !== 'all') ? bySource.filter(r => r.source === String(source).toLowerCase()) : bySource;
    if (format === 'csv') {
      const header = 'source,order_count,paid_count,unpaid_count,revenue_paid,refunded_amount';
      const lines = filtered.map(r => [r.source, r.order_count, r.paid_count, r.unpaid_count, r.revenue_paid, r.refunded_amount].join(','));
      res.set('Content-Type', 'text/csv; charset=utf-8');
      res.set('Content-Disposition', 'attachment; filename="sales-by-source.csv"');
      return res.send([header, ...lines].join('\n'));
    }
    res.json({
      success: true,
      data: {
        bySource: filtered,
        totals: {
          orders: orders.length,
          revenue: filtered.reduce((s, r) => s + r.revenue_paid, 0),
          unpaid: filtered.reduce((s, r) => s + r.unpaid_count, 0),
          receiptPending: orders.filter(o => o.payment_status === 'under_review').length,
        },
      },
    });
  } catch (err) {
    console.error('Sales report error:', err);
    res.status(500).json({ success: false, message: '리포트 조회 중 오류가 발생했습니다.' });
  }
});

// 1. Get all orders with filter & search
router.get('/orders', (req, res) => {
  try {
    const { status, payment_status, source, search, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND order_status = ?';
      params.push(status);
    }

    if (payment_status && payment_status !== 'all') {
      sql += ' AND payment_status = ?';
      params.push(payment_status);
    }

    if (source && source !== 'all') {
      if (!ORDER_SOURCES.includes(String(source).toLowerCase())) {
        return res.status(400).json({ success: false, message: '유효하지 않은 주문 채널입니다.' });
      }
      if (hasOrderSourceColumn()) {
        sql += ' AND order_source = ?';
        params.push(String(source).toLowerCase());
      }
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ? OR payment_sender_name LIKE ?)';
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    let orders = query.all(sql, ...params);
    if (source && source !== 'all' && !hasOrderSourceColumn()) {
      orders = orders.filter(o => normalizeOrderSource(o.order_source) === String(source).toLowerCase());
    }
    const ordersWithItems = orders.map(o => {
      const items = query.all('SELECT * FROM order_items WHERE order_id = ?', o.id);
      return { ...o, items };
    });

    res.json({ success: true, data: ordersWithItems });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    res.status(500).json({ success: false, message: '주문 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 2. Get single order full details
router.get('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    const items = query.all('SELECT * FROM order_items WHERE order_id = ?', order.id);
    res.json({ success: true, data: { ...order, items } });
  } catch (error) {
    console.error('Admin order detail error:', error);
    res.status(500).json({ success: false, message: '주문 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

// 3. Admin Bank Transfer Payment Verification (Wave 5: state-guarded.
// Approve moves under_review → paid/confirmed ONLY from unsettled states;
// paid/confirmed are never assigned to settled/terminal orders, and reject
// only returns unsettled orders to pending. Editors excluded.)
router.patch('/orders/:id/verify-payment', verifyRole(['super_admin', 'admin']), (req, res) => {
  try {
    const { id } = req.params;
    const { action = 'approve', notes } = req.body;

    const existing = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    const adminName = req.user?.name || '관리자';
    const UNSETTLED = ['pending_payment', 'pending_verification', 'under_review'];

    if (action === 'approve') {
      if (!UNSETTLED.includes(existing.payment_status)) {
        return res.status(409).json({ success: false, message: '미결제 상태의 주문만 승인할 수 있습니다.' });
      }
      query.run(`
        UPDATE orders
        SET
          payment_status = 'paid',
          order_status = 'confirmed',
          payment_verified_at = CURRENT_TIMESTAMP,
          payment_verified_by = ?,
          paid_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND payment_status IN ('pending_payment', 'pending_verification', 'under_review')
      `, adminName, Number(id));
    } else {
      if (!UNSETTLED.includes(existing.payment_status) && existing.payment_status !== 'paid') {
        return res.status(409).json({ success: false, message: '처리 불가 상태의 주문입니다.' });
      }
      if (existing.payment_status === 'paid') {
        return res.status(409).json({ success: false, message: '결제 완료된 주문은 반려할 수 없습니다.' });
      }
      query.run(`
        UPDATE orders
        SET
          payment_status = 'pending_payment',
          order_status = 'pending_verification',
          payment_admin_notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND payment_status IN ('pending_payment', 'pending_verification', 'under_review')
      `, notes || '입금 내역 불일치로 인한 재확인 요청', Number(id));
    }

    const updated = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    const items = query.all('SELECT * FROM order_items WHERE order_id = ?', updated.id);


    res.json({
      success: true,
      message: action === 'approve' ? '입금이 성공적으로 승인 확인되었습니다. 주문이 확정되었습니다.' : '입금 확인이 반려 처리되었습니다.',
      data: { ...updated, items }
    });
  } catch (error) {
    console.error('Admin verify payment error:', error);
    res.status(500).json({ success: false, message: '입금 검수 처리 실패: ' + error.message });
  }
});

// 4. Update order status (Wave 5: fulfillment transitions only. paid and
// confirmed are NEVER assigned here — only the verification path above
// produces them. Terminal states are immutable.)
router.patch('/orders/:id/status', verifyRole(['super_admin', 'admin', 'order_manager']), (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    const existing = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    if (['cancelled', 'refunded', 'delivered'].includes(existing.order_status)) {
      return res.status(409).json({ success: false, message: '종료된 주문의 상태는 변경할 수 없습니다.' });
    }
    if (['paid', 'confirmed'].includes(order_status)) {
      return res.status(409).json({ success: false, message: '결제 상태는 입금 검수 경로로만 변경할 수 있습니다.' });
    }

    const allowed = {
      pending_payment: ['pending_verification', 'cancelled'],
      pending_verification: ['cancelled', 'processing'],
      under_review: ['cancelled', 'processing'],
      confirmed: ['processing', 'shipped', 'cancelled'],
      processing: ['shipped', 'delivered', 'cancelled'],
      shipped: ['delivered'],
    };
    if (!allowed[existing.order_status]?.includes(order_status)) {
      return res.status(409).json({ success: false, message: '허용되지 않은 상태 전이입니다.' });
    }

    const result = query.run(`
      UPDATE orders
      SET order_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND order_status = ?
    `, order_status, Number(id), existing.order_status);
    if (!result.changes) {
      return res.status(409).json({ success: false, message: '주문 상태가 이미 변경되었습니다.' });
    }

    const updated = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    const items = query.all('SELECT * FROM order_items WHERE order_id = ?', updated.id);


    res.json({
      success: true,
      message: `주문 상태가 '${order_status}'(으)로 변경되었습니다.`,
      data: { ...updated, items }
    });
  } catch (error) {
    console.error('Admin update order status error:', error);
    res.status(500).json({ success: false, message: '주문 상태 변경 중 오류가 발생했습니다.' });
  }
});

// 5. Update tracking information (Wave 5: paid/confirmed/processing orders
// only; courier and tracking number required; editors excluded.)
router.patch('/orders/:id/tracking', verifyRole(['super_admin', 'admin', 'order_manager']), (req, res) => {
  try {
    const { id } = req.params;
    const { courier_name, tracking_number } = req.body;

    const existing = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    if (!['paid', 'confirmed', 'processing'].includes(existing.payment_status) && !['confirmed', 'processing'].includes(existing.order_status)) {
      return res.status(409).json({ success: false, message: '결제 완료된 주문만 배송 처리할 수 있습니다.' });
    }

    const courier = String(courier_name || '').trim();
    const tracking = String(tracking_number || '').trim();
    if (!courier || !tracking) {
      return res.status(400).json({ success: false, message: '택배사와 운송장 번호를 모두 입력해주세요.' });
    }

    const result = query.run(`
      UPDATE orders
      SET courier_name = ?, tracking_number = ?, order_status = 'shipped', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND order_status IN ('confirmed', 'processing')
    `, courier, tracking, Number(id));
    if (!result.changes) {
      return res.status(409).json({ success: false, message: '배송 처리 불가 상태의 주문입니다.' });
    }

    const updated = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    notificationService.sendShippingUpdate(updated).catch(err => console.error(err));

    res.json({
      success: true,
      message: '운송장 정보가 등록되었습니다.',
      data: updated
    });
  } catch (error) {
    console.error('Admin update tracking error:', error);
    res.status(500).json({ success: false, message: '운송장 등록 중 오류가 발생했습니다.' });
  }
});

export default router;
