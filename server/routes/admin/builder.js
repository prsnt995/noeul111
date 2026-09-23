import express from 'express';
import { query, db } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';

const router = express.Router();
router.use(verifyAdmin);

function parseSection(s) {
  if (!s) return null;
  return {
    ...s,
    content: typeof s.content_json === 'string' ? JSON.parse(s.content_json || '{}') : s.content_json,
    is_active: Boolean(s.is_active),
    is_draft: Boolean(s.is_draft),
  };
}

// Get all homepage sections ordered by sort_order
router.get('/builder/sections', (req, res) => {
  try {
    const rows = query.all('SELECT * FROM homepage_sections ORDER BY sort_order ASC, id ASC');
    res.json({ success: true, data: rows.map(parseSection) });
  } catch (error) {
    console.error('Fetch sections error:', error);
    res.status(500).json({ success: false, message: '섹션 목록 조회 실패' });
  }
});

// Add new section
router.post('/builder/sections', (req, res) => {
  try {
    const { section_key, type, title_ko, title_en, subtitle_ko, subtitle_en, content, sort_order } = req.body;

    if (!type || !title_ko) {
      return res.status(400).json({ success: false, message: '섹션 타입과 제목은 필수입니다.' });
    }

    const key = section_key || `sec_${Date.now()}`;
    const order = sort_order !== undefined ? Number(sort_order) : query.get('SELECT COUNT(*) as count FROM homepage_sections').count + 1;

    const result = query.run(`
      INSERT INTO homepage_sections (section_key, type, title_ko, title_en, subtitle_ko, subtitle_en, content_json, sort_order, is_active, is_draft)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `, key, type, title_ko, title_en || title_ko, subtitle_ko || '', subtitle_en || '', JSON.stringify(content || {}), order);

    const created = query.get('SELECT * FROM homepage_sections WHERE id = ?', Number(result.lastInsertRowid));
    res.status(201).json({ success: true, message: '새 섹션이 생성되었습니다.', data: parseSection(created) });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ success: false, message: '섹션 생성 실패: ' + error.message });
  }
});

// Update section
router.put('/builder/sections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { type, title_ko, title_en, subtitle_ko, subtitle_en, content, sort_order, is_active } = req.body;

    const existing = query.get('SELECT id FROM homepage_sections WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '섹션을 찾을 수 없습니다.' });
    }

    query.run(`
      UPDATE homepage_sections SET
        type = ?,
        title_ko = ?,
        title_en = ?,
        subtitle_ko = ?,
        subtitle_en = ?,
        content_json = ?,
        sort_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, type, title_ko, title_en, subtitle_ko || '', subtitle_en || '', JSON.stringify(content || {}), Number(sort_order || 0), is_active ? 1 : 0, Number(id));

    const updated = query.get('SELECT * FROM homepage_sections WHERE id = ?', Number(id));
    res.json({ success: true, message: '섹션이 수정되었습니다.', data: parseSection(updated) });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ success: false, message: '섹션 수정 실패: ' + error.message });
  }
});

// Duplicate section
router.post('/builder/sections/:id/duplicate', (req, res) => {
  try {
    const { id } = req.params;
    const original = query.get('SELECT * FROM homepage_sections WHERE id = ?', Number(id));
    if (!original) {
      return res.status(404).json({ success: false, message: '섹션을 찾을 수 없습니다.' });
    }

    const newKey = `${original.section_key}_copy_${Date.now().toString().slice(-4)}`;
    const newTitleKo = `${original.title_ko} (복사본)`;
    const newTitleEn = `${original.title_en} (Copy)`;
    const newOrder = original.sort_order + 1;

    const result = query.run(`
      INSERT INTO homepage_sections (section_key, type, title_ko, title_en, subtitle_ko, subtitle_en, content_json, sort_order, is_active, is_draft)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `, newKey, original.type, newTitleKo, newTitleEn, original.subtitle_ko, original.subtitle_en, original.content_json, newOrder);

    const created = query.get('SELECT * FROM homepage_sections WHERE id = ?', Number(result.lastInsertRowid));
    res.status(201).json({ success: true, message: '섹션이 복제되었습니다.', data: parseSection(created) });
  } catch (error) {
    console.error('Duplicate section error:', error);
    res.status(500).json({ success: false, message: '섹션 복제 실패' });
  }
});

// Reorder sections
router.patch('/builder/sections/reorder', (req, res) => {
  try {
    const { sectionIds } = req.body; // array of IDs in new order
    if (!Array.isArray(sectionIds)) {
      return res.status(400).json({ success: false, message: '섹션 ID 배열이 필요합니다.' });
    }

    const updateStmt = db.prepare('UPDATE homepage_sections SET sort_order = ? WHERE id = ?');
    sectionIds.forEach((id, index) => {
      updateStmt.run(index + 1, Number(id));
    });

    const rows = query.all('SELECT * FROM homepage_sections ORDER BY sort_order ASC');
    res.json({ success: true, message: '섹션 순서가 변경되었습니다.', data: rows.map(parseSection) });
  } catch (error) {
    console.error('Reorder sections error:', error);
    res.status(500).json({ success: false, message: '순서 변경 실패' });
  }
});

// Toggle active
router.patch('/builder/sections/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const existing = query.get('SELECT id, is_active FROM homepage_sections WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '섹션을 찾을 수 없습니다.' });
    }

    const newActive = existing.is_active ? 0 : 1;
    query.run('UPDATE homepage_sections SET is_active = ? WHERE id = ?', newActive, Number(id));
    res.json({ success: true, is_active: Boolean(newActive), message: `섹션이 ${newActive ? '활성화' : '숨김'} 처리되었습니다.` });
  } catch (error) {
    res.status(500).json({ success: false, message: '상태 변경 실패' });
  }
});

// Delete section
router.delete('/builder/sections/:id', (req, res) => {
  try {
    const { id } = req.params;
    query.run('DELETE FROM homepage_sections WHERE id = ?', Number(id));
    res.json({ success: true, message: '섹션이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '섹션 삭제 실패' });
  }
});

export default router;
