import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

// List all active categories for storefront
router.get('/', (req, res) => {
  try {
    const categories = query.all(`
      SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id AND status = 'active') as product_count
      FROM categories c
      WHERE c.is_active = 1
      ORDER BY c.sort_order ASC, c.id ASC
    `);
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Fetch storefront categories error:', error);
    res.status(500).json({ success: false, message: '카테고리 목록 조회 실패' });
  }
});

// Single category detail
router.get('/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const category = query.get(`
      SELECT * FROM categories
      WHERE slug = ? AND is_active = 1
    `, slug);

    if (!category) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: '카테고리 상세 조회 실패' });
  }
});

export default router;
