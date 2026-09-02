import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';

const router = express.Router();
router.use(verifyAdmin);

// 1. Banners Management
router.get('/content/banners', (req, res) => {
  try {
    const banners = query.all('SELECT * FROM banners ORDER BY sort_order ASC, id ASC');
    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Admin banners fetch error:', error);
    res.status(500).json({ success: false, message: '배너 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

router.post('/content/banners', (req, res) => {
  try {
    const { type, title_ko, title_en, subtitle_ko, subtitle_en, image_url, link_url, button_text_ko, button_text_en, sort_order = 0, is_active = 1 } = req.body;

    if (!type || !title_ko || !title_en) {
      return res.status(400).json({ success: false, message: '배너 타입과 제목(한/영)은 필수 항목입니다.' });
    }

    const result = query.run(`
      INSERT INTO banners (type, title_ko, title_en, subtitle_ko, subtitle_en, image_url, link_url, button_text_ko, button_text_en, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, type, title_ko.trim(), title_en.trim(), subtitle_ko || '', subtitle_en || '', image_url || '', link_url || '', button_text_ko || '', button_text_en || '', Number(sort_order), is_active ? 1 : 0);

    const created = query.get('SELECT * FROM banners WHERE id = ?', Number(result.lastInsertRowid));
    res.status(201).json({ success: true, message: '배너가 추가되었습니다.', data: created });
  } catch (error) {
    console.error('Admin create banner error:', error);
    res.status(500).json({ success: false, message: '배너 추가 중 오류가 발생했습니다.' });
  }
});

router.put('/content/banners/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { type, title_ko, title_en, subtitle_ko, subtitle_en, image_url, link_url, button_text_ko, button_text_en, sort_order, is_active } = req.body;

    const existing = query.get('SELECT id FROM banners WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '배너를 찾을 수 없습니다.' });
    }

    query.run(`
      UPDATE banners SET
        type = ?,
        title_ko = ?,
        title_en = ?,
        subtitle_ko = ?,
        subtitle_en = ?,
        image_url = ?,
        link_url = ?,
        button_text_ko = ?,
        button_text_en = ?,
        sort_order = ?,
        is_active = ?
      WHERE id = ?
    `, type, title_ko, title_en, subtitle_ko || '', subtitle_en || '', image_url || '', link_url || '', button_text_ko || '', button_text_en || '', Number(sort_order || 0), is_active ? 1 : 0, Number(id));

    const updated = query.get('SELECT * FROM banners WHERE id = ?', Number(id));
    res.json({ success: true, message: '배너가 수정되었습니다.', data: updated });
  } catch (error) {
    console.error('Admin update banner error:', error);
    res.status(500).json({ success: false, message: '배너 수정 중 오류가 발생했습니다.' });
  }
});

router.delete('/content/banners/:id', (req, res) => {
  try {
    const { id } = req.params;
    query.run('DELETE FROM banners WHERE id = ?', Number(id));
    res.json({ success: true, message: '배너가 삭제되었습니다.' });
  } catch (error) {
    console.error('Admin delete banner error:', error);
    res.status(500).json({ success: false, message: '배너 삭제 중 오류가 발생했습니다.' });
  }
});

// 2. Site Settings Management (About story, policies, CS info)
router.get('/content/settings', (req, res) => {
  try {
    const rows = query.all('SELECT * FROM site_settings');
    const settings = {};
    rows.forEach(r => {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Admin settings fetch error:', error);
    res.status(500).json({ success: false, message: '설정 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

router.put('/content/settings', (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: '설정 데이터가 올바르지 않습니다.' });
    }

    for (const [key, value] of Object.entries(settings)) {
      const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const existing = query.get('SELECT key FROM site_settings WHERE key = ?', key);
      if (existing) {
        query.run('UPDATE site_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', valStr, key);
      } else {
        query.run('INSERT INTO site_settings (key, value) VALUES (?, ?)', key, valStr);
      }
    }

    res.json({ success: true, message: '사이트 설정이 저장되었습니다.' });
  } catch (error) {
    console.error('Admin save settings error:', error);
    res.status(500).json({ success: false, message: '설정 저장 중 오류가 발생했습니다.' });
  }
});

export default router;
