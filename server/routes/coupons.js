import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

// Validate Coupon code
router.post('/coupons/validate', (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: '쿠폰 코드를 입력해주세요.' });
    }

    const coupon = query.get(`
      SELECT * FROM coupons
      WHERE code = ? AND is_active = 1
    `, code.toUpperCase().trim());

    if (!coupon) {
      return res.status(404).json({ success: false, message: '유효하지 않거나 만료된 쿠폰 코드입니다.' });
    }

    const orderSubtotal = Number(subtotal || 0);

    if (coupon.min_order_amount && orderSubtotal < coupon.min_order_amount) {
      return res.status(400).json({
        success: false,
        message: `해당 쿠폰은 최소 ₩${coupon.min_order_amount.toLocaleString('ko-KR')} 이상 주문 시 사용 가능합니다.`
      });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round((orderSubtotal * coupon.discount_value) / 100);
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      discountAmount = coupon.discount_value;
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: Math.min(orderSubtotal, discountAmount),
        description_ko: coupon.description_ko,
        description_en: coupon.description_en
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ success: false, message: '쿠폰 확인 중 오류가 발생했습니다.' });
  }
});

export default router;
