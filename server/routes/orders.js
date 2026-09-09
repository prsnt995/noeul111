import express from 'express';
import { query, db } from '../db/database.js';
import { optionalAuth, verifyToken } from '../middleware/auth.js';
import { paymentService } from '../services/paymentService.js';
import { notificationService } from '../services/notificationService.js';
import { CONFIG } from '../config.js';
import { upload } from '../utils/uploader.js';
import { supabaseSync } from '../lib/supabaseSync.js';

const router = express.Router();

// Generate unique readable Korean Order Number e.g. NE20260902-4821
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `NE${year}${month}${day}-${randomSuffix}`;
}

// 1. Place New Order (Customer Checkout)
router.post('/orders', optionalAuth, async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      postal_code,
      address,
      detail_address,
      shipping_memo,
      items,
      coupon_code,
      payment_method = 'bank_transfer',
      payment_sender_name,
    } = req.body;

    if (!customer_name || !customer_phone || !postal_code || !address) {
      return res.status(400).json({ success: false, message: '받는 분 이름, 연락처, 주소(우편번호 포함)를 모두 입력해주세요.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: '주문할 상품이 장바구니에 없습니다.' });
    }

    // 1. Validate items and compute subtotal
    let computedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = query.get('SELECT * FROM products WHERE id = ?', item.product_id);
      if (!product) {
        return res.status(400).json({ success: false, message: `상품(ID: ${item.product_id})을 찾을 수 없습니다.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `[${product.name_ko}] 상품의 재고가 부족합니다. (현재 재고: ${product.stock}개)`
        });
      }

      const unitPrice = product.discount_price || product.price;
      computedSubtotal += unitPrice * item.quantity;

      let images = [];
      try {
        images = JSON.parse(product.images || '[]');
      } catch {
        images = [];
      }

      validatedItems.push({
        product_id: product.id,
        product_name_ko: product.name_ko,
        product_name_en: product.name_en,
        product_sku: product.sku,
        image_url: images[0] || '',
        price: unitPrice,
        quantity: item.quantity,
        size: item.size || 'FREE',
        color: item.color || 'DEFAULT'
      });
    }

    // 2. Validate Coupon & Calculate Server-side Discount
    let discount_amount = 0;
    let appliedCoupon = null;

    if (coupon_code && typeof coupon_code === 'string' && coupon_code.trim()) {
      const cleanCode = coupon_code.toUpperCase().trim();
      const coupon = query.get('SELECT * FROM coupons WHERE code = ? AND is_active = 1', cleanCode);
      if (!coupon) {
        return res.status(400).json({ success: false, message: '유효하지 않거나 비활성화된 쿠폰 코드입니다.' });
      }

      const todayStr = new Date().toISOString().split('T')[0];

      if (coupon.start_date && coupon.start_date > todayStr) {
        return res.status(400).json({ success: false, message: '아직 사용할 수 없는 쿠폰 코드입니다.' });
      }

      if (coupon.end_date && coupon.end_date < todayStr) {
        return res.status(400).json({ success: false, message: '만료된 쿠폰 코드입니다.' });
      }

      if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.usage_limit > 0) {
        if (coupon.times_used >= coupon.usage_limit) {
          return res.status(400).json({ success: false, message: '쿠폰 사용 수량이 모두 소진되었습니다.' });
        }
      }

      if (coupon.min_order_amount && computedSubtotal < coupon.min_order_amount) {
        return res.status(400).json({
          success: false,
          message: `해당 쿠폰은 최소 ₩${coupon.min_order_amount.toLocaleString('ko-KR')} 이상 주문 시 사용 가능합니다.`
        });
      }

      if (coupon.discount_type === 'percentage') {
        discount_amount = Math.round((computedSubtotal * coupon.discount_value) / 100);
        if (coupon.max_discount_amount && discount_amount > coupon.max_discount_amount) {
          discount_amount = coupon.max_discount_amount;
        }
      } else {
        discount_amount = coupon.discount_value;
      }

      discount_amount = Math.min(computedSubtotal, discount_amount);
      appliedCoupon = coupon;
    }

    // 3. Compute Shipping Fee based on threshold (₩70,000) & Final Payable Total
    const discountedSubtotal = Math.max(0, computedSubtotal - discount_amount);
    const shipping_fee = computedSubtotal >= CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : CONFIG.DEFAULT_SHIPPING_FEE;
    const total_amount = Math.max(0, discountedSubtotal + shipping_fee);
    const order_number = generateOrderNumber();

    // 4. Determine Payment & Order Status
    let payment_status = 'pending_payment';
    let order_status = 'pending_verification';

    if (payment_method !== 'bank_transfer') {
      const paymentResult = await paymentService.processPayment({
        method: payment_method,
        amount: total_amount,
        orderNumber: order_number,
        customer: { name: customer_name, phone: customer_phone, email: customer_email }
      });
      payment_status = paymentResult.status === 'paid' ? 'paid' : 'pending_payment';
      order_status = payment_status === 'paid' ? 'confirmed' : 'pending_verification';
    }

    const userId = req.user ? req.user.id : null;
    const senderName = payment_sender_name ? payment_sender_name.trim() : customer_name.trim();

    // 5. Save order to database & update stock atomically
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        postal_code, address, detail_address, shipping_memo,
        subtotal, discount_amount, coupon_code, shipping_fee, total_amount,
        payment_method, payment_status, order_status, payment_sender_name, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const orderRes = insertOrderStmt.run(
      order_number,
      userId,
      customer_name.trim(),
      customer_email ? customer_email.trim() : '',
      customer_phone.trim(),
      postal_code.trim(),
      address.trim(),
      detail_address ? detail_address.trim() : '',
      shipping_memo ? shipping_memo.trim() : '',
      computedSubtotal,
      discount_amount,
      appliedCoupon ? appliedCoupon.code : null,
      shipping_fee,
      total_amount,
      payment_method,
      payment_status,
      order_status,
      senderName,
      payment_status === 'paid' ? new Date().toISOString() : null
    );

    const orderId = Number(orderRes.lastInsertRowid);

    // Update coupon usage count if coupon was applied
    if (appliedCoupon) {
      db.prepare('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?').run(appliedCoupon.id);
    }

    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, product_name_ko, product_name_en, product_sku,
        image_url, price, quantity, size, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStockStmt = db.prepare(`
      UPDATE products
      SET stock = stock - ?, sales_count = sales_count + ?
      WHERE id = ?
    `);

    for (const vItem of validatedItems) {
      insertItemStmt.run(
        orderId,
        vItem.product_id,
        vItem.product_name_ko,
        vItem.product_name_en,
        vItem.product_sku,
        vItem.image_url,
        vItem.price,
        vItem.quantity,
        vItem.size,
        vItem.color
      );

      // Decrement stock and increment sales count
      updateStockStmt.run(vItem.quantity, vItem.quantity, vItem.product_id);
    }

    const createdOrder = query.get('SELECT * FROM orders WHERE id = ?', orderId);
    createdOrder.items = validatedItems;

    // Sync order to Supabase
    supabaseSync.createOrder(createdOrder).catch(err => console.error('Supabase order sync error:', err));

    // 5. Send order confirmation notification asynchronously
    notificationService.sendOrderConfirmation(createdOrder).catch(err => console.error(err));

    res.status(201).json({
      success: true,
      message: '주문이 성공적으로 접수되었습니다. 안내된 계좌로 입금 후 영수증을 업로드해주세요.',
      order: createdOrder
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: '주문 처리 중 오류가 발생했습니다.' });
  }
});

// 2. Upload Payment Screenshot / Receipt (Customer)
router.post('/orders/:orderNumber/payment-receipt', upload.single('receipt'), (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { sender_name } = req.body;

    const order = query.get('SELECT * FROM orders WHERE order_number = ?', orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    if (!req.file && !req.body.receipt_url) {
      return res.status(400).json({ success: false, message: '결제 영수증 또는 이체 스크린샷 파일을 선택해주세요.' });
    }

    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : req.body.receipt_url;
    const finalSenderName = sender_name ? sender_name.trim() : (order.payment_sender_name || order.customer_name);

    query.run(`
      UPDATE orders
      SET
        payment_receipt_url = ?,
        payment_sender_name = ?,
        payment_status = 'under_review',
        receipt_uploaded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, receiptUrl, finalSenderName, order.id);

    const updated = query.get('SELECT * FROM orders WHERE id = ?', order.id);
    const items = query.all('SELECT * FROM order_items WHERE order_id = ?', order.id);

    res.json({
      success: true,
      message: '결제 이체 영수증이 성공적으로 등록되었습니다. 관리자 입금 확인 후 배송이 시작됩니다.',
      data: { ...updated, items }
    });
  } catch (error) {
    console.error('Payment receipt upload error:', error);
    res.status(500).json({ success: false, message: '영수증 업로드 중 오류가 발생했습니다: ' + error.message });
  }
});

// 3. Get My Orders (Customer Account)
router.get('/orders/my-orders', verifyToken, (req, res) => {
  try {
    const orders = query.all(`
      SELECT * FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, req.user.id);

    const ordersWithItems = orders.map(order => {
      const items = query.all('SELECT * FROM order_items WHERE order_id = ?', order.id);
      return {
        ...order,
        items
      };
    });

    res.json({ success: true, data: ordersWithItems });
  } catch (error) {
    console.error('My orders fetch error:', error);
    res.status(500).json({ success: false, message: '주문 내역을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 4. Get Specific Order Details by Order Number
router.get('/orders/:orderNumber', optionalAuth, (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = query.get('SELECT * FROM orders WHERE order_number = ?', orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, message: '주문 정보를 찾을 수 없습니다.' });
    }

    // If order has user_id, ensure owner or admin can view
    if (order.user_id && req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.id !== order.user_id) {
      return res.status(403).json({ success: false, message: '주문 조회 권한이 없습니다.' });
    }

    const items = query.all('SELECT * FROM order_items WHERE order_id = ?', order.id);

    res.json({
      success: true,
      data: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error('Order detail fetch error:', error);
    res.status(500).json({ success: false, message: '주문 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

export default router;
