import express from 'express';
import { query, db } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';

const router = express.Router();
router.use(verifyAdmin);

// List all navigation menu items
router.get('/menus', (req, res) => {
  try {
    const items = query.all('SELECT * FROM menu_items ORDER BY sort_order ASC, id ASC');
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Fetch menu items error:', error);
    res.status(500).json({ success: false, message: '메뉴 목록 조회 실패' });
  }
});

// Add menu item
router.post('/menus', (req, res) => {
  try {
    const { parent_id, title_ko, title_en, link_type, link_value, badge_tag, sort_order } = req.body;

    if (!title_ko || !link_value) {
      return res.status(400).json({ success: false, message: '메뉴명과 이동 링크는 필수입니다.' });
    }

    const order = sort_order !== undefined ? Number(sort_order) : query.get('SELECT COUNT(*) as count FROM menu_items').count + 1;

    const result = query.run(`
      INSERT INTO menu_items (parent_id, title_ko, title_en, link_type, link_value, badge_tag, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, parent_id ? Number(parent_id) : null, title_ko.trim(), title_en ? title_en.trim() : title_ko.trim(), link_type || 'custom', link_value.trim(), badge_tag || null, order);

    const created = query.get('SELECT * FROM menu_items WHERE id = ?', Number(result.lastInsertRowid));
    res.status(201).json({ success: true, message: '메뉴 항목이 추가되었습니다.', data: created });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ success: false, message: '메뉴 추가 실패: ' + error.message });
  }
});

// Update menu item
router.put('/menus/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { parent_id, title_ko, title_en, link_type, link_value, badge_tag, sort_order, is_active } = req.body;

    query.run(`
      UPDATE menu_items SET
        parent_id = ?,
        title_ko = ?,
        title_en = ?,
        link_type = ?,
        link_value = ?,
        badge_tag = ?,
        sort_order = ?,
        is_active = ?
      WHERE id = ?
    `, parent_id ? Number(parent_id) : null, title_ko.trim(), title_en.trim(), link_type || 'custom', link_value.trim(), badge_tag || null, Number(sort_order || 0), is_active ? 1 : 0, Number(id));

    const updated = query.get('SELECT * FROM menu_items WHERE id = ?', Number(id));
    res.json({ success: true, message: '메뉴 항목이 수정되었습니다.', data: updated });
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({ success: false, message: '메뉴 수정 실패' });
  }
});

// Reorder menus
router.patch('/menus/reorder', (req, res) => {
  try {
    const { menuIds } = req.body;
    if (!Array.isArray(menuIds)) {
      return res.status(400).json({ success: false, message: '메뉴 ID 배열이 필요합니다.' });
    }

    const updateStmt = db.prepare('UPDATE menu_items SET sort_order = ? WHERE id = ?');
    menuIds.forEach((id, index) => {
      updateStmt.run(index + 1, Number(id));
    });

    const rows = query.all('SELECT * FROM menu_items ORDER BY sort_order ASC');
    res.json({ success: true, message: '메뉴 순서가 변경되었습니다.', data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: '메뉴 순서 변경 실패' });
  }
});

// Delete menu item
router.delete('/menus/:id', (req, res) => {
  try {
    const { id } = req.params;
    query.run('DELETE FROM menu_items WHERE id = ?', Number(id));
    res.json({ success: true, message: '메뉴가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '메뉴 삭제 실패' });
  }
});

export default router;
