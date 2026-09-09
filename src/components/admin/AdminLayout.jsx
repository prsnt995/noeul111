import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Users,
  FolderTree,
  Boxes,
  Globe,
  Settings,
  Layers,
  Menu as MenuIcon,
  FileText,
  Image as ImageIcon,
  Tag,
  Star,
  Film,
  ShieldAlert,
  LogOut,
  ExternalLink,
  X,
} from 'lucide-react';

export function AdminLayout({ children, activePage }) {
  const { adminUser, adminLogout, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Security guard check
  useEffect(() => {
    const adminToken = localStorage.getItem('noeul_admin_token');
    if (!adminToken && location !== '/admin/login') {
      setLocation('/admin/login');
    }
  }, [location, setLocation]);

  // Main 8 required admin sidebar navigation items + CMS sub-navigation
  const mainNavItems = [
    { id: 'dashboard', label: '대시보드 (Dashboard)', href: '/admin', icon: LayoutDashboard },
    { id: 'products', label: '상품 관리 (Products)', href: '/admin/products', icon: ShoppingBag },
    { id: 'orders', label: '주문 관리 (Orders)', href: '/admin/orders', icon: ClipboardList },
    { id: 'customers', label: '고객 관리 (Customers)', href: '/admin/customers', icon: Users },
    { id: 'categories', label: '카테고리 (Categories)', href: '/admin/categories', icon: FolderTree },
    { id: 'inventory', label: '재고 관리 (Inventory)', href: '/admin/inventory', icon: Boxes },
    { id: 'languages', label: '언어 관리 (Languages)', href: '/admin/languages', icon: Globe },
    { id: 'settings', label: '환경 설정 (Settings)', href: '/admin/settings', icon: Settings },
  ];

  const cmsNavItems = [
    { id: 'builder', label: '홈페이지 빌더', href: '/admin/builder', icon: Layers },
    { id: 'menus', label: '네비게이션 메뉴', href: '/admin/menus', icon: MenuIcon },
    { id: 'pages', label: '커스텀 페이지', href: '/admin/pages', icon: FileText },
    { id: 'banners', label: '배너 매니저', href: '/admin/banners', icon: ImageIcon },
    { id: 'media', label: '미디어 라이브러리', href: '/admin/media', icon: Film },
    { id: 'coupons', label: '쿠폰 및 프로모션', href: '/admin/coupons', icon: Tag },
    { id: 'reviews', label: '고객 리뷰 관리', href: '/admin/reviews', icon: Star },
    { id: 'staff', label: '관리자 권한', href: '/admin/staff', icon: ShieldAlert },
  ];

  const renderNavList = (items) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id || location === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              backgroundColor: isActive ? 'var(--accent-sunset)' : 'transparent',
              color: isActive ? '#ffffff' : '#a1a1aa',
              transition: 'all 0.15s ease',
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icon size={18} />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f4f4f6' }}>
      {/* Mobile Top Navigation Header (< 768px) */}
      <header
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          backgroundColor: '#121213',
          color: '#ffffff',
          borderBottom: '1px solid #27272a',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
        className="admin-mobile-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: '#ffffff', background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
          <span className="font-serif" style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            NOEUL ADMIN
          </span>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <span>쇼핑몰 보기</span>
          <ExternalLink size={14} />
        </a>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Desktop Sidebar & Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              zIndex: 45,
            }}
          />
        )}

        <aside
          style={{
            width: '260px',
            backgroundColor: '#121213',
            color: '#e4e4e7',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            borderRight: '1px solid #27272a',
            zIndex: 50,
            transition: 'transform 0.2s ease',
          }}
          className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}
        >
          {/* Brand */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.12em', color: '#ffffff' }}>
                  NOEUL
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-sunset)', letterSpacing: '0.05em' }}>
                  ADMIN PANEL
                </span>
              </div>
              <p style={{ fontSize: '0.6875rem', color: '#71717a', marginTop: '2px' }}>
                통합 브랜딩 & 쇼핑몰 관리
              </p>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="고객 쇼핑몰 열기"
              style={{ color: '#a1a1aa', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
            >
              <ExternalLink size={16} />
            </a>
          </div>

          {/* Navigation Groups */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', display: 'block', marginBottom: '8px' }}>
                Main Management
              </span>
              {renderNavList(mainNavItems)}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', display: 'block', marginBottom: '8px' }}>
                CMS & Content
              </span>
              {renderNavList(cmsNavItems)}
            </div>
          </div>

          {/* Admin User Footer */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff' }}>
                {adminUser?.name || '노을 관리자'}
              </p>
              <span style={{ fontSize: '0.6875rem', color: '#a1a1aa', textTransform: 'uppercase' }}>
                {adminUser?.role || 'System Admin'}
              </span>
            </div>
            <button
              onClick={() => {
                adminLogout();
                setLocation('/admin/login');
              }}
              title="로그아웃"
              style={{ color: '#71717a', padding: '6px', borderRadius: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            padding: '32px',
            overflowY: 'auto',
            maxHeight: '100vh',
            width: '100%',
            maxWidth: '100%',
          }}
          className="admin-main-content"
        >
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .admin-mobile-header {
            display: flex !important;
          }
          .admin-sidebar {
            position: fixed !important;
            left: 0;
            top: 53px;
            bottom: 0;
            height: calc(100vh - 53px) !important;
            transform: translateX(-100%);
            z-index: 50 !important;
          }
          .admin-sidebar.open {
            transform: translateX(0) !important;
          }
          .admin-main-content {
            padding: 16px !important;
            maxHeight: none !important;
          }
        }
      `}</style>
    </div>
  );
}

