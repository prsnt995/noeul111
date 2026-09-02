import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Layers,
  Menu as MenuIcon,
  FileText,
  Image as ImageIcon,
  ShoppingBag,
  FolderTree,
  ClipboardList,
  Tag,
  Star,
  Users,
  Film,
  ShieldAlert,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react';

export function AdminLayout({ children, activePage }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navGroups = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard', label: '대시보드', href: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Website Control / CMS',
      items: [
        { id: 'builder', label: '홈페이지 빌더', href: '/admin/builder', icon: Layers, badge: 'CMS' },
        { id: 'menus', label: '네비게이션 메뉴', href: '/admin/menus', icon: MenuIcon },
        { id: 'pages', label: '커스텀 페이지', href: '/admin/pages', icon: FileText },
        { id: 'banners', label: '배너 매니저', href: '/admin/banners', icon: ImageIcon },
        { id: 'media', label: '미디어 라이브러리', href: '/admin/media', icon: Film },
      ],
    },
    {
      group: 'E-Commerce Management',
      items: [
        { id: 'products', label: '상품 관리', href: '/admin/products', icon: ShoppingBag },
        { id: 'categories', label: '카테고리 관리', href: '/admin/categories', icon: FolderTree },
        { id: 'orders', label: '주문 및 배송', href: '/admin/orders', icon: ClipboardList },
        { id: 'coupons', label: '쿠폰 및 프로모션', href: '/admin/coupons', icon: Tag },
        { id: 'reviews', label: '고객 리뷰 관리', href: '/admin/reviews', icon: Star },
        { id: 'customers', label: '고객 회원 목록', href: '/admin/customers', icon: Users },
      ],
    },
    {
      group: 'Settings & Security',
      items: [
        { id: 'staff', label: '관리자 팀 & 권한', href: '/admin/staff', icon: ShieldAlert },
        { id: 'settings', label: '쇼핑몰 전체 설정', href: '/admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f4f6' }}>
      {/* Sidebar */}
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
          zIndex: 10,
        }}
      >
        {/* Brand */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.12em', color: '#ffffff' }}>
                NOEUL
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--accent-sunset)', letterSpacing: '0.05em' }}>
                CMS CONTROL
              </span>
            </div>
            <p style={{ fontSize: '0.6875rem', color: '#71717a', marginTop: '2px' }}>
              통합 웹사이트 관리 센터
            </p>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="실시간 쇼핑몰 열기"
            style={{ color: '#a1a1aa', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
          >
            <ExternalLink size={16} />
          </a>
        </div>

        {/* Navigation Groups */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {navGroups.map((grp, gIdx) => (
            <div key={gIdx} style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', display: 'block', marginBottom: '8px' }}>
                {grp.group}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id || location === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 600 : 400,
                        backgroundColor: isActive ? 'var(--accent-sunset)' : 'transparent',
                        color: isActive ? '#ffffff' : '#a1a1aa',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#1f1f23';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#a1a1aa';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Admin User Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff' }}>{user?.name || '관리자'}</p>
            <span style={{ fontSize: '0.6875rem', color: '#a1a1aa', textTransform: 'uppercase' }}>
              {user?.role || 'Admin'}
            </span>
          </div>
          <button
            onClick={logout}
            title="로그아웃"
            style={{ color: '#71717a', padding: '6px', borderRadius: '4px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <main style={{ flex: 1, padding: '36px', overflowY: 'auto', maxHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
