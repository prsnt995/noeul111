import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';

const router = express.Router();
router.use(verifyAdmin);

function parseProduct(p) {
  if (!p) return null;
  return {
    ...p,
    images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : p.images,
    sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes || '[]') : p.sizes,
    colors: typeof p.colors === 'string' ? JSON.parse(p.colors || '[]') : p.colors,
    details: typeof p.details === 'string' ? JSON.parse(p.details || '{}') : p.details,
    is_new: Boolean(p.is_new),
    is_best: Boolean(p.is_best),
    is_featured: Boolean(p.is_featured),
  };
}

// List all products for admin
router.get('/products', (req, res) => {
  try {
    const { category, search, stockStatus, status, sort } = req.query;

    let sql = `
      SELECT p.*, c.name_ko as category_name_ko, c.name_en as category_name_en
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND (p.category_id = ? OR c.slug = ?)';
      params.push(category, category);
    }

    if (search) {
      sql += ' AND (p.name_ko LIKE ? OR p.name_en LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (stockStatus === 'low') {
      sql += ' AND p.stock > 0 AND p.stock <= 15';
    } else if (stockStatus === 'out') {
      sql += ' AND p.stock = 0';
    } else if (stockStatus === 'in') {
      sql += ' AND p.stock > 15';
    }

    if (status && status !== 'all') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.display_order ASC, p.id DESC';

    const rows = query.all(sql, ...params);
    res.json({ success: true, count: rows.length, data: rows.map(parseProduct) });
  } catch (error) {
    console.error('Admin products fetch error:', error);
    res.status(500).json({ success: false, message: '상품 목록을 불러오지 못했습니다.' });
  }
});

// Create product
router.post('/products', (req, res) => {
  try {
    const {
      sku, category_id, name_ko, name_en, description_ko, description_en,
      price, discount_price, stock, is_new, is_best, is_featured, display_order, status,
      images, sizes, colors, details
    } = req.body;

    if (!name_ko || !category_id || !price) {
      return res.status(400).json({ success: false, message: '상품명, 카테고리, 판매가는 필수입니다.' });
    }

    const finalSku = sku || `NE-${Date.now().toString().slice(-6)}`;
    const finalPrice = Number(price);
    const finalDiscountPrice = discount_price ? Number(discount_price) : null;
    const discountRate = finalDiscountPrice && finalDiscountPrice < finalPrice
      ? Math.round(((finalPrice - finalDiscountPrice) / finalPrice) * 100)
      : 0;

    const result = query.run(`
      INSERT INTO products (
        sku, category_id, name_ko, name_en, description_ko, description_en,
        price, discount_price, discount_rate, stock, is_new, is_best, is_featured, display_order, status,
        images, sizes, colors, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      finalSku,
      Number(category_id),
      name_ko.trim(),
      name_en ? name_en.trim() : name_ko.trim(),
      description_ko || '',
      description_en || '',
      finalPrice,
      finalDiscountPrice,
      discountRate,
      Number(stock || 0),
      is_new ? 1 : 0,
      is_best ? 1 : 0,
      is_featured ? 1 : 0,
      Number(display_order || 0),
      status || 'active',
      JSON.stringify(images || []),
      JSON.stringify(sizes || ['FREE']),
      JSON.stringify(colors || []),
      JSON.stringify(details || {})
    );

    const created = query.get('SELECT * FROM products WHERE id = ?', Number(result.lastInsertRowid));
    res.status(201).json({ success: true, message: '새 상품이 등록되었습니다.', data: parseProduct(created) });
  } catch (error) {
    console.error('Admin create product error:', error);
    res.status(500).json({ success: false, message: '상품 등록 실패: ' + error.message });
  }
});

// Duplicate product
router.post('/products/:id/duplicate', (req, res) => {
  try {
    const { id } = req.params;
    const original = query.get('SELECT * FROM products WHERE id = ?', Number(id));
    if (!original) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }

    const newSku = `${original.sku}-COPY-${Date.now().toString().slice(-4)}`;
    const newNameKo = `${original.name_ko} (복사본)`;
    const newNameEn = `${original.name_en} (Copy)`;

    const result = query.run(`
      INSERT INTO products (
        sku, category_id, name_ko, name_en, description_ko, description_en,
        price, discount_price, discount_rate, stock, is_new, is_best, is_featured, display_order, status,
        images, sizes, colors, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)
    `,
      newSku,
      original.category_id,
      newNameKo,
      newNameEn,
      original.description_ko,
      original.description_en,
      original.price,
      original.discount_price,
      original.discount_rate,
      original.stock,
      original.is_new,
      original.is_best,
      original.is_featured,
      original.display_order,
      original.images,
      original.sizes,
      original.colors,
      original.details
    );

    const created = query.get('SELECT * FROM products WHERE id = ?', Number(result.lastInsertRowid));
    res.status(201).json({ success: true, message: '상품이 복제되었습니다.', data: parseProduct(created) });
  } catch (error) {
    console.error('Duplicate product error:', error);
    res.status(500).json({ success: false, message: '상품 복제 실패' });
  }
});

// Update product
router.put('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      sku, category_id, name_ko, name_en, description_ko, description_en,
      price, discount_price, stock, is_new, is_best, is_featured, display_order, status,
      images, sizes, colors, details
    } = req.body;

    const existing = query.get('SELECT id FROM products WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }

    const finalPrice = Number(price);
    const finalDiscountPrice = discount_price ? Number(discount_price) : null;
    const discountRate = finalDiscountPrice && finalDiscountPrice < finalPrice
      ? Math.round(((finalPrice - finalDiscountPrice) / finalPrice) * 100)
      : 0;

    query.run(`
      UPDATE products SET
        sku = ?,
        category_id = ?,
        name_ko = ?,
        name_en = ?,
        description_ko = ?,
        description_en = ?,
        price = ?,
        discount_price = ?,
        discount_rate = ?,
        stock = ?,
        is_new = ?,
        is_best = ?,
        is_featured = ?,
        display_order = ?,
        status = ?,
        images = ?,
        sizes = ?,
        colors = ?,
        details = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      sku,
      Number(category_id),
      name_ko.trim(),
      name_en ? name_en.trim() : name_ko.trim(),
      description_ko || '',
      description_en || '',
      finalPrice,
      finalDiscountPrice,
      discountRate,
      Number(stock || 0),
      is_new ? 1 : 0,
      is_best ? 1 : 0,
      is_featured ? 1 : 0,
      Number(display_order || 0),
      status || 'active',
      JSON.stringify(images || []),
      JSON.stringify(sizes || ['FREE']),
      JSON.stringify(colors || []),
      JSON.stringify(details || {}),
      Number(id)
    );

    const updated = query.get('SELECT * FROM products WHERE id = ?', Number(id));
    res.json({ success: true, message: '상품 정보가 수정되었습니다.', data: parseProduct(updated) });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: '상품 수정 실패: ' + error.message });
  }
});

// Quick Stock Adjustment
router.patch('/products/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { delta, newStock } = req.body;

    const prod = query.get('SELECT id, stock FROM products WHERE id = ?', Number(id));
    if (!prod) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }

    let calculatedStock = prod.stock;
    if (newStock !== undefined) {
      calculatedStock = Math.max(0, Number(newStock));
    } else if (delta !== undefined) {
      calculatedStock = Math.max(0, prod.stock + Number(delta));
    }

    query.run('UPDATE products SET stock = ? WHERE id = ?', calculatedStock, Number(id));
    res.json({ success: true, message: '재고가 변경되었습니다.', stock: calculatedStock });
  } catch (error) {
    res.status(500).json({ success: false, message: '재고 변경 실패' });
  }
});

// Toggle featured
router.patch('/products/:id/featured', (req, res) => {
  try {
    const { id } = req.params;
    const prod = query.get('SELECT is_featured FROM products WHERE id = ?', Number(id));
    const newFeatured = prod.is_featured ? 0 : 1;
    query.run('UPDATE products SET is_featured = ? WHERE id = ?', newFeatured, Number(id));
    res.json({ success: true, is_featured: Boolean(newFeatured) });
  } catch (error) {
    res.status(500).json({ success: false, message: '추천 상태 변경 실패' });
  }
});

// Delete product
router.delete('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    query.run('DELETE FROM products WHERE id = ?', Number(id));
    res.json({ success: true, message: '상품이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '상품 삭제 실패' });
  }
});

export default router;
