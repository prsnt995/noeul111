import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';
import { notificationService } from '../../services/notificationService.js';
import { supabaseSync } from '../../lib/supabaseSync.js';

const router = express.Router();
router.use(verifyAdmin);

// 1. Get all orders with filter & search
router.get('/orders', (req, res) => {
  try {
    const { status, payment_status, search, limit = 100, offset = 0 } = req.query;

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

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ? OR payment_sender_name LIKE ?)';
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const orders = query.all(sql, ...params);
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

// 3. Admin Bank Transfer Payment Verification
router.patch('/orders/:id/verify-payment', (req, res) => {
  try {
    const { id } = req.params;
    const { action = 'approve', notes } = req.body;

    const existing = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    const adminName = req.user?.name || '관리자';

    if (action === 'approve') {
      query.run(`
        UPDATE orders
        SET
          payment_status = 'paid',
          order_status = 'confirmed',
          payment_verified_at = CURRENT_TIMESTAMP,
          payment_verified_by = ?,
          paid_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, adminName, Number(id));
    } else {
      query.run(`
        UPDATE orders
        SET
          payment_status = 'pending_payment',
          order_status = 'pending_verification',
          payment_admin_notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, notes || '입금 내역 불일치로 인한 재확인 요청', Number(id));
    }

    const updated = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    const items = query.all('SELECT * FROM order_items WHERE order_id = ?', updated.id);

    supabaseSync.updateOrderStatus(updated.id, updated.order_status, updated.payment_status).catch(err => console.error('Supabase order sync error:', err));

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

// 4. Update order status
router.patch('/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    const existing = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    const newOrderStatus = order_status || existing.order_status;
    const newPaymentStatus = payment_status || (newOrderStatus === 'confirmed' ? 'paid' : existing.payment_status);

    query.run(`
      UPDATE orders
      SET order_status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, newOrderStatus, newPaymentStatus, Number(id));

    const updated = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    const items = query.all('SELECT * FROM order_items WHERE order_id = ?', updated.id);

    supabaseSync.updateOrderStatus(updated.id, updated.order_status, updated.payment_status).catch(err => console.error('Supabase order sync error:', err));

    res.json({
      success: true,
      message: `주문 상태가 '${newOrderStatus}'(으)로 변경되었습니다.`,
      data: { ...updated, items }
    });
  } catch (error) {
    console.error('Admin update order status error:', error);
    res.status(500).json({ success: false, message: '주문 상태 변경 중 오류가 발생했습니다.' });
  }
});

// 5. Update tracking information
router.patch('/orders/:id/tracking', (req, res) => {
  try {
    const { id } = req.params;
    const { courier_name, tracking_number, auto_ship = true } = req.body;

    const existing = query.get('SELECT * FROM orders WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    const nextStatus = auto_ship ? 'shipped' : existing.order_status;

    query.run(`
      UPDATE orders
      SET courier_name = ?, tracking_number = ?, order_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, courier_name || 'CJ대한통운', tracking_number ? tracking_number.trim() : null, nextStatus, Number(id));

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
