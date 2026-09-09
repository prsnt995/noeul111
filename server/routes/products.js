import express from 'express';
import { query } from '../db/database.js';

const router = express.Router();

function parseProduct(p) {
  if (!p) return null;
  const parsedColors = typeof p.colors === 'string' ? JSON.parse(p.colors || '[]') : (p.colors || []);
  const parsedDetails = typeof p.details === 'string' ? JSON.parse(p.details || '{}') : (p.details || {});
  
  return {
    ...p,
    gender: p.gender || 'unisex',
    subcategory: p.subcategory || p.category_slug || 'tshirts',
    color: p.color_name || (Array.isArray(parsedColors) && parsedColors[0] ? (parsedColors[0].name_en || parsedColors[0].name_ko) : 'Black'),
    material: p.material || parsedDetails.fabric || parsedDetails.fabric_ko || '100% Cotton',
    images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []),
    sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes || '[]') : (p.sizes || ['S', 'M', 'L', 'XL']),
    colors: parsedColors,
    details: parsedDetails,
    is_new: Boolean(p.is_new),
    is_best: Boolean(p.is_best),
  };
}

// Get all active categories
router.get('/categories', (req, res) => {
  try {
    const categories = query.all('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC');
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ success: false, message: '카테고리를 불러오는 중 오류가 발생했습니다.' });
  }
});

// Get products list with comprehensive filtering and sorting
router.get('/products', (req, res) => {
  try {
    const {
      gender,
      category,
      subcategory,
      search,
      minPrice,
      maxPrice,
      size,
      color,
      isNew,
      isBest,
      inStock,
      sort = 'newest',
      limit = 100,
      offset = 0
    } = req.query;

    let sql = `
      SELECT p.*, c.slug as category_slug, c.name_ko as category_name_ko, c.name_en as category_name_en
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
    `;
    const params = [];

    // Gender filter (men / women / unisex)
    if (gender && gender !== 'all') {
      const g = gender.toLowerCase();
      if (g === 'men') {
        sql += " AND (p.gender = 'men' OR p.gender = 'unisex' OR p.gender IS NULL)";
      } else if (g === 'women') {
        sql += " AND (p.gender = 'women' OR p.gender = 'unisex' OR p.gender IS NULL)";
      } else {
        sql += ' AND p.gender = ?';
        params.push(g);
      }
    }

    // Category / Subcategory filter (matches slug, subcategory, or category_id)
    if (category && category !== 'all') {
      const catVal = category.toLowerCase();
      sql += ' AND (LOWER(c.slug) = ? OR LOWER(COALESCE(p.subcategory, \'\')) = ? OR p.category_id = ?)';
      params.push(catVal, catVal, isNaN(Number(category)) ? -1 : Number(category));
    }

    if (subcategory && subcategory !== 'all') {
      sql += ' AND LOWER(COALESCE(p.subcategory, \'\')) = ?';
      params.push(subcategory.toLowerCase());
    }

    // Comprehensive search query (Name, SKU, Color, Material, Subcategory, Category)
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (
        LOWER(p.name_ko) LIKE ? OR 
        LOWER(p.name_en) LIKE ? OR 
        LOWER(p.sku) LIKE ? OR 
        LOWER(COALESCE(p.material, '')) LIKE ? OR 
        LOWER(COALESCE(p.color_name, '')) LIKE ? OR 
        LOWER(COALESCE(p.subcategory, '')) LIKE ? OR 
        LOWER(COALESCE(c.slug, '')) LIKE ? OR
        LOWER(COALESCE(c.name_en, '')) LIKE ? OR
        LOWER(COALESCE(c.name_ko, '')) LIKE ?
      )`;
      params.push(term, term, term, term, term, term, term, term, term);
    }

    // Price range
    if (minPrice) {
      sql += ' AND (COALESCE(p.discount_price, p.price) >= ?)';
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      sql += ' AND (COALESCE(p.discount_price, p.price) <= ?)';
      params.push(Number(maxPrice));
    }

    // Badges
    if (isNew === 'true' || isNew === '1') {
      sql += ' AND p.is_new = 1';
    }
    if (isBest === 'true' || isBest === '1') {
      sql += ' AND p.is_best = 1';
    }
    if (inStock === 'true' || inStock === '1') {
      sql += ' AND p.stock > 0';
    }

    // Size filter (JSON search)
    if (size) {
      sql += ' AND p.sizes LIKE ?';
      params.push(`%"${size}"%`);
    }

    // Color filter (JSON search)
    if (color) {
      sql += ' AND (p.colors LIKE ? OR p.colors LIKE ?)';
      params.push(`%${color}%`, `%${color}%`);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY COALESCE(p.discount_price, p.price) ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY COALESCE(p.discount_price, p.price) DESC';
        break;
      case 'popular':
      case 'views':
        sql += ' ORDER BY p.views DESC, p.id DESC';
        break;
      case 'sales':
      case 'best':
        sql += ' ORDER BY p.sales_count DESC, p.id DESC';
        break;
      case 'newest':
      default:
        sql += ' ORDER BY p.is_new DESC, p.created_at DESC, p.id DESC';
        break;
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const rows = query.all(sql, ...params);
    const parsedProducts = rows.map(parseProduct);

    res.json({
      success: true,
      data: parsedProducts,
      total: parsedProducts.length
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ success: false, message: '상품 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// Get single product details by ID or SKU
router.get('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    let product;

    if (isNaN(Number(id))) {
      product = query.get(`
        SELECT p.*, c.slug as category_slug, c.name_ko as category_name_ko, c.name_en as category_name_en
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.sku = ?
      `, id);
    } else {
      product = query.get(`
        SELECT p.*, c.slug as category_slug, c.name_ko as category_name_ko, c.name_en as category_name_en
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `, Number(id));
    }

    if (!product) {
      return res.status(404).json({ success: false, message: '존재하지 않거나 삭제된 상품입니다.' });
    }

    // Increment view count asynchronously
    query.run('UPDATE products SET views = views + 1 WHERE id = ?', product.id);

    // Get related products in same category
    const relatedRows = query.all(`
      SELECT p.*, c.slug as category_slug, c.name_ko as category_name_ko, c.name_en as category_name_en
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ? AND p.status = 'active'
      ORDER BY p.sales_count DESC, p.views DESC
      LIMIT 4
    `, product.category_id, product.id);

    res.json({
      success: true,
      data: parseProduct(product),
      related: relatedRows.map(parseProduct)
    });
  } catch (error) {
    console.error('Product detail fetch error:', error);
    res.status(500).json({ success: false, message: '상품 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

export default router;
