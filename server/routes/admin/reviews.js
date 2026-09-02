import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';

const router = express.Router();
router.use(verifyAdmin);

// List all reviews with product info
router.get('/reviews', (req, res) => {
  try {
    const reviews = query.all(`
      SELECT r.*, p.name_ko as product_name_ko, p.name_en as product_name_en, p.sku as product_sku, p.images as product_images
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.id DESC
    `).map(r => ({
      ...r,
      is_approved: Boolean(r.is_approved),
      is_featured: Boolean(r.is_featured),
      product_images: typeof r.product_images === 'string' ? JSON.parse(r.product_images || '[]') : r.product_images
    }));

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ success: false, message: '리뷰 목록 조회 실패' });
  }
});

// Toggle review approval
router.patch('/reviews/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    query.run('UPDATE reviews SET is_approved = ? WHERE id = ?', is_approved ? 1 : 0, Number(id));
    res.json({ success: true, message: `리뷰가 ${is_approved ? '승인' : '비공개'} 처리되었습니다.` });
  } catch (error) {
    res.status(500).json({ success: false, message: '상태 변경 실패' });
  }
});

// Toggle featured review
router.patch('/reviews/:id/feature', (req, res) => {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;

    query.run('UPDATE reviews SET is_featured = ? WHERE id = ?', is_featured ? 1 : 0, Number(id));
    res.json({ success: true, message: `리뷰가 메인 추천 ${is_featured ? '등록' : '해제'} 되었습니다.` });
  } catch (error) {
    res.status(500).json({ success: false, message: '추천 상태 변경 실패' });
  }
});

// Delete review
router.delete('/reviews/:id', (req, res) => {
  try {
    const { id } = req.params;
    query.run('DELETE FROM reviews WHERE id = ?', Number(id));
    res.json({ success: true, message: '리뷰가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '리뷰 삭제 실패' });
  }
});

export default router;
