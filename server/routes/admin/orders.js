import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin, verifyRole } from '../../middleware/auth.js';
import { notificationService } from '../../services/notificationService.js';

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
