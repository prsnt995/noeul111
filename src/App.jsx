import React, { useState, Suspense, lazy } from 'react';
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
import { CookieConsentBanner } from './components/common/CookieConsentBanner.jsx';

// Customer Pages
import { HomePage } from './pages/HomePage.jsx';
import { ShopPage } from './pages/ShopPage.jsx';
import { ProductDetailPage } from './pages/ProductDetailPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { OrderSuccessPage } from './pages/OrderSuccessPage.jsx';
import { CustomerAuthPage } from './pages/CustomerAuthPage.jsx';
import { AuthCallbackPage } from './pages/AuthCallbackPage.jsx';
import { CustomerAccountPage } from './pages/CustomerAccountPage.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { CustomPageView } from './pages/CustomPageView.jsx';

// Legal & Policy Pages
import { PrivacyPage } from './pages/policy/PrivacyPage.jsx';
import { TermsPage } from './pages/policy/TermsPage.jsx';
import { RefundExchangePage } from './pages/policy/RefundExchangePage.jsx';
import { ShippingPage } from './pages/policy/ShippingPage.jsx';
import { CookiePolicyPage } from './pages/policy/CookiePolicyPage.jsx';
import { DisclaimerPage } from './pages/policy/DisclaimerPage.jsx';
import { BusinessInfoPage } from './pages/policy/BusinessInfoPage.jsx';
import { ContactPage } from './pages/policy/ContactPage.jsx';

// Admin Pages — route-split so the storefront bundle excludes back-office
// code (finding #25: 1.5MB single chunk). Loaded on first /admin visit.
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage.jsx').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx').then(m => ({ default: m.AdminDashboardPage })));
const AdminWebsiteBuilderPage = lazy(() => import('./pages/admin/AdminWebsiteBuilderPage.jsx').then(m => ({ default: m.AdminWebsiteBuilderPage })));
const AdminMenusPage = lazy(() => import('./pages/admin/AdminMenusPage.jsx').then(m => ({ default: m.AdminMenusPage })));
const AdminPagesPage = lazy(() => import('./pages/admin/AdminPagesPage.jsx').then(m => ({ default: m.AdminPagesPage })));
const AdminBannersPage = lazy(() => import('./pages/admin/AdminBannersPage.jsx').then(m => ({ default: m.AdminBannersPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage.jsx').then(m => ({ default: m.AdminProductsPage })));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage.jsx').then(m => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage.jsx').then(m => ({ default: m.AdminOrdersPage })));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage.jsx').then(m => ({ default: m.AdminCouponsPage })));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage.jsx').then(m => ({ default: m.AdminReviewsPage })));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage.jsx').then(m => ({ default: m.AdminCustomersPage })));
const AdminMediaPage = lazy(() => import('./pages/admin/AdminMediaPage.jsx').then(m => ({ default: m.AdminMediaPage })));
const AdminStaffPage = lazy(() => import('./pages/admin/AdminStaffPage.jsx').then(m => ({ default: m.AdminStaffPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage.jsx').then(m => ({ default: m.AdminSettingsPage })));
const AdminInventoryPage = lazy(() => import('./pages/admin/AdminInventoryPage.jsx').then(m => ({ default: m.AdminInventoryPage })));
const AdminLanguagesPage = lazy(() => import('./pages/admin/AdminLanguagesPage.jsx').then(m => ({ default: m.AdminLanguagesPage })));
const AdminContentPage = lazy(() => import('./pages/admin/AdminContentPage.jsx').then(m => ({ default: m.AdminContentPage })));

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
        <Suspense fallback={<div className="container" style={{ textAlign: 'center', padding: '120px 0' }}><p>페이지를 불러오는 중...</p></div>}>
        <Switch>
          {/* Customer Storefront Routes */}
          <Route path="/" component={HomePage} />
          <Route path="/shop" component={ShopPage} />
          <Route path="/product/:id" component={ProductDetailPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/order-success/:orderNumber" component={OrderSuccessPage} />
          <Route path="/auth" component={CustomerAuthPage} />
          <Route path="/auth/callback" component={AuthCallbackPage} />
          <Route path="/account" component={CustomerAccountPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/refund-exchange" component={RefundExchangePage} />
          <Route path="/shipping" component={ShippingPage} />
          <Route path="/cookies" component={CookiePolicyPage} />
          <Route path="/disclaimer" component={DisclaimerPage} />
          <Route path="/business-info" component={BusinessInfoPage} />
          <Route path="/contact" component={ContactPage} />
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
          <Route path="/admin/content" component={AdminContentPage} />
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
        </Suspense>
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
      <CookieConsentBanner />
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
