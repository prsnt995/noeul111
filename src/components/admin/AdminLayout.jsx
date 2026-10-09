import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext.jsx';
import { DashboardSkeleton } from './AdminSkeleton.jsx';
import { CommandPalette } from './ui/CommandPalette.jsx';
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  BarChart3,
  Users,
  FolderTree,
  Settings,
  Image as ImageIcon,
  Tag,
  Star,
  Film,
  ShieldAlert,
  LogOut,
  ExternalLink,
  Menu as MenuIcon,
  X,
  Search,
  ChevronsLeft,
  ScrollText,
  KeyRound,
  FileSpreadsheet,
} from 'lucide-react';

// New IA: 5 ERP sections, bilingual labels kept as 한국어 (English).
const NAV_SECTIONS = [
  {
    id: 'overview',
    ko: '개요',
    en: 'Overview',
    items: [
      { id: 'dashboard', ko: '대시보드', en: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { id: 'business', ko: '경영 관리 (Excel)', en: 'Business (Excel)', href: '/admin/business', icon: FileSpreadsheet },
      { id: 'reports', ko: '매출 리포트', en: 'Reports', href: '/admin/reports', icon: BarChart3 },
      { id: 'audit', ko: '감사 로그', en: 'Audit', href: '/admin/audit', icon: ScrollText },
    ],
  },
  {
    id: 'commerce',
    ko: '커머스',
    en: 'Commerce',
    items: [
      { id: 'orders', ko: '주문 관리', en: 'Orders', href: '/admin/orders', icon: ClipboardList },
      { id: 'products', ko: '상품 관리', en: 'Products', href: '/admin/products', icon: ShoppingBag },
      { id: 'categories', ko: '카테고리', en: 'Categories', href: '/admin/categories', icon: FolderTree },
      { id: 'coupons', ko: '쿠폰 및 프로모션', en: 'Coupons', href: '/admin/coupons', icon: Tag },
      { id: 'reviews', ko: '고객 리뷰 관리', en: 'Reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    id: 'customers',
    ko: '고객',
    en: 'Customers',
    items: [
      { id: 'customers', ko: '고객 관리', en: 'Customers', href: '/admin/customers', icon: Users },
      { id: 'privacy', ko: '개인정보 요청', en: 'Privacy', href: '/admin/privacy', icon: KeyRound },
    ],
  },
  {
    id: 'content',
    ko: '콘텐츠',
    en: 'Content',
    items: [
      { id: 'banners', ko: '배너 매니저', en: 'Banners', href: '/admin/banners', icon: ImageIcon },
      { id: 'media', ko: '미디어 라이브러리', en: 'Media', href: '/admin/media', icon: Film },
    ],
  },
  {
    id: 'system',
    ko: '시스템',
    en: 'System',
    items: [
      { id: 'settings', ko: '환경 설정', en: 'Settings', href: '/admin/settings', icon: Settings },
      { id: 'staff', ko: '관리자 권한', en: 'Staff', href: '/admin/staff', icon: ShieldAlert },
    ],
  },
];

const ALL_ITEMS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s })));

function routeIdFromLocation(location, activePage) {
  if (activePage) return activePage;
  const found = ALL_ITEMS.find((i) => i.href === location);
  if (found) return found.id;
  if (location.startsWith('/admin/orders')) return 'orders';
  if (location.startsWith('/admin/products')) return 'products';
  if (location.startsWith('/admin/customers')) return 'customers';
  if (location.startsWith('/admin/business')) return 'business';
  return 'dashboard';
}

export function AdminLayout({ children, activePage, crumbs }) {
  const { adminUser, adminLogout, isAdmin, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('noeul:admin:nav') === 'collapsed'; } catch { return false; }
  });

  // Security guard — wait for auth load, then redirect; never flash protected UI.
  useEffect(() => {
    if (!loading && !isAdmin && location !== '/admin/login') {
      setLocation('/admin/login');
    }
  }, [loading, isAdmin, location, setLocation]);

  useEffect(() => {
    try { localStorage.setItem('noeul:admin:nav', collapsed ? 'collapsed' : 'open'); } catch {}
  }, [collapsed]);

  // Global Cmd+K
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const activeId = routeIdFromLocation(location, activePage);
  const activeItem = ALL_ITEMS.find((i) => i.id === activeId);

  const autoCrumbs = useMemo(() => {
    if (crumbs) return crumbs;
    if (!activeItem) return [{ label: 'Admin' }];
    return [
      { label: `${activeItem.section.ko} ${activeItem.section.en}` },
      { label: `${activeItem.ko} (${activeItem.en})` },
    ];
  }, [crumbs, activeItem]);

  const paletteItems = useMemo(
    () => ALL_ITEMS.map((i) => ({ id: i.id, ko: i.ko, en: i.en, hint: i.href, href: i.href })),
    []
  );

  if (loading) {
    return (
      <div className="adm-shell">
        <div className="adm-main"><DashboardSkeleton /></div>
      </div>
    );
  }
  if (!isAdmin && location !== '/admin/login') {
    return (
      <div className="adm-shell">
        <div className="adm-main"><DashboardSkeleton /></div>
      </div>
    );
  }

  const initial = String(adminUser?.name || adminUser?.email || 'N').slice(0, 1).toUpperCase();

  return (
    <div className={`adm-shell${collapsed ? ' collapsed' : ''}${navOpen ? ' nav-open' : ''}`}>
      {/* Topbar */}
      <header className="adm-topbar">
        <button
          type="button"
          className="adm-icon-btn adm-mobile-menu-btn"
          onClick={() => setNavOpen((v) => !v)}
          aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
        >
          {navOpen ? <X size={18} /> : <MenuIcon size={18} />}
        </button>
        <button
          type="button"
          className="adm-icon-btn"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ display: 'inline-flex' }}
        >
          <ChevronsLeft size={18} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }} />
        </button>
        <button type="button" className="adm-topbar-search" onClick={() => setPaletteOpen(true)} aria-label="Quick navigation (Cmd+K)">
          <Search size={15} aria-hidden />
          <span className="lbl">빠른 탐색 Search…</span>
          <kbd>⌘K</kbd>
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="adm-env-badge">Admin</span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="adm-btn"
            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
            aria-label="Open storefront (opens in new tab)"
          >
            <span>쇼핑몰 보기 Store</span>
            <ExternalLink size={13} aria-hidden />
          </a>
        </div>
      </header>

      <div className="adm-body">
        {navOpen && <div className="adm-sidebar-scrim" onClick={() => setNavOpen(false)} aria-hidden />}
        {/* Sidebar */}
        <aside className="adm-sidebar" aria-label="Admin navigation">
          <div className="adm-brand">
            <div className="adm-brand-name">NOEUL<em>ADMIN</em></div>
            <div className="adm-brand-sub">통합 브랜딩 &amp; 쇼핑몰 관리</div>
          </div>
          <nav className="adm-nav">
            {NAV_SECTIONS.map((section) => (
              <div key={section.id}>
                <div className="adm-nav-section">{section.ko} · {section.en}</div>
                <div className="adm-nav-list">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeId === item.id || location === item.href;
                    return (
                      <Link
                        key={`${section.id}-${item.id}-${item.href}`}
                        href={item.href}
                        onClick={() => setNavOpen(false)}
                        className={`adm-nav-link${isActive ? ' active' : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon size={17} aria-hidden />
                        <span className="adm-nav-label">{item.ko} ({item.en})</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="adm-user">
            <div className="adm-user-avatar" aria-hidden>{initial}</div>
            <div className="adm-user-meta">
              <strong>{adminUser?.name || '노을 관리자'}</strong>
              <span>{adminUser?.role || 'System Admin'}</span>
            </div>
            <button
              type="button"
              className="adm-icon-btn"
              aria-label="Log out 로그아웃"
              title="로그아웃 Log out"
              onClick={() => { adminLogout(); setLocation('/admin/login'); }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="adm-main">
          <nav className="adm-crumbs" aria-label="Breadcrumb">
            <Link href="/admin">Admin</Link>
            {autoCrumbs.map((c, i) => (
              <React.Fragment key={i}>
                <span aria-hidden>/</span>
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
              </React.Fragment>
            ))}
          </nav>
          {children}
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={paletteItems}
        onNavigate={(item) => setLocation(item.href)}
      />
    </div>
  );
}
