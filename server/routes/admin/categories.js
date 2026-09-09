import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';
import { supabaseSync } from '../../lib/supabaseSync.js';

const router = express.Router();
router.use(verifyAdmin);

// List all categories with product count
router.get('/categories', (req, res) => {
  try {
    const categories = query.all(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status != 'archived'
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.id ASC
    `);

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Admin categories fetch error:', error);
    res.status(500).json({ success: false, message: '카테고리 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// Create category
router.post('/categories', (req, res) => {
  try {
    const { slug, name_ko, name_en, description_ko, description_en, image_url, sort_order = 0 } = req.body;

    if (!slug || !name_ko || !name_en) {
      return res.status(400).json({ success: false, message: '슬러그, 한글명, 영문명은 필수 항목입니다.' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    const existing = query.get('SELECT id FROM categories WHERE slug = ?', cleanSlug);
    if (existing) {
      return res.status(400).json({ success: false, message: '이미 존재하는 카테고리 슬러그입니다.' });
    }

    const result = query.run(`
      INSERT INTO categories (slug, name_ko, name_en, description_ko, description_en, image_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, cleanSlug, name_ko.trim(), name_en.trim(), description_ko || '', description_en || '', image_url || '', Number(sort_order));

    const created = query.get('SELECT * FROM categories WHERE id = ?', Number(result.lastInsertRowid));
    supabaseSync.upsertCategory(created).catch(err => console.error('Supabase category sync error:', err));
    res.status(201).json({ success: true, message: '카테고리가 생성되었습니다.', data: created });
  } catch (error) {
    console.error('Admin create category error:', error);
    res.status(500).json({ success: false, message: '카테고리 생성 중 오류가 발생했습니다: ' + error.message });
  }
});

// Update category
router.put('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { slug, name_ko, name_en, description_ko, description_en, image_url, sort_order, is_active } = req.body;

    const existing = query.get('SELECT id FROM categories WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다.' });
    }

    query.run(`
      UPDATE categories SET
        slug = ?,
        name_ko = ?,
        name_en = ?,
        description_ko = ?,
        description_en = ?,
        image_url = ?,
        sort_order = ?,
        is_active = ?
      WHERE id = ?
    `, slug, name_ko, name_en, description_ko || '', description_en || '', image_url || '', Number(sort_order || 0), is_active !== undefined ? (is_active ? 1 : 0) : 1, Number(id));

    const updated = query.get('SELECT * FROM categories WHERE id = ?', Number(id));
    supabaseSync.upsertCategory(updated).catch(err => console.error('Supabase category sync error:', err));
    res.json({ success: true, message: '카테고리가 수정되었습니다.', data: updated });
  } catch (error) {
    console.error('Admin update category error:', error);
    res.status(500).json({ success: false, message: '카테고리 수정 중 오류가 발생했습니다: ' + error.message });
  }
});

// Delete category
router.delete('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = query.get('SELECT id, name_ko FROM categories WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '카테고리를 찾을 수 없습니다.' });
    }

    // Check if products exist in category
    const hasProducts = query.get('SELECT id FROM products WHERE category_id = ?', Number(id));
    if (hasProducts) {
      return res.status(400).json({ success: false, message: '이 카테고리에 속한 상품이 존재하여 삭제할 수 없습니다. 먼저 상품의 카테고리를 변경해주세요.' });
    }

    query.run('DELETE FROM categories WHERE id = ?', Number(id));
    res.json({ success: true, message: `[${existing.name_ko}] 카테고리가 삭제되었습니다.` });
  } catch (error) {
    console.error('Admin delete category error:', error);
    res.status(500).json({ success: false, message: '카테고리 삭제 중 오류가 발생했습니다.' });
  }
});

export default router;
