import express from 'express';
import { query } from '../../db/database.js';
import { verifyAdmin } from '../../middleware/auth.js';

const router = express.Router();
router.use(verifyAdmin);

// Dashboard Overview Analytics
router.get('/dashboard/stats', (req, res) => {
  try {
    // 1. Total Revenue
    const revenueRow = query.get(`
      SELECT SUM(total_amount) as total_revenue
      FROM orders
      WHERE payment_status = 'paid' AND order_status != 'cancelled' AND order_status != 'refunded'
    `);
    const totalRevenue = Number(revenueRow?.total_revenue || 0);

    // 2. Today's Sales
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRow = query.get(`
      SELECT SUM(total_amount) as today_sales, COUNT(*) as today_orders
      FROM orders
      WHERE date(created_at) = date(?) AND payment_status = 'paid' AND order_status != 'cancelled'
    `, todayStr);
    const todaySales = Number(todayRow?.today_sales || 0);
    const todayOrders = Number(todayRow?.today_orders || 0);

    // 3. Total Counts & Specific Stats
    const totalProducts = Number(query.get("SELECT COUNT(*) as count FROM products WHERE status != 'archived'")?.count || 0);
    const womensProducts = Number(query.get("SELECT COUNT(*) as count FROM products WHERE (gender = 'women' OR category_id IN (SELECT id FROM categories WHERE slug = 'women')) AND status != 'archived'")?.count || 0);
    const newArrivalsCount = Number(query.get("SELECT COUNT(*) as count FROM products WHERE is_new = 1 AND status != 'archived'")?.count || 0);
    const totalCustomers = Number(query.get("SELECT COUNT(*) as count FROM users WHERE role = 'customer'")?.count || 0);
    const totalOrders = Number(query.get("SELECT COUNT(*) as count FROM orders")?.count || 0);

    // 4. Orders by Status breakdown
    const statusRows = query.all(`
      SELECT order_status, COUNT(*) as count
      FROM orders
      GROUP BY order_status
    `);
    const orderStatuses = {
      pending: 0,
      pending_verification: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0
    };
    statusRows.forEach(r => {
      if (orderStatuses.hasOwnProperty(r.order_status)) {
        orderStatuses[r.order_status] = Number(r.count);
      }
    });

    const pendingOrdersCount = (orderStatuses.pending || 0) + (orderStatuses.pending_verification || 0);
    const completedOrdersCount = (orderStatuses.delivered || 0) + (orderStatuses.confirmed || 0);

    // 5. Low Stock Products (< 15 items)
    const lowStockItems = query.all(`
      SELECT id, sku, name_ko, name_en, stock, price, images
      FROM products
      WHERE stock <= 15 AND status = 'active'
      ORDER BY stock ASC
      LIMIT 10
    `).map(p => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : p.images
    }));

    const lowStockCount = Number(query.get("SELECT COUNT(*) as count FROM products WHERE stock <= 15 AND status = 'active'")?.count || 0);

    // 6. Recent 8 Orders
    const recentOrders = query.all(`
      SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 8
    `);

    // 7. Recent Sales Trend
    const salesTrend = query.all(`
      SELECT date(created_at) as order_date,
             SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN total_amount ELSE 0 END) as sales,
             COUNT(*) as order_count
      FROM orders
      GROUP BY date(created_at)
      ORDER BY order_date ASC
      LIMIT 14
    `);

    res.json({
      success: true,
      stats: {
        totalRevenue,
        todaySales,
        todayOrders,
        totalProducts,
        womensProducts,
        newArrivalsCount,
        totalCustomers,
        totalOrders,
        pendingOrdersCount,
        completedOrdersCount,
        orderStatuses,
        lowStockCount
      },
      lowStockItems,
      recentOrders,
      salesTrend
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ success: false, message: '대시보드 통계를 불러오는 중 오류가 발생했습니다: ' + error.message });
  }
});

export default router;
