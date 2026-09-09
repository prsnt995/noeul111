import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

// Ensure db directory exists
const dbDir = path.dirname(CONFIG.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(CONFIG.DB_PATH);

// Helper wrapper to provide convenient query methods
export const query = {
  exec: (sql) => db.exec(sql),
  all: (sql, ...params) => db.prepare(sql).all(...params),
  get: (sql, ...params) => db.prepare(sql).get(...params),
  run: (sql, ...params) => db.prepare(sql).run(...params),
};

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      postal_code TEXT,
      address TEXT,
      detail_address TEXT,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER REFERENCES categories(id),
      slug TEXT UNIQUE NOT NULL,
      name_ko TEXT NOT NULL,
      name_en TEXT NOT NULL,
      description_ko TEXT,
      description_en TEXT,
      image_url TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      name_ko TEXT NOT NULL,
      name_en TEXT NOT NULL,
      description_ko TEXT,
      description_en TEXT,
      price INTEGER NOT NULL,
      discount_price INTEGER,
      discount_rate INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      is_best INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      images TEXT NOT NULL,
      sizes TEXT NOT NULL,
      colors TEXT NOT NULL,
      details TEXT,
      views INTEGER DEFAULT 0,
      sales_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      address TEXT NOT NULL,
      detail_address TEXT,
      shipping_memo TEXT,
      subtotal INTEGER NOT NULL,
      discount_amount INTEGER DEFAULT 0,
      coupon_code TEXT,
      shipping_fee INTEGER DEFAULT 0,
      total_amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'paid',
      order_status TEXT DEFAULT 'confirmed',
      courier_name TEXT,
      tracking_number TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name_ko TEXT NOT NULL,
      product_name_en TEXT NOT NULL,
      product_sku TEXT,
      image_url TEXT,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      size TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title_ko TEXT NOT NULL,
      title_en TEXT NOT NULL,
      subtitle_ko TEXT,
      subtitle_en TEXT,
      image_url TEXT,
      mobile_image_url TEXT,
      link_url TEXT,
      button_text_ko TEXT,
      button_text_en TEXT,
      start_date DATE,
      end_date DATE,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS homepage_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      title_ko TEXT NOT NULL,
      title_en TEXT NOT NULL,
      subtitle_ko TEXT,
      subtitle_en TEXT,
      content_json TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_draft INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
      title_ko TEXT NOT NULL,
      title_en TEXT NOT NULL,
      link_type TEXT DEFAULT 'custom',
      link_value TEXT NOT NULL,
      badge_tag TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title_ko TEXT NOT NULL,
      title_en TEXT NOT NULL,
      banner_image TEXT,
      content_ko TEXT NOT NULL,
      content_en TEXT NOT NULL,
      meta_title TEXT,
      meta_description TEXT,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      description_ko TEXT NOT NULL,
      description_en TEXT NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value INTEGER NOT NULL,
      min_order_amount INTEGER DEFAULT 0,
      max_discount_amount INTEGER,
      start_date DATE,
      end_date DATE,
      usage_limit INTEGER DEFAULT 1000,
      times_used INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title TEXT,
      comment TEXT NOT NULL,
      image_url TEXT,
      is_approved INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      file_type TEXT DEFAULT 'image',
      size_bytes INTEGER DEFAULT 0,
      alt_text TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe migrations for table columns
  try {
    db.exec('ALTER TABLE products ADD COLUMN is_featured INTEGER DEFAULT 0');
  } catch {}
  try {
    db.exec('ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0');
  } catch {}
  try {
    db.exec('ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id)');
  } catch {}
  try {
    db.exec('ALTER TABLE banners ADD COLUMN mobile_image_url TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE banners ADD COLUMN start_date DATE');
  } catch {}
  try {
    db.exec('ALTER TABLE banners ADD COLUMN end_date DATE');
  } catch {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN payment_receipt_url TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN payment_sender_name TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN receipt_uploaded_at DATETIME');
  } catch {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN payment_verified_at DATETIME');
  } catch {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN payment_verified_by TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN payment_admin_notes TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN coupon_code TEXT');
  } catch {}
  try {
    db.exec("ALTER TABLE products ADD COLUMN gender TEXT DEFAULT 'unisex'");
  } catch {}
  try {
    db.exec('ALTER TABLE products ADD COLUMN subcategory TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE products ADD COLUMN material TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE products ADD COLUMN color_name TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE products ADD COLUMN is_sale INTEGER DEFAULT 0');
  } catch {}
  try {
    db.exec('ALTER TABLE products ADD COLUMN material_ko TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE products ADD COLUMN material_en TEXT');
  } catch {}

  // Ensure default categories exist
  try {
    const socksCat = query.get("SELECT id FROM categories WHERE slug = 'socks'");
    if (!socksCat) {
      query.run(`
        INSERT INTO categories (slug, name_ko, name_en, description_ko, description_en, image_url, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, 'socks', '양말/삭스', 'Socks', '프리미엄 코튼 및 데일리 삭스 컬렉션', 'Premium cotton and daily socks collection', 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?q=80&w=900&auto=format&fit=crop', 9);
    }
  } catch {}
}
