import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';
import { initDatabase } from './db/database.js';

// Route Imports - Customer Storefront
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import categoriesRoutes from './routes/categories.js';
import wishlistRoutes from './routes/wishlist.js';
import contentRoutes from './routes/content.js';
import couponsRoutes from './routes/coupons.js';
import reviewsRoutes from './routes/reviews.js';

// Route Imports - Admin Management & CMS
import adminDashboardRoutes from './routes/admin/dashboard.js';
import adminProductsRoutes from './routes/admin/products.js';
import adminCategoriesRoutes from './routes/admin/categories.js';
import adminOrdersRoutes from './routes/admin/orders.js';
import adminCustomersRoutes from './routes/admin/customers.js';
import adminContentRoutes from './routes/admin/content.js';
import adminBuilderRoutes from './routes/admin/builder.js';
import adminMenusRoutes from './routes/admin/menus.js';
import adminPagesRoutes from './routes/admin/pages.js';
import adminCouponsRoutes from './routes/admin/coupons.js';
import adminReviewsRoutes from './routes/admin/reviews.js';
import adminMediaRoutes from './routes/admin/media.js';
import adminUsersRoutes from './routes/admin/users.js';
import adminUploadRoutes from './routes/admin/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory for locally uploaded product/banner images
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Request Logger
app.use((req, res, next) => {
  if (!req.url.startsWith('/assets') && !req.url.startsWith('/favicon') && !req.url.startsWith('/uploads')) {
    console.log(`[API] ${req.method} ${req.url}`);
  }
  next();
});

// Initialize Database Schema
initDatabase();

// Mount Customer APIs
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // Alias mount for direct /api/login, /api/admin-login, /api/register
app.use('/api', productsRoutes);
app.use('/api', ordersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api', contentRoutes);
app.use('/api', couponsRoutes);
app.use('/api', reviewsRoutes);

// Mount Admin APIs
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin', adminProductsRoutes);
app.use('/api/admin', adminCategoriesRoutes);
app.use('/api/admin', adminOrdersRoutes);
app.use('/api/admin', adminCustomersRoutes);
app.use('/api/admin', adminContentRoutes);
app.use('/api/admin', adminBuilderRoutes);
app.use('/api/admin', adminMenusRoutes);
app.use('/api/admin', adminPagesRoutes);
app.use('/api/admin', adminCouponsRoutes);
app.use('/api/admin', adminReviewsRoutes);
app.use('/api/admin', adminMediaRoutes);
app.use('/api/admin', adminUsersRoutes);
app.use('/api/admin', adminUploadRoutes);

// Serve static frontend in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Client-side fallback routing
app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API 엔드포인트를 찾을 수 없습니다.' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: '서버 내부 오류가 발생했습니다: ' + err.message });
});

// Start Server
app.listen(CONFIG.PORT, () => {
  console.log(`✨ NOEUL Backend API Server running on port ${CONFIG.PORT}`);
  console.log(`🔗 API Base: http://localhost:${CONFIG.PORT}/api`);
});
