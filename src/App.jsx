import React, { useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';

// Context Providers
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

// Common Components
import { Header } from './components/common/Header.jsx';
import { Footer } from './components/common/Footer.jsx';
import { CartDrawer } from './components/common/CartDrawer.jsx';
import { QuickSearch } from './components/common/QuickSearch.jsx';
import { ToastContainer } from './components/common/ToastContainer.jsx';
import { RightFloatingBar } from './components/common/RightFloatingBar.jsx';

// Customer Pages
import { HomePage } from './pages/HomePage.jsx';
import { ShopPage } from './pages/ShopPage.jsx';
import { ProductDetailPage } from './pages/ProductDetailPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { OrderSuccessPage } from './pages/OrderSuccessPage.jsx';
import { CustomerAuthPage } from './pages/CustomerAuthPage.jsx';
import { CustomerAccountPage } from './pages/CustomerAccountPage.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { CustomPageView } from './pages/CustomPageView.jsx';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage.jsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx';
import { AdminWebsiteBuilderPage } from './pages/admin/AdminWebsiteBuilderPage.jsx';
import { AdminMenusPage } from './pages/admin/AdminMenusPage.jsx';
import { AdminPagesPage } from './pages/admin/AdminPagesPage.jsx';
import { AdminBannersPage } from './pages/admin/AdminBannersPage.jsx';
import { AdminProductsPage } from './pages/admin/AdminProductsPage.jsx';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage.jsx';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage.jsx';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage.jsx';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage.jsx';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage.jsx';
import { AdminMediaPage } from './pages/admin/AdminMediaPage.jsx';
import { AdminStaffPage } from './pages/admin/AdminStaffPage.jsx';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.jsx';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage.jsx';
import { AdminLanguagesPage } from './pages/admin/AdminLanguagesPage.jsx';

function AppContent() {
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  // Check if current route is an admin page
  const isAdminRoute = location.startsWith('/admin');

  return (
    <div style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Storefront Header */}
      {!isAdminRoute && (
        <Header onOpenSearch={() => setSearchOpen(true)} />
      )}

      {/* Main Page Routing */}
      <div style={{ flex: 1 }}>
        <Switch>
          {/* Customer Storefront Routes */}
          <Route path="/" component={HomePage} />
          <Route path="/shop" component={ShopPage} />
          <Route path="/product/:id" component={ProductDetailPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/order-success/:orderNumber" component={OrderSuccessPage} />
          <Route path="/auth" component={CustomerAuthPage} />
          <Route path="/account" component={CustomerAccountPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/p/:slug" component={CustomPageView} />

          {/* Admin Control Center & CMS Routes */}
          <Route path="/admin/login" component={AdminLoginPage} />
          <Route path="/admin" component={AdminDashboardPage} />
          <Route path="/admin/builder" component={AdminWebsiteBuilderPage} />
          <Route path="/admin/menus" component={AdminMenusPage} />
          <Route path="/admin/pages" component={AdminPagesPage} />
          <Route path="/admin/banners" component={AdminBannersPage} />
          <Route path="/admin/products" component={AdminProductsPage} />
          <Route path="/admin/categories" component={AdminCategoriesPage} />
          <Route path="/admin/orders" component={AdminOrdersPage} />
          <Route path="/admin/inventory" component={AdminInventoryPage} />
          <Route path="/admin/languages" component={AdminLanguagesPage} />
          <Route path="/admin/coupons" component={AdminCouponsPage} />
          <Route path="/admin/reviews" component={AdminReviewsPage} />
          <Route path="/admin/customers" component={AdminCustomersPage} />
          <Route path="/admin/media" component={AdminMediaPage} />
          <Route path="/admin/staff" component={AdminStaffPage} />
          <Route path="/admin/settings" component={AdminSettingsPage} />

          {/* 404 Fallback */}
          <Route>
            <div className="container" style={{ textAlign: 'center', padding: '120px 0' }}>
              <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '12px' }}>404 - 페이지를 찾을 수 없습니다.</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
              <a href="/" className="btn-primary">홈으로 이동</a>
            </div>
          </Route>
        </Switch>
      </div>

      {/* Customer Store Footer */}
      {!isAdminRoute && <Footer />}

      {/* Korean Shopping Mall Signature Right Floating Quick Bar */}
      {!isAdminRoute && <RightFloatingBar onOpenSearch={() => setSearchOpen(true)} />}

      {/* Slide-out Cart Drawer */}
      <CartDrawer />

      {/* Live Search Modal */}
      <QuickSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Global Toast Alerts */}
      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
