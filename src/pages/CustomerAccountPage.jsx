import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../utils/api.js';
import { formatKoreanPhone, ORDER_STATUS_MAP } from '../utils/formatters.js';
import {
  Package,
  Heart,
  User,
  LogOut,
  Truck,
  ExternalLink,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  Gift,
  Coins,
} from 'lucide-react';

export function CustomerAccountPage() {
  const { user, isLoggedIn, logout, updateProfile } = useAuth();
  const { lang, t, formatKRW } = useLanguage();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [location, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wishlist' | 'profile'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation('/auth');
      return;
    }

    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setPostalCode(user.postal_code || '');
      setAddress(user.address || '');
      setDetailAddress(user.detail_address || '');
    }

    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);

    async function fetchOrders() {
      setLoadingOrders(true);
      try {
        const res = await api.get('/orders/my-orders');
        if (res.success) {
          setOrders(res.data);
        }
      } catch (err) {
        console.error('Fetch my orders error:', err);
      } finally {
        setLoadingOrders(false);
      }
    }

    fetchOrders();
  }, [isLoggedIn, user, setLocation, location]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        name,
        phone,
        postal_code: postalCode,
        address,
        detail_address: detailAddress,
      });
      showToast(lang === 'ko' ? '회원 정보가 수정되었습니다.' : 'Profile updated successfully.', 'success');
    } catch (err) {
      showToast(err.message || '수정 실패', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast(lang === 'ko' ? '로그아웃되었습니다.' : 'Logged out.', 'info');
    setLocation('/');
  };

  const orderSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

  const getStepIndex = (status) => {
    return orderSteps.indexOf(status);
  };

  return (
    <div style={{ padding: '40px 0 80px', backgroundColor: 'var(--bg-secondary)', minHeight: 'calc(100vh - 200px)' }}>
      <div className="container">
        {/* Top Profile Banner */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-light)',
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 600 }}>
                {t('account.welcome', { name: user?.name || 'Customer' })}
              </h1>
              <span
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '999px',
                }}
              >
                {t('account.tier')}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {user?.email} • {user?.phone || '연락처 미등록'}
            </p>
          </div>

          {/* Points & Coupon Summary Widgets */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: '8px', textAlign: 'center', minWidth: '110px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Coins size={13} color="var(--accent-sunset)" />
                <span>{t('account.points')}</span>
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '2px' }}>2,500P</p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: '8px', textAlign: 'center', minWidth: '110px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Gift size={13} color="var(--accent-sunset)" />
                <span>{t('account.coupons_count')}</span>
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '2px' }}>1장</p>
            </div>

            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}
            >
              <LogOut size={16} />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>

        {/* Account Tab Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('orders')}
            className={activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '10px 20px', fontSize: '0.875rem' }}
          >
            <Package size={16} />
            <span>{t('account.tab_orders')} ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={activeTab === 'wishlist' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '10px 20px', fontSize: '0.875rem' }}
          >
            <Heart size={16} />
            <span>{t('account.tab_wishlist')} ({wishlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '10px 20px', fontSize: '0.875rem' }}
          >
            <User size={16} />
            <span>{t('account.tab_profile')}</span>
          </button>
        </div>

        {/* 1. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#ffffff', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-muted)' }}>{lang === 'ko' ? '주문 내역을 불러오는 중...' : 'Loading order history...'}</p>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#ffffff', borderRadius: '12px' }}>
                <Package size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '6px' }}>{t('account.no_orders')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
                  {lang === 'ko' ? '노을의 새로운 컬렉션을 둘러보세요.' : 'Discover our new season collection.'}
                </p>
                <Link href="/shop" className="btn-primary">
                  {t('cart.continue_shopping')}
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {orders.map((order) => {
                  const statusInfo = ORDER_STATUS_MAP[order.order_status] || ORDER_STATUS_MAP['pending'];
                  const stepIndex = getStepIndex(order.order_status);

                  return (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        padding: '28px',
                        border: '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {/* Order Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '18px', borderBottom: '1px solid var(--border-light)', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {order.created_at?.split('T')[0] || order.created_at?.split(' ')[0]}
                            </span>
                            <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9375rem' }}>
                              {order.order_number}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          style={{
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.text,
                            padding: '4px 12px',
                            borderRadius: '999px',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                          }}
                        >
                          {lang === 'ko' ? statusInfo.ko : statusInfo.en}
                        </span>
                      </div>

                      {/* Live 5-Step Korean Order Tracking Stepper */}
                      {order.order_status !== 'cancelled' && order.order_status !== 'refunded' && (
                        <div
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            padding: '18px 24px',
                            marginBottom: '20px',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', textAlign: 'center', position: 'relative' }}>
                            {orderSteps.map((step, idx) => {
                              const isCurrentOrPassed = stepIndex >= idx;
                              const isCurrent = stepIndex === idx;
                              const stepLabel = ORDER_STATUS_MAP[step];

                              return (
                                <div key={step} style={{ position: 'relative', zIndex: 2 }}>
                                  <div
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      backgroundColor: isCurrent ? 'var(--accent-sunset)' : isCurrentOrPassed ? 'var(--text-primary)' : '#d1cecb',
                                      color: '#ffffff',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      marginBottom: '6px',
                                    }}
                                  >
                                    {isCurrentOrPassed ? '✓' : idx + 1}
                                  </div>
                                  <p
                                    style={{
                                      fontSize: '0.75rem',
                                      fontWeight: isCurrent ? 700 : 500,
                                      color: isCurrent ? 'var(--accent-sunset)' : isCurrentOrPassed ? 'var(--text-primary)' : 'var(--text-muted)',
                                    }}
                                  >
                                    {lang === 'ko' ? stepLabel.ko : stepLabel.en}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Items in this order */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <img
                              src={item.image_url}
                              alt={item.product_name_ko}
                              style={{ width: '56px', height: '70px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                                {lang === 'ko' ? item.product_name_ko : item.product_name_en}
                              </h4>
                              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                {item.size} / {item.color} • {item.quantity}개
                              </p>
                            </div>
                            <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                              {formatKRW(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Tracking / Courier detail if shipped */}
                      {order.tracking_number && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            padding: '12px 16px',
                            marginBottom: '16px',
                            fontSize: '0.8125rem',
                            color: '#166534',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Truck size={16} />
                            <span>
                              {order.courier_name || 'CJ대한통운'} : <strong>{order.tracking_number}</strong>
                            </span>
                          </div>
                          <span style={{ fontWeight: 600 }}>배송 추적 중</span>
                        </div>
                      )}

                      {/* Payment Verification / Receipt CTA for Bank Transfer */}
                      {order.payment_status !== 'paid' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: order.payment_status === 'under_review' ? '#fefce8' : '#fff1f2',
                            border: order.payment_status === 'under_review' ? '1px solid #fef08a' : '1px solid #fecdd3',
                            borderRadius: '6px',
                            padding: '12px 16px',
                            marginBottom: '16px',
                            fontSize: '0.8125rem',
                          }}
                        >
                          <span style={{ color: order.payment_status === 'under_review' ? '#854d0e' : '#9f1239', fontWeight: 600 }}>
                            {order.payment_status === 'under_review'
                              ? '⭐ 영수증 등록 완료 (관리자 입금 확인 검수중)'
                              : '⚠️ 무통장 입금 및 영수증 등록이 필요합니다.'}
                          </span>
                          <Link
                            href={`/order-success/${order.order_number}`}
                            style={{
                              backgroundColor: 'var(--accent-sunset)',
                              color: '#ffffff',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          >
                            입금 계좌 / 영수증 업로드 →
                          </Link>
                        </div>
                      )}

                      {/* Order Footer Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {lang === 'ko' ? '총 결제 금액' : 'Total Amount'}
                        </span>
                        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatKRW(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. WISHLIST TAB */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#ffffff', borderRadius: '12px' }}>
                <Heart size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '6px' }}>
                  {lang === 'ko' ? '위시리스트가 비어 있습니다.' : 'Your wishlist is empty.'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
                  {lang === 'ko' ? '마음에 드는 상품의 하트 아이콘을 눌러 담아보세요.' : 'Click the heart icon on any item to save it here.'}
                </p>
                <Link href="/shop" className="btn-primary">
                  {t('cart.continue_shopping')}
                </Link>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '24px',
                }}
              >
                {wishlist.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Link href={`/product/${item.id}`} style={{ display: 'block', aspectRatio: '3 / 4' }}>
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop'}
                        alt={item.name_ko}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Link>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '4px' }}>
                          {lang === 'ko' ? item.name_ko : item.name_en}
                        </h4>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-sunset)' }}>
                          {formatKRW(item.discount_price || item.price)}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button
                          onClick={() => addToCart(item, item.sizes?.[0] || 'FREE', item.colors?.[0])}
                          className="btn-primary"
                          style={{ flex: 1, padding: '10px', fontSize: '0.8125rem' }}
                        >
                          {t('product.add_to_cart')}
                        </button>
                        <button
                          onClick={() => toggleWishlist(item)}
                          className="btn-secondary"
                          style={{ padding: '10px 14px', fontSize: '0.8125rem' }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. PROFILE & KOREAN ADDRESS TAB */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid var(--border-light)', maxWidth: '640px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>
              {t('account.profile_update')}
            </h3>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('auth.name')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('auth.phone')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatKoreanPhone(e.target.value))}
                  placeholder="010-0000-0000"
                  className="form-input"
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '14px' }}>
                  {t('account.default_address')}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label className="form-label">{t('checkout.postal_code')}</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="06001"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('checkout.address')}</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="서울특별시 강남구..."
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('checkout.detail_address')}</label>
                  <input
                    type="text"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    placeholder="102동 1405호"
                    className="form-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary"
                style={{ padding: '14px', fontSize: '0.9375rem', width: '100%', marginTop: '12px' }}
              >
                {savingProfile ? '...' : t('account.save_changes')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
