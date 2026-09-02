import express from 'express';
import { query } from '../db/database.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Get approved reviews for a product
router.get('/products/:productId/reviews', (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = query.all(`
      SELECT id, author_name, rating, title, comment, image_url, is_featured, created_at
      FROM reviews
      WHERE product_id = ? AND is_approved = 1
      ORDER BY id DESC
    `, Number(productId));

    const avgRatingRow = query.get(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews
      WHERE product_id = ? AND is_approved = 1
    `, Number(productId));

    res.json({
      success: true,
      data: reviews,
      summary: {
        averageRating: Number(avgRatingRow?.avg_rating || 5).toFixed(1),
        totalReviews: Number(avgRatingRow?.count || 0)
      }
    });
  } catch (error) {
    console.error('Fetch product reviews error:', error);
    res.status(500).json({ success: false, message: '리뷰 목록 조회 실패' });
  }
});

// Submit a review (can be logged in or guest)
router.post('/products/:productId/reviews', (req, res) => {
  try {
    const { productId } = req.params;
    const { author_name, rating, title, comment, image_url } = req.body;

    if (!author_name || !rating || !comment) {
      return res.status(400).json({ success: false, message: '작성자 이름, 별점, 리뷰 내용은 필수입니다.' });
    }

    const numericRating = Math.min(5, Math.max(1, Number(rating)));

    const result = query.run(`
      INSERT INTO reviews (product_id, author_name, rating, title, comment, image_url, is_approved, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, 1, 0)
    `, Number(productId), author_name.trim(), numericRating, title || '', comment.trim(), image_url || '');

    const created = query.get('SELECT * FROM reviews WHERE id = ?', Number(result.lastInsertRowid));
    res.status(201).json({ success: true, message: '리뷰가 등록되었습니다. 감사합니다!', data: created });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, message: '리뷰 등록 실패' });
  }
});

export default router;
