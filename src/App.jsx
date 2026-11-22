import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Route, Switch, useLocation } from 'wouter';

// Context Providers
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { BusyProvider } from './context/BusyContext.jsx';

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
import { TossPaymentPage, TossPaymentSuccessPage, TossPaymentFailPage } from './pages/TossPaymentPage.jsx';
import { OrderSuccessPage } from './pages/OrderSuccessPage.jsx';
import { CustomerAuthPage } from './pages/CustomerAuthPage.jsx';
import { PasswordResetPage } from './pages/PasswordResetPage.jsx';
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
// code (finding #25: 1.5MB single chunk). Lean cloth store: builder/menus/pages/languages/inventory/content removed.
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage.jsx').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx').then(m => ({ default: m.AdminDashboardPage })));
const AdminBannersPage = lazy(() => import('./pages/admin/AdminBannersPage.jsx').then(m => ({ default: m.AdminBannersPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage.jsx').then(m => ({ default: m.AdminProductsPage })));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage.jsx').then(m => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage.jsx').then(m => ({ default: m.AdminOrdersPage })));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage.jsx').then(m => ({ default: m.AdminReportsPage })));
const AdminAdsPage = lazy(() => import('./pages/admin/AdminAdsPage.jsx').then(m => ({ default: m.AdminAdsPage })));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage.jsx').then(m => ({ default: m.AdminCouponsPage })));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage.jsx').then(m => ({ default: m.AdminReviewsPage })));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage.jsx').then(m => ({ default: m.AdminCustomersPage })));
const AdminMediaPage = lazy(() => import('./pages/admin/AdminMediaPage.jsx').then(m => ({ default: m.AdminMediaPage })));
const AdminStaffPage = lazy(() => import('./pages/admin/AdminStaffPage.jsx').then(m => ({ default: m.AdminStaffPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage.jsx').then(m => ({ default: m.AdminSettingsPage })));
const AdminAuditPage = lazy(() => import('./pages/admin/AdminAuditPage.jsx').then(m => ({ default: m.AdminAuditPage })));
const AdminPrivacyPage = lazy(() => import('./pages/admin/AdminPrivacyPage.jsx').then(m => ({ default: m.AdminPrivacyPage })));
const AdminBusinessPage = lazy(() => import('./pages/admin/AdminBusinessPage.jsx').then(m => ({ default: m.AdminBusinessPage })));

const SITE_ORIGIN = 'https://www.noeul.me';
const BASE_TITLE = 'NOEUL | 노을 - Contemporary Korean Fashion';
const PAGE_META = {
  '/': ['NOEUL | 노을 - Contemporary Korean Fashion', '감각적인 실루엣과 미니멀리즘을 제안하는 프리미엄 서울 컨템포러리 패션 레이블, 노을.'],
  '/shop': ['쇼핑 | NOEUL 노을', '노을의 전체 컬렉션을 만나보세요.'],
  '/about': ['브랜드 소개 | NOEUL 노을', '노을이 추구하는 실루엣과 철학을 소개합니다.'],
  '/contact': ['고객센터 | NOEUL 노을', '주문, 배송, 교환 및 반품 문의를 남겨주세요.'],
  '/privacy': ['개인정보처리방침 | NOEUL 노을', '노을의 개인정보처리방침입니다.'],
  '/terms': ['이용약관 | NOEUL 노을', '노을 서비스 이용약관입니다.'],
  '/refund-exchange': ['교환 및 반품 | NOEUL 노을', '교환·반품 정책을 안내합니다.'],
  '/shipping': ['배송 안내 | NOEUL 노을', '배송 기간과 배송비를 안내합니다.'],
  '/cookies': ['쿠키 정책 | NOEUL 노을', '쿠키 사용에 대한 안내입니다.'],
  '/disclaimer': ['면책 고지 | NOEUL 노을', '웹사이트 정보 이용에 관한 고지입니다.'],
  '/business-info': ['사업자 정보 | NOEUL 노을', '노을의 사업자 등록 정보입니다.'],
};
// Routes that must never be indexed (private or transactional).
const NOINDEX_PREFIXES = ['/admin', '/account', '/cart', '/checkout', '/order-success', '/auth'];

function setMetaTag(selector, attr, key, content) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function syncRouteMeta(pathname) {
  if (typeof document === 'undefined') return;
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  const known = PAGE_META[path];
  const isProduct = path.startsWith('/product/');
  const isCustomPage = path.startsWith('/p/');
  const title = known?.[0]
    || (isProduct ? '상품 | NOEUL 노을' : isCustomPage ? 'NOEUL 노을' : BASE_TITLE);
  const description = known?.[1]
    || (isProduct ? '노을의 상품 상세 페이지입니다.' : '감각적인 실루엣과 미니멀리즘을 제안하는 프리미엄 서울 컨템포러리 패션 레이블, 노을.');
  const canonical = `${SITE_ORIGIN}${path === '/' ? '/' : path}`;
  const noindex = NOINDEX_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`)) || (!known && !isProduct && !isCustomPage);

  document.title = title;
  const canonicalEl = document.head.querySelector('link[rel="canonical"]');
  if (canonicalEl) canonicalEl.setAttribute('href', canonical);
  setMetaTag('meta[name="description"]', 'name', 'description', description);
  setMetaTag('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical);
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
}

function AppContent() {
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  // Check if current route is an admin page
  const isAdminRoute = location.startsWith('/admin');

  useEffect(() => {
    syncRouteMeta(location);
  }, [location]);

  return (
    <div style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', overflowX: 'clip', display: 'flex', flexDirection: 'column' }}>
      {/* Storefront Header */}
      {!isAdminRoute && (
        <Header onOpenSearch={() => setSearchOpen(true)} />
      )}

      {/* Main Page Routing */}
      <div style={{ flex: 1 }}>
        <Suspense fallback={isAdminRoute ? (
          <div className="adm-main" style={{ maxWidth: 1280, margin: '0 auto' }} aria-label="Loading admin page">
            <div className="adm-skel" style={{ height: 28, width: 240, marginBottom: 12 }} />
            <div className="adm-skel" style={{ height: 14, width: 320, marginBottom: 20 }} />
            <div style={{ display: 'grid', gap: 10 }}>
              {[0, 1, 2, 3, 4].map((i) => (<div key={i} className="adm-skel" style={{ height: 44 }} />))}
            </div>
            <p style={{ textAlign: 'center', color: '#71717a', fontSize: '0.85rem', marginTop: 16 }}>관리자 페이지 불러오는 중… Loading admin…</p>
          </div>
        ) : (
          <div className="container" style={{ textAlign: 'center', padding: '120px 0' }}><p>페이지를 불러오는 중...</p></div>
        )}>
        <Switch>
          {/* Customer Storefront Routes */}
          <Route path="/" component={HomePage} />
          <Route path="/shop" component={ShopPage} />
          <Route path="/product/:id" component={ProductDetailPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout/toss/success" component={TossPaymentSuccessPage} />
          <Route path="/checkout/toss/fail" component={TossPaymentFailPage} />
          <Route path="/checkout/toss" component={TossPaymentPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/order-success/:orderNumber" component={OrderSuccessPage} />
          <Route path="/auth" component={CustomerAuthPage} />
          <Route path="/auth/reset" component={PasswordResetPage} />
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

          {/* Admin Control Center — lean cloth store (10 routes, builder/menus/pages/languages/inventory/content removed) */}
          <Route path="/admin/login" component={AdminLoginPage} />
          <Route path="/admin" component={AdminDashboardPage} />
          <Route path="/admin/banners" component={AdminBannersPage} />
          <Route path="/admin/products" component={AdminProductsPage} />
          <Route path="/admin/categories" component={AdminCategoriesPage} />
          <Route path="/admin/orders" component={AdminOrdersPage} />
          <Route path="/admin/reports" component={AdminReportsPage} />
<Route path="/admin/ads" component={AdminAdsPage} />
          <Route path="/admin/coupons" component={AdminCouponsPage} />
          <Route path="/admin/reviews" component={AdminReviewsPage} />
          <Route path="/admin/customers" component={AdminCustomersPage} />
          <Route path="/admin/media" component={AdminMediaPage} />
          <Route path="/admin/staff" component={AdminStaffPage} />
          <Route path="/admin/settings" component={AdminSettingsPage} />
          <Route path="/admin/audit" component={AdminAuditPage} />
          <Route path="/admin/privacy" component={AdminPrivacyPage} />
          <Route path="/admin/business" component={AdminBusinessPage} />

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
              <BusyProvider>
                <AppContent />
              </BusyProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
