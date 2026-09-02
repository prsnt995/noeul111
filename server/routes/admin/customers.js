import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';

const router = express.Router();
router.use(verifyAdmin);

// Get customers list with analytics (order counts, total spent)
router.get('/customers', (req, res) => {
  try {
    const { search } = req.query;

    let sql = `
      SELECT u.id, u.email, u.name, u.phone, u.postal_code, u.address, u.detail_address, u.created_at,
             COUNT(o.id) as order_count,
             COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_spent,
             MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer'
    `;
    const params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      params.push(term, term, term);
    }

    sql += ' GROUP BY u.id ORDER BY u.created_at DESC';

    const customers = query.all(sql, ...params);
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Admin customers fetch error:', error);
    res.status(500).json({ success: false, message: '고객 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// Get customer details with purchase history
router.get('/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const customer = query.get(`
      SELECT id, email, name, phone, postal_code, address, detail_address, created_at, role
      FROM users
      WHERE id = ? AND role = 'customer'
    `, Number(id));

    if (!customer) {
      return res.status(404).json({ success: false, message: '고객을 찾을 수 없습니다.' });
    }

    const orders = query.all(`
      SELECT * FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, Number(id));

    const ordersWithItems = orders.map(o => {
      const items = query.all('SELECT * FROM order_items WHERE order_id = ?', o.id);
      return { ...o, items };
    });

    res.json({
      success: true,
      data: {
        ...customer,
        orders: ordersWithItems
      }
    });
  } catch (error) {
    console.error('Admin customer detail error:', error);
    res.status(500).json({ success: false, message: '고객 상세 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

export default router;
