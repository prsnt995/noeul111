import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';

const router = express.Router();
router.use(verifyAdmin);

// List & search media assets
router.get('/media', (req, res) => {
  try {
    const { search, tag } = req.query;
    let sql = 'SELECT * FROM media WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR tags LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tag) {
      sql += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }

    sql += ' ORDER BY id DESC';

    const mediaList = query.all(sql, ...params);
    res.json({ success: true, data: mediaList });
  } catch (error) {
    console.error('Fetch media error:', error);
    res.status(500).json({ success: false, message: '미디어 파일 목록 조회 실패' });
  }
});

// Add media item
router.post('/media', (req, res) => {
  try {
    const { name, url, file_type, size_bytes, alt_text, tags } = req.body;

    if (!name || !url) {
      return res.status(400).json({ success: false, message: '미디어 이름과 파일 URL은 필수입니다.' });
    }

    const result = query.run(`
      INSERT INTO media (name, url, file_type, size_bytes, alt_text, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `, name.trim(), url.trim(), file_type || 'image', Number(size_bytes || 0), alt_text || name, tags || '');

    const created = query.get('SELECT * FROM media WHERE id = ?', Number(result.lastInsertRowid));
    res.status(201).json({ success: true, message: '미디어가 라이브러리에 등록되었습니다.', data: created });
  } catch (error) {
    console.error('Add media error:', error);
    res.status(500).json({ success: false, message: '미디어 등록 실패: ' + error.message });
  }
});

// Delete media item
router.delete('/media/:id', (req, res) => {
  try {
    const { id } = req.params;
    query.run('DELETE FROM media WHERE id = ?', Number(id));
    res.json({ success: true, message: '미디어가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '미디어 삭제 실패' });
  }
});

export default router;
