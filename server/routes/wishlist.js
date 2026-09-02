import express from 'express';
import { query } from '../db/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get Current User's Wishlist with full product objects
router.get('/wishlist', verifyToken, (req, res) => {
  try {
    const rows = query.all(`
      SELECT p.*, c.slug as category_slug, c.name_ko as category_name_ko, c.name_en as category_name_en, w.created_at as wishlisted_at
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE w.user_id = ? AND p.status = 'active'
      ORDER BY w.created_at DESC
    `, req.user.id);

    const items = rows.map(p => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : p.images,
      sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes || '[]') : p.sizes,
      colors: typeof p.colors === 'string' ? JSON.parse(p.colors || '[]') : p.colors,
      details: typeof p.details === 'string' ? JSON.parse(p.details || '{}') : p.details,
      is_new: Boolean(p.is_new),
      is_best: Boolean(p.is_best),
    }));

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    res.status(500).json({ success: false, message: '위시리스트를 불러오는 중 오류가 발생했습니다.' });
  }
});

// Toggle Product in Wishlist
router.post('/wishlist/toggle', verifyToken, (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ success: false, message: '상품 ID가 필요합니다.' });
    }

    const existing = query.get('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?', req.user.id, product_id);

    if (existing) {
      query.run('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', req.user.id, product_id);
      return res.json({ success: true, is_wishlisted: false, message: '위시리스트에서 삭제되었습니다.' });
    } else {
      query.run('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', req.user.id, product_id);
      return res.json({ success: true, is_wishlisted: true, message: '위시리스트에 저장되었습니다.' });
    }
  } catch (error) {
    console.error('Wishlist toggle error:', error);
    res.status(500).json({ success: false, message: '위시리스트 처리 중 오류가 발생했습니다.' });
  }
});

export default router;
