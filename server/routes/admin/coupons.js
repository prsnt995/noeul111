import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';
import { supabaseSync } from '../../lib/supabaseSync.js';

const router = express.Router();
router.use(verifyAdmin);

// List all coupons
router.get('/coupons', (req, res) => {
  try {
    const coupons = query.all('SELECT * FROM coupons ORDER BY id DESC');
    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error('Fetch coupons error:', error);
    res.status(500).json({ success: false, message: '쿠폰 목록 조회 실패' });
  }
});

// Create coupon
router.post('/coupons', (req, res) => {
  try {
    const { code, description_ko, description_en, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, end_date, usage_limit, is_active } = req.body;

    if (!code || !discount_value) {
      return res.status(400).json({ success: false, message: '쿠폰 코드와 할인 금액/비율은 필수입니다.' });
    }

    const cleanCode = code.toUpperCase().trim();

    const existing = query.get('SELECT id FROM coupons WHERE code = ?', cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, message: '이미 존재하는 쿠폰 코드입니다.' });
    }

    const result = query.run(`
      INSERT INTO coupons (code, description_ko, description_en, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, end_date, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, cleanCode, description_ko || '', description_en || '', discount_type || 'percentage', Number(discount_value), Number(min_order_amount || 0), max_discount_amount ? Number(max_discount_amount) : null, start_date || null, end_date || null, usage_limit ? Number(usage_limit) : 1000, is_active ? 1 : 0);

    const created = query.get('SELECT * FROM coupons WHERE id = ?', Number(result.lastInsertRowid));
    supabaseSync.upsertCoupon(created).catch(err => console.error('Supabase coupon sync error:', err));
    res.status(201).json({ success: true, message: '쿠폰이 발행되었습니다.', data: created });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ success: false, message: '쿠폰 생성 실패: ' + error.message });
  }
});

// Update coupon
router.put('/coupons/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { code, description_ko, description_en, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, end_date, usage_limit, is_active } = req.body;

    const cleanCode = code.toUpperCase().trim();

    query.run(`
      UPDATE coupons SET
        code = ?,
        description_ko = ?,
        description_en = ?,
        discount_type = ?,
        discount_value = ?,
        min_order_amount = ?,
        max_discount_amount = ?,
        start_date = ?,
        end_date = ?,
        usage_limit = ?,
        is_active = ?
      WHERE id = ?
    `, cleanCode, description_ko || '', description_en || '', discount_type, Number(discount_value), Number(min_order_amount || 0), max_discount_amount ? Number(max_discount_amount) : null, start_date || null, end_date || null, usage_limit ? Number(usage_limit) : 1000, is_active ? 1 : 0, Number(id));

    const updated = query.get('SELECT * FROM coupons WHERE id = ?', Number(id));
    supabaseSync.upsertCoupon(updated).catch(err => console.error('Supabase coupon sync error:', err));
    res.json({ success: true, message: '쿠폰 정보가 수정되었습니다.', data: updated });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ success: false, message: '쿠폰 수정 실패' });
  }
});

// Delete coupon
router.delete('/coupons/:id', (req, res) => {
  try {
    const { id } = req.params;
    query.run('DELETE FROM coupons WHERE id = ?', Number(id));
    res.json({ success: true, message: '쿠폰이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '쿠폰 삭제 실패' });
  }
});

export default router;
