import React, { useState, useEffect, useCallback } from 'react';
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
  const { t, formatKRW } = useLanguage();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [location, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wishlist' | 'profile'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Coupons & Reward Points State
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [rewardPoints, setRewardPoints] = useState(null);
  const [loadingRewards, setLoadingRewards] = useState(true);

  // Profile Form State (name lives on profiles; addresses live in address book)
  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Address book state
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressForm, setAddressForm] = useState({ recipient: '', phone: '', postal_code: '', address: '', detail_address: '', label: '' });
  const [editingId, setEditingId] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const fetchAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const res = await api.get('/me/addresses');
      if (res.success) setAddresses(res.data || []);
    } catch (err) {
      console.error('Fetch addresses failed:', err);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    setLoadingCoupons(true);
    try {
      const res = await api.get('/me/coupons');
      if (res.success) setCoupons(res.data);
    } catch (err) {
      console.error('Fetch coupons failed:', err);
    } finally {
      setLoadingCoupons(false);
    }
  }, []);

  const fetchRewardPoints = useCallback(async () => {
    setLoadingRewards(true);
    try {
      const res = await api.get('/me/reward-points');
      if (res.success) setRewardPoints(res.data);
    } catch (err) {
      console.error('Fetch reward points failed:', err);
    } finally {
      setLoadingRewards(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
    fetchRewardPoints();
    fetchAddresses();
  }, [fetchCoupons, fetchRewardPoints, fetchAddresses, user]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation('/auth');
      return;
    }

    if (user) {
      setName(user.name || '');
    }

    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);

    setLoadingOrders(true);
    api.get('/orders').then((res) => setOrders(res.data || [])).catch((err) => console.error('Fetch my orders error:', err)).finally(() => setLoadingOrders(false));
  }, [isLoggedIn, user, setLocation, location]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name });
      showToast('회원 정보가 수정되었습니다.', 'success');
    } catch (err) {
      showToast(err.message || '수정 실패', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const defaultAddress = addresses.find(a => a.is_default) || addresses[0] || null;

  const startEditAddress = (addr) => {
    setEditingId(String(addr.id));
    setAddressForm({
      recipient: addr.recipient || '',
      phone: addr.phone || '',
      postal_code: addr.postal_code || '',
      address: addr.address || '',
      detail_address: addr.detail_address || '',
      label: addr.label || '',
    });
  };

  const resetAddressForm = () => {
    setEditingId(null);
    setAddressForm({ recipient: '', phone: '', postal_code: '', address: '', detail_address: '', label: '' });
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      if (editingId) {
        const res = await api.put(`/me/addresses/${editingId}`, addressForm);
        if (res.success) setAddresses(list => list.map(a => String(a.id) === String(editingId) ? res.data : a));
      } else {
        const res = await api.post('/me/addresses', { ...addressForm, is_default: addresses.length === 0 });
        if (res.success) setAddresses(list => [res.data, ...list]);
      }
      resetAddressForm();
      showToast('배송지가 저장되었습니다.', 'success');
    } catch (err) {
      showToast(err.message || '배송지 저장 실패', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/me/addresses/${id}`);
      setAddresses(list => list.filter(a => String(a.id) !== String(id)));
      if (String(editingId) === String(id)) resetAddressForm();
      fetchAddresses();
    } catch (err) {
      showToast(err.message || '삭제 실패', 'error');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await api.post(`/me/addresses/${id}/default`, {});
      if (res.success) setAddresses(list => list.map(a => ({ ...a, is_default: String(a.id) === String(id) })));
    } catch (err) {
      showToast(err.message || '기본 배송지 설정 실패', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    showToast('로그아웃되었습니다.', 'info');
    setLocation('/');
  };

  const orderSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

  // Backend statuses → stepper position. Terminal states return -1 (stepper hidden).
  const getStepIndex = (status) => {
    const map = { pending_payment: 0, confirming: 0, pending: 0, paid: 1, confirmed: 1, processing: 2, shipped: 3, delivered: 4 };
    return map[status] ?? -1;
  };
  const isTerminalOrder = (status) => ['canceled', 'cancelled', 'expired', 'refunded', 'refund_pending'].includes(status);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user?.avatar_url || user?.photoURL || user?.user_metadata?.avatar_url ? (
              <img
                src={user?.avatar_url || user?.photoURL || user?.user_metadata?.avatar_url}
                alt={user?.name || 'User Profile'}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--accent-sunset)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#18181b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 600 }}>
                  {t('account.welcome', { name: user?.full_name || user?.user_metadata?.full_name || user?.name || 'Customer' })}
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
                {user?.email} • {user?.phone || defaultAddress?.phone || '연락처 미등록'}
              </p>
            </div>
          </div>

          {/* Points & Coupon Summary Widgets - Dynamic from API */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: '8px', textAlign: 'center', minWidth: '110px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Coins size={13} color="var(--accent-sunset)" />
                <span>{t('account.points')}</span>
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '2px' }}>
                {loadingRewards ? '...' : (rewardPoints?.balance || 0).toLocaleString()}P
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: '8px', textAlign: 'center', minWidth: '110px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Gift size={13} color="var(--accent-sunset)" />
                <span>{t('account.coupons_count')}</span>
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '2px' }}>
                {loadingCoupons ? '...' : coupons.length}장
              </p>
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
                <p style={{ color: 'var(--text-muted)' }}>주문 내역을 불러오는 중...</p>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#ffffff', borderRadius: '12px' }}>
                <Package size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '6px' }}>{t('account.no_orders')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
                  노을의 새로운 컬렉션을 둘러보세요.
                </p>
                <Link href="/shop" className="btn-primary">
                  {t('cart.continue_shopping')}
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {orders.map((order) => {
                  const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP['pending'];
                  const stepIndex = getStepIndex(order.status);

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
                          {statusInfo.ko || statusInfo.en}
                        </span>
                      </div>

                      {/* Live 5-Step Korean Order Tracking Stepper */}
                      {!isTerminalOrder(order.status) && stepIndex >= 0 && (
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
                                    {stepLabel.ko || stepLabel.en}
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
                                {item.product_name_ko || item.product_name_en}
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

                      {/* Payment state CTA for card checkout (no receipt workflow) */}
                      {(order.status) === 'pending_payment' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#fff1f2',
                            border: '1px solid #fecdd3',
                            borderRadius: '6px',
                            padding: '12px 16px',
                            marginBottom: '16px',
                            fontSize: '0.8125rem',
                          }}
                        >
                          <span style={{ color: '#9f1239', fontWeight: 600 }}>
                            ⚠️ 카드 결제가 필요합니다.
                          </span>
                          <Link
                            href={`/checkout/toss?order=${encodeURIComponent(order.order_number)}`}
                            style={{
                              backgroundColor: 'var(--accent-sunset)',
                              color: '#ffffff',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          >
                            결제 계속하기 →
                          </Link>
                        </div>
                      )}
                      {(order.status) === 'confirming' && (
                        <div
                          style={{
                            backgroundColor: '#fefce8',
                            border: '1px solid #fef08a',
                            borderRadius: '6px',
                            padding: '12px 16px',
                            marginBottom: '16px',
                            fontSize: '0.8125rem',
                            color: '#854d0e',
                            fontWeight: 600,
                          }}
                        >
                          ⭐ 결제 확인 중입니다. 잠시만 기다려주세요.
                        </div>
                      )}

                      {/* Shipping Address Details (canonical: order.address jsonb) */}
                      {((order.address && (order.address.recipient || order.address.address)) || order.customer_name) && (
                        <div style={{ backgroundColor: '#fafafa', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.8125rem', border: '1px solid #f0f0f2' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#52525b', fontWeight: 700, marginBottom: '4px' }}>
                            <MapPin size={14} color="var(--accent-sunset)" />
                            <span>배송지 정보</span>
                          </div>
                          <p style={{ color: '#18181b', lineHeight: 1.4 }}>
                            <strong>{order.address?.recipient || order.customer_name}</strong> ({order.address?.phone || order.customer_phone})<br />
                            [{order.address?.postal_code || order.postal_code}] {order.address?.address || order.address} {order.address?.detail_address || order.detail_address}
                            {(order.address?.shipping_memo || order.shipping_memo) && <span style={{ color: '#71717a', display: 'block', marginTop: '2px' }}>요청사항: {order.address?.shipping_memo || order.shipping_memo}</span>}
                          </p>
                        </div>
                      )}

                      {/* Order Footer Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          총 결제 금액
                        </span>
                        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatKRW(order.amount)}
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
                  위시리스트가 비어 있습니다.
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
                  마음에 드는 상품의 하트 아이콘을 눌러 담아보세요.
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
                    <Link href={`/product/${item.slug || item.id}`} style={{ display: 'block', aspectRatio: '3 / 4' }}>
                      <img
                        src={item.images?.[0] || '/products/men/tshirts/classic-tshirt/1.jpg'}
                        alt={item.name_ko || item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Link>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '4px' }}>
                          {item.name_ko || item.name || item.name_en}
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
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid var(--border-light)', maxWidth: '640px', display: 'grid', gap: 28 }}>
            <div>
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

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
                {t('account.default_address')} · 주소록
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                저장된 주소는 주문서에서 바로 선택할 수 있습니다.
              </p>

              {loadingAddresses ? <p>불러오는 중…</p> : addresses.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>저장된 배송지가 없습니다. 아래에서 추가해주세요.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                  {addresses.map(a => (
                    <div key={a.id} style={{ border: '1px solid var(--border-light)', borderRadius: 8, padding: '12px 14px', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <strong>{a.label ? `${a.label} · ` : ''}{a.recipient}</strong>
                        {a.is_default && <span style={{ fontSize: '0.75rem', background: '#18181b', color: '#fff', padding: '2px 8px', borderRadius: 999 }}>기본</span>}
                      </div>
                      <p style={{ margin: '6px 0', color: 'var(--text-secondary)' }}>
                        ({formatKoreanPhone(a.phone)})<br />[{a.postal_code}] {a.address} {a.detail_address}
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {!a.is_default && <button type="button" className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => handleSetDefault(a.id)}>기본으로 설정</button>}
                        <button type="button" className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => startEditAddress(a)}>수정</button>
                        <button type="button" className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => handleDeleteAddress(a.id)}>삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSaveAddress} style={{ display: 'grid', gap: '12px', background: '#fafafa', borderRadius: 8, padding: 16 }}>
                <h5 style={{ fontSize: '0.875rem', fontWeight: 600 }}>{editingId ? '배송지 수정' : '새 배송지 추가'}</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label className="form-label">받는 분<input required value={addressForm.recipient} onChange={e => setAddressForm({ ...addressForm, recipient: e.target.value })} className="form-input" maxLength={60} /></label>
                  <label className="form-label">연락처<input required value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: formatKoreanPhone(e.target.value) })} placeholder="010-0000-0000" className="form-input" /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
                  <label className="form-label">{t('checkout.postal_code')}<input required value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })} placeholder="06001" className="form-input" maxLength={20} /></label>
                  <label className="form-label">{t('checkout.address')}<input required value={addressForm.address} onChange={e => setAddressForm({ ...addressForm, address: e.target.value })} placeholder="서울특별시 강남구..." className="form-input" /></label>
                </div>
                <label className="form-label">{t('checkout.detail_address')}<input value={addressForm.detail_address} onChange={e => setAddressForm({ ...addressForm, detail_address: e.target.value })} placeholder="102동 1405호" className="form-input" /></label>
                <label className="form-label">주소 별칭 (선택)<input value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })} placeholder="집, 회사" className="form-input" maxLength={40} /></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={savingAddress} className="btn-primary" style={{ padding: '10px 16px', fontSize: '0.875rem' }}>
                    {savingAddress ? '저장 중…' : editingId ? '수정 저장' : '배송지 저장'}
                  </button>
                  {editingId && <button type="button" className="btn-secondary" style={{ padding: '10px 16px', fontSize: '0.875rem' }} onClick={resetAddressForm}>취소</button>}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
