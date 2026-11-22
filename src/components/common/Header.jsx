import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { CATEGORIES_BY_GENDER } from '../../data/products.js';
import { api } from '../../utils/api.js';
import { safeHttpUrl } from '../../utils/imageHelper.js';
import { Menu, X, Search, ShoppingBag, ChevronDown, User, Heart, ArrowRight } from 'lucide-react';

const MEN_ALLOW = ['tshirts', 'shirts', 'jeans', 'pants', 'underwear', 'socks', 'jackets', 'hoodies', 'accessories', 'bags'];
const WOMEN_ALLOW = ['tshirts', 'shirts', 'jeans', 'pants', 'underwear', 'socks', 'dresses', 'skirts', 'jackets', 'hoodies', 'accessories', 'bags'];

const NAV_LINKS = [
  { key: 'new', label: 'NEW', href: '/shop?filter=new', group: 'left' },
  { key: 'best', label: 'BEST', href: '/shop?filter=best', group: 'left', hideMd: true },
  { key: 'men', label: 'MEN', href: '/shop?gender=men', group: 'left', mega: 'men' },
  { key: 'women', label: 'WOMEN', href: '/shop?gender=women', group: 'right', mega: 'women' },
  { key: 'sale', label: 'SALE', href: '/shop?filter=sale', group: 'right', sale: true },
  { key: 'about', label: 'ABOUT', href: '/about', group: 'right', hideMd: true },
];

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const next = window.scrollY > threshold;
        setScrolled(next);
        document.documentElement.dataset.scrolled = next ? 'true' : 'false';
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);
  return scrolled;
}

function activeKeyFrom(location, search) {
  const sp = new URLSearchParams(search);
  if (location === '/about') return 'about';
  if (location !== '/shop') return '';
  const filter = sp.get('filter') || '';
  if (filter === 'new') return 'new';
  if (filter === 'best') return 'best';
  if (filter === 'sale') return 'sale';
  const gender = sp.get('gender') || '';
  if (gender === 'men') return 'men';
  if (gender === 'women') return 'women';
  return '';
}

export function Header({ onOpenSearch }) {
  const { t } = useLanguage();
  const { totalCount, openCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  const { wishlistCount } = useWishlist();
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const scrolled = useScrolled();

  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [mega, setMega] = useState(null); // 'men' | 'women' | null
  const [liveCategories, setLiveCategories] = useState([]);
  const [megaBanners, setMegaBanners] = useState({ men: null, women: null });
  const [headerConfig, setHeaderConfig] = useState(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(() => {
    try { return sessionStorage.getItem('noeul_announcement_hidden') === '1'; } catch { return false; }
  });
  const closeTimer = useRef(null);
  const megaTriggerRef = useRef(null);

  const currentParams = useMemo(() => {
    const sp = new URLSearchParams(search);
    return {
      gender: (sp.get('gender') || 'all').toLowerCase(),
      category: (sp.get('category') || 'all').toLowerCase(),
      filter: (sp.get('filter') || '').toLowerCase(),
    };
  }, [search]);
  const activeKey = activeKeyFrom(location, search);

  useEffect(() => {
    let cancelled = false;
    api.get('/catalog/categories').then((res) => {
      if (!cancelled && res.success && Array.isArray(res.data)) {
        setLiveCategories(res.data.map((c) => ({
          key: (c.slug || '').toLowerCase(),
          label: c.name_en || c.slug,
          label_ko: c.name_ko || c.slug,
          image_url: c.image_url || '',
          gender: c.gender || 'unisex',
        })));
      }
    }).catch(() => {});
    api.get('/content/header_config').then((res) => {
      if (!cancelled && res?.success && res.data) setHeaderConfig(res.data);
    }).catch(() => {});
    api.get('/content/banners').then((res) => {
      if (cancelled || !res?.success || !Array.isArray(res.data)) return;
      const now = new Date();
      const active = res.data.filter((b) => b && b.is_active !== false)
        .filter((b) => !b.start_date || new Date(b.start_date) <= now)
        .filter((b) => !b.end_date || new Date(`${b.end_date}T23:59:59`) >= now);
      setMegaBanners({
        men: active.find((b) => b.placement === 'nav_mega_men') || null,
        women: active.find((b) => b.placement === 'nav_mega_women') || null,
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMega(null);
    if (currentParams.gender === 'men' || currentParams.gender === 'women') {
      setExpandedSection(currentParams.gender);
    }
  }, [location]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!mega) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMega(null);
        megaTriggerRef.current?.focus?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mega]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const openMega = (gender) => {
    clearTimeout(closeTimer.current);
    setMega(gender);
  };
  const scheduleCloseMega = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(null), 180);
  };

  const catsFor = (gender) => {
    const allow = gender === 'men' ? MEN_ALLOW : WOMEN_ALLOW;
    if (liveCategories.length) {
      return liveCategories.filter((c) => allow.includes(c.key) && (c.gender === gender || c.gender === 'unisex'));
    }
    return (CATEGORIES_BY_GENDER[gender] || []).filter((c) => allow.includes(c.key));
  };
  const menCats = useMemo(() => catsFor('men'), [liveCategories]);
  const womenCats = useMemo(() => catsFor('women'), [liveCategories]);
  const catLabel = (c) => c.label_ko || c.name_ko || c.label || c.slug;

  const navigateWithFilter = (paramsObj) => {
    setMenuOpen(false);
    setMega(null);
    const sp = new URLSearchParams();
    Object.entries(paramsObj).forEach(([k, v]) => {
      if (v && v !== 'all' && v !== '') sp.set(k, v);
    });
    const qs = sp.toString();
    setLocation(qs ? `/shop?${qs}` : '/shop');
  };

  const dismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    try { sessionStorage.setItem('noeul_announcement_hidden', '1'); } catch { /* storage unavailable */ }
  };

  const showAnnouncement = headerConfig?.announcement_enabled !== false
    && Boolean(headerConfig?.announcement_ko)
    && !announcementDismissed;

  const renderMegaPanel = (gender) => {
    const cats = gender === 'men' ? menCats : womenCats;
    const banner = megaBanners[gender];
    const bannerImage = safeHttpUrl(banner?.image_url);
    const title = gender === 'men' ? 'MEN' : 'WOMEN';
    return (
      <div
        className="lux-mega"
        onMouseEnter={() => openMega(gender)}
        onMouseLeave={scheduleCloseMega}
        role="region"
        aria-label={`${title} 메뉴`}
      >
        <div className="lux-mega__inner">
          <div className="lux-mega__col">
            <p className="lux-eyebrow">CLOTHING</p>
            <ul className="lux-mega__list">
              {cats.map((c) => (
                <li key={c.key}>
                  <Link
                    href={`/shop?gender=${gender}&category=${c.key}`}
                    className="lux-mega__cat"
                    onClick={() => setMega(null)}
                  >
                    <span className="lux-mega__cat-ko">{catLabel(c)}</span>
                    <span className="lux-mega__cat-en">{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="lux-mega__col">
            <p className="lux-eyebrow">COLLECTIONS</p>
            <ul className="lux-mega__list">
              <li><Link href={`/shop?gender=${gender}`} className="lux-mega__cat" onClick={() => setMega(null)}><span className="lux-mega__cat-ko">전체 보기</span><span className="lux-mega__cat-en">Shop All</span></Link></li>
              <li><Link href={`/shop?gender=${gender}&filter=new`} className="lux-mega__cat" onClick={() => setMega(null)}><span className="lux-mega__cat-ko">신상품</span><span className="lux-mega__cat-en">New In</span></Link></li>
              <li><Link href={`/shop?gender=${gender}&filter=best`} className="lux-mega__cat" onClick={() => setMega(null)}><span className="lux-mega__cat-ko">베스트</span><span className="lux-mega__cat-en">Best Sellers</span></Link></li>
              <li><Link href={`/shop?gender=${gender}&filter=sale`} className="lux-mega__cat" onClick={() => setMega(null)}><span className="lux-mega__cat-ko">세일</span><span className="lux-mega__cat-en">Sale</span></Link></li>
            </ul>
          </div>
          <div className="lux-mega__feature">
            {bannerImage ? (
              <Link href={safeHttpUrl(banner?.link_url) || `/shop?gender=${gender}`} onClick={() => setMega(null)} className="lux-mega__feature-link">
                <img src={bannerImage} alt={banner?.alt_ko || banner?.title_ko || title} loading="lazy" decoding="async" />
                <span className="lux-mega__feature-copy">
                  <span className="lux-eyebrow">{banner?.subtitle_ko || 'COLLECTION'}</span>
                  <strong>{banner?.title_ko || `${title} 컬렉션`}</strong>
                  <span className="lux-mega__feature-cta">SHOP <ArrowRight size={13} /></span>
                </span>
              </Link>
            ) : (
              <div className="lux-mega__feature-fallback">
                <span className="lux-eyebrow">NOEUL</span>
                <strong>{title} 컬렉션</strong>
                <Link href={`/shop?gender=${gender}`} onClick={() => setMega(null)} className="lux-mega__feature-cta">SHOP <ArrowRight size={13} /></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDesktopNavLink = (item) => {
    if (item.mega) {
      return (
        <button
          key={item.key}
          type="button"
          ref={mega === item.mega ? megaTriggerRef : undefined}
          className={`lux-nav__link${activeKey === item.key ? ' is-active' : ''}${item.hideMd ? ' lux-hide-md' : ''}`}
          aria-haspopup="true"
          aria-expanded={mega === item.mega}
          onMouseEnter={() => openMega(item.mega)}
          onMouseLeave={scheduleCloseMega}
          onFocus={() => openMega(item.mega)}
          onClick={() => navigateWithFilter({ gender: item.mega })}
        >
          {item.label}
          <ChevronDown size={11} className={`lux-nav__chev${mega === item.mega ? ' is-open' : ''}`} aria-hidden />
        </button>
      );
    }
    return (
      <Link
        key={item.key}
        href={item.href}
        className={`lux-nav__link${activeKey === item.key ? ' is-active' : ''}${item.sale ? ' is-sale' : ''}${item.hideMd ? ' lux-hide-md' : ''}`}
      >
        {item.label}
      </Link>
    );
  };

  const renderGenderSection = (gender, cats) => {
    const isExpanded = expandedSection === gender;
    const isActiveGender = currentParams.gender === gender;
    const title = gender === 'men' ? t('nav.men') : t('nav.women');
    return (
      <div className={`drawer-section${isActiveGender ? ' active-gender' : ''}`}>
        <div className="drawer-section-head">
          <button
            type="button"
            onClick={() => navigateWithFilter({ gender })}
            className={isActiveGender ? 'drawer-section-title active' : 'drawer-section-title'}
          >
            {title.toUpperCase()}
          </button>
          <button
            type="button"
            className="drawer-section-toggle"
            onClick={() => setExpandedSection(isExpanded ? null : gender)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? t('nav.collapse_section', { title }) : t('nav.expand_section', { title })}
          >
            <ChevronDown size={16} className={isExpanded ? 'chev open' : 'chev'} aria-hidden />
          </button>
        </div>
        {isExpanded && (
          <div className="drawer-subcats">
            <button
              type="button"
              onClick={() => navigateWithFilter({ gender })}
              className={isActiveGender && currentParams.category === 'all' ? 'drawer-subcat active' : 'drawer-subcat all-link'}
            >
              {gender === 'men' ? '남성 전체' : '여성 전체'}
            </button>
            {cats.map((c) => {
              const isActive = isActiveGender && currentParams.category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => navigateWithFilter({ gender, category: c.key })}
                  className={isActive ? 'drawer-subcat active' : 'drawer-subcat'}
                >
                  {catLabel(c)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {showAnnouncement && (
        <div
          className="lux-announce"
          style={{
            backgroundColor: headerConfig?.announcement_bg || '#171614',
            color: headerConfig?.announcement_color || '#FAF7F1',
          }}
        >
          <span className="lux-announce__text">{headerConfig?.announcement_ko}</span>
          <button type="button" className="lux-announce__close" onClick={dismissAnnouncement} aria-label="공지 닫기">
            <X size={12} />
          </button>
        </div>
      )}

      <header className={`lux-header${scrolled ? ' is-scrolled' : ''}`}>
        {/* Desktop: split couture nav */}
        <div className="lux-header__inner lux-desktop">
          <nav className="lux-nav lux-nav--left" aria-label="주 메뉴">
            {NAV_LINKS.filter((i) => i.group === 'left').map(renderDesktopNavLink)}
          </nav>

          <Link href="/" className="lux-logo" aria-label="NOEUL 홈">NOEUL</Link>

          <div className="lux-header__right">
            <nav className="lux-nav lux-nav--right" aria-label="카테고리 메뉴">
              {NAV_LINKS.filter((i) => i.group === 'right').map(renderDesktopNavLink)}
            </nav>
            <div className="lux-actions">
              <button type="button" className="lux-icon-btn" onClick={onOpenSearch} aria-label="검색">
                <Search size={19} strokeWidth={1.5} />
              </button>
              <Link href={isLoggedIn ? '/account' : '/auth'} className="lux-icon-btn" aria-label={isLoggedIn ? '마이페이지' : '로그인'}>
                <User size={19} strokeWidth={1.5} />
              </Link>
              <Link href={isLoggedIn ? '/account?tab=wishlist' : '/auth'} className="lux-icon-btn" aria-label="위시리스트">
                <Heart size={19} strokeWidth={1.5} />
                {wishlistCount > 0 && <span className="lux-count">{wishlistCount}</span>}
              </Link>
              <button type="button" className="lux-icon-btn" onClick={openCart} aria-label="장바구니">
                <ShoppingBag size={19} strokeWidth={1.5} />
                {totalCount > 0 && <span className="lux-count">{totalCount}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile: hamburger + centered wordmark + quick actions */}
        <div className="lux-header__mobile lux-mobile">
          <button type="button" className="lux-icon-btn" onClick={() => setMenuOpen(true)} aria-label="메뉴 열기">
            <Menu size={21} strokeWidth={1.5} />
          </button>
          <Link href="/" className="lux-logo lux-logo--mobile" aria-label="NOEUL 홈">NOEUL</Link>
          <div className="lux-actions">
            <button type="button" className="lux-icon-btn" onClick={onOpenSearch} aria-label="검색">
              <Search size={19} strokeWidth={1.5} />
            </button>
            <button type="button" className="lux-icon-btn" onClick={openCart} aria-label="장바구니">
              <ShoppingBag size={19} strokeWidth={1.5} />
              {totalCount > 0 && <span className="lux-count">{totalCount}</span>}
            </button>
          </div>
        </div>

        {mega && renderMegaPanel(mega)}
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="backdrop"
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(23, 22, 20, 0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 150,
            display: 'flex',
            justifyContent: 'flex-start',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
            onClick={(e) => e.stopPropagation()}
            className="lux-drawer"
          >
            <div className="lux-drawer__head">
              <span className="lux-logo">NOEUL</span>
              <button type="button" className="lux-icon-btn" onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="lux-drawer__utility">
              <Link href={isLoggedIn ? '/account' : '/auth'} onClick={() => setMenuOpen(false)}>
                <User size={15} /> {isLoggedIn ? (user?.name || t('nav.account')) : t('nav.login')}
              </Link>
              <Link href={isLoggedIn ? '/account?tab=wishlist' : '/auth'} onClick={() => setMenuOpen(false)}>
                <Heart size={15} /> 위시리스트 {wishlistCount > 0 ? `(${wishlistCount})` : ''}
              </Link>
            </div>

            <div className="lux-drawer__body">
              <button
                type="button"
                onClick={() => navigateWithFilter({})}
                className={currentParams.gender === 'all' && !currentParams.category?.length ? 'drawer-link active' : 'drawer-link'}
              >
                <span>{t('nav.all')}</span>
              </button>
              {renderGenderSection('men', menCats)}
              {renderGenderSection('women', womenCats)}
              <div className="drawer-divider" />
              <button type="button" onClick={() => navigateWithFilter({ filter: 'new' })} className={currentParams.filter === 'new' ? 'drawer-link active' : 'drawer-link'}>
                <span>{t('nav.new_arrivals')}</span>
              </button>
              <button type="button" onClick={() => navigateWithFilter({ filter: 'best' })} className={currentParams.filter === 'best' ? 'drawer-link active' : 'drawer-link'}>
                <span>{t('nav.best_sellers')}</span>
              </button>
              <button type="button" onClick={() => navigateWithFilter({ filter: 'sale' })} className="drawer-link sale">
                <span>{t('nav.sale')}</span>
              </button>
              <div className="drawer-divider" />
              <button
                type="button"
                onClick={() => { setMenuOpen(false); openCart(); }}
                className="drawer-link"
              >
                <span>{t('nav.cart')}</span>
                {totalCount > 0 && <span style={{ fontSize: '0.75rem', color: '#71717a' }}>({totalCount})</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .drawer-link {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 24px; font-size: 0.9375rem; font-weight: 500;
          letter-spacing: 0.08em; color: #171614; background: none;
          border: none; border-left: 2px solid transparent;
          cursor: pointer; text-align: left; width: 100%;
        }
        .drawer-link.active { border-left-color: #171614; background: #F3EFE7; }
        .drawer-link.sale { color: #7E3B2E; }
        .drawer-section-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; }
        .drawer-section-toggle { display: flex; align-items: center; justify-content: center; min-width: 40px; min-height: 40px; margin: -8px -8px -8px 0; background: none; border: none; border-radius: 8px; cursor: pointer; }
        .drawer-section-toggle:focus-visible { outline: 2px solid #171614; outline-offset: 2px; }
        .drawer-section-title { font-size: 0.9375rem; font-weight: 500; letter-spacing: 0.08em; color: #171614; background: none; border: none; border-left: 2px solid transparent; cursor: pointer; padding: 0 0 0 2px; }
        .drawer-section-title.active { font-weight: 700; }
        .drawer-section.active-gender .drawer-section-head { background: #F3EFE7; }
        .drawer-section .chev { transition: transform 0.2s; color: #8B857C; }
        .drawer-section .chev.open { transform: rotate(180deg); }
        .drawer-subcats { padding: 4px 24px 12px 38px; display: flex; flex-direction: column; gap: 4px; }
        .drawer-subcat { font-size: 0.8125rem; color: #4A4742; background: none; border: none; border-left: 2px solid transparent; cursor: pointer; text-align: left; padding: 5px 0 5px 8px; }
        .drawer-subcat.all-link { color: #171614; font-weight: 600; }
        .drawer-subcat.active { color: #171614; font-weight: 700; border-left-color: #171614; background: #F3EFE7; }
        .drawer-divider { height: 1px; background: #E4DED3; margin: 8px 24px; }
      `}</style>
    </>
  );
}
