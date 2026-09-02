import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';

const router = express.Router();
router.use(verifyAdmin);

// List all pages
router.get('/pages', (req, res) => {
  try {
    const pages = query.all('SELECT * FROM pages ORDER BY id DESC');
    res.json({ success: true, data: pages });
  } catch (error) {
    console.error('Fetch pages error:', error);
    res.status(500).json({ success: false, message: '페이지 목록 조회 실패' });
  }
});

// Create page
router.post('/pages', (req, res) => {
  try {
    const { slug, title_ko, title_en, banner_image, content_ko, content_en, meta_title, meta_description, is_published } = req.body;

    if (!slug || !title_ko) {
      return res.status(400).json({ success: false, message: 'URL 슬러그와 제목은 필수입니다.' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    const existing = query.get('SELECT id FROM pages WHERE slug = ?', cleanSlug);
    if (existing) {
      return res.status(400).json({ success: false, message: '이미 존재하는 URL 슬러그입니다.' });
    }

    const result = query.run(`
      INSERT INTO pages (slug, title_ko, title_en, banner_image, content_ko, content_en, meta_title, meta_description, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, cleanSlug, title_ko.trim(), title_en ? title_en.trim() : title_ko.trim(), banner_image || '', content_ko || '', content_en || '', meta_title || '', meta_description || '', is_published ? 1 : 0);

    const created = query.get('SELECT * FROM pages WHERE id = ?', Number(result.lastInsertRowid));
    res.status(201).json({ success: true, message: '새 페이지가 생성되었습니다.', data: created });
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ success: false, message: '페이지 생성 실패: ' + error.message });
  }
});

// Update page
router.put('/pages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { slug, title_ko, title_en, banner_image, content_ko, content_en, meta_title, meta_description, is_published } = req.body;

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    query.run(`
      UPDATE pages SET
        slug = ?,
        title_ko = ?,
        title_en = ?,
        banner_image = ?,
        content_ko = ?,
        content_en = ?,
        meta_title = ?,
        meta_description = ?,
        is_published = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, cleanSlug, title_ko.trim(), title_en.trim(), banner_image || '', content_ko || '', content_en || '', meta_title || '', meta_description || '', is_published ? 1 : 0, Number(id));

    const updated = query.get('SELECT * FROM pages WHERE id = ?', Number(id));
    res.json({ success: true, message: '페이지가 수정되었습니다.', data: updated });
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ success: false, message: '페이지 수정 실패' });
  }
});

// Delete page
router.delete('/pages/:id', (req, res) => {
  try {
    const { id } = req.params;
    query.run('DELETE FROM pages WHERE id = ?', Number(id));
    res.json({ success: true, message: '페이지가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '페이지 삭제 실패' });
  }
});

export default router;
