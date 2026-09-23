import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

// Validate Coupon code
router.post('/coupons/validate', (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: '쿠폰 코드를 입력해주세요.' });
    }

    const cleanCode = code.toUpperCase().trim();
    const coupon = query.get(`
      SELECT * FROM coupons
      WHERE code = ? AND is_active = 1
    `, cleanCode);

    if (!coupon) {
      return res.status(404).json({ success: false, message: '유효하지 않거나 비활성화된 쿠폰 코드입니다.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Check Start Date
    if (coupon.start_date && coupon.start_date > todayStr) {
      return res.status(400).json({ success: false, message: '아직 사용할 수 없는 쿠폰 코드입니다.' });
    }

    // Check End Date (Expiry)
    if (coupon.end_date && coupon.end_date < todayStr) {
      return res.status(400).json({ success: false, message: '만료된 쿠폰 코드입니다.' });
    }

    // Check Usage Limit
    if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.usage_limit > 0) {
      if (coupon.times_used >= coupon.usage_limit) {
        return res.status(400).json({ success: false, message: '쿠폰 발급 및 사용 수량이 모두 소진되었습니다.' });
      }
    }

    const orderSubtotal = Number(subtotal || 0);

    // Check Minimum Order Amount
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

    discountAmount = Math.min(orderSubtotal, discountAmount);

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
        description_ko: coupon.description_ko,
        description_en: coupon.description_en,
        min_order_amount: coupon.min_order_amount
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ success: false, message: '쿠폰 확인 중 오류가 발생했습니다.' });
  }
});

export default router;

