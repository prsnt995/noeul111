import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { formatKRW, ORDER_STATUS_MAP } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Plus,
  Truck,
  CheckCircle,
  Clock,
} from 'lucide-react';

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      showToast('통계 데이터를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickStock = async (productId, delta) => {
    try {
      await api.patch(`/admin/products/${productId}/stock`, { delta });
      showToast('재고가 추가되었습니다.', 'success');
      fetchStats();
    } catch (err) {
      showToast('재고 변경 실패', 'error');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { order_status: newStatus });
      showToast('주문 상태가 변경되었습니다.', 'success');
      fetchStats();
    } catch (err) {
      showToast('상태 변경 실패', 'error');
    }
  };

  if (loading) {
    return (
      <AdminLayout activePage="dashboard">
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#71717a' }}>
          대시보드 통계 로딩 중...
        </div>
      </AdminLayout>
    );
  }

  const stats = data?.stats || {};
  const orderStatuses = stats.orderStatuses || {};
  const recentOrders = data?.recentOrders || [];
  const lowStockItems = data?.lowStockItems || [];
  const salesTrend = data?.salesTrend || [];

  return (
    <AdminLayout activePage="dashboard">
      <div>
        {/* Page Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>대시보드 개요</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '2px' }}>
              노을(NOEUL) 브랜드 실시간 매출 및 주문 배송 현황
            </p>
          </div>
          <Link href="/admin/products" className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 18px', fontSize: '0.875rem' }}>
            <Plus size={16} />
            <span>새 상품 등록</span>
          </Link>
        </div>

        {/* 1. All 8 Specified KPI Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {/* Total Sales */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Total Sales (총 매출액)</span>
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fef2f2', color: 'var(--accent-sunset)' }}>
                <DollarSign size={16} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#18181b' }}>
              {formatKRW(stats.totalRevenue)}
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '4px', display: 'block' }}>
              실 결제 완료 누적
            </span>
          </div>

          {/* Total Products */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Total Products (전체 상품)</span>
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <ShoppingBag size={16} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#18181b' }}>
              {stats.totalProducts || 0}개
            </h2>
            <Link href="/admin/products" style={{ fontSize: '0.75rem', color: 'var(--accent-sunset)', fontWeight: 600, marginTop: '4px', display: 'block' }}>
              상품 목록 관리 →
            </Link>
          </div>

          {/* Women's Products */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Women's Products (여성)</span>
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fce7f3', color: '#db2777' }}>
                <ShoppingBag size={16} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#18181b' }}>
              {stats.womensProducts || 0}개
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px', display: 'block' }}>
              여성 의류 라인업
            </span>
          </div>

          {/* New Arrivals */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>New Arrivals (신상품)</span>
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#18181b' }}>
              {stats.newArrivalsCount || 0}개
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '4px', display: 'block' }}>
              NEW 뱃지 지정 상품
            </span>
          </div>

          {/* Orders */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Orders (전체 주문)</span>
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#faf5ff', color: '#9333ea' }}>
                <Clock size={16} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#18181b' }}>
              {stats.totalOrders || 0}건
            </h2>
            <Link href="/admin/orders" style={{ fontSize: '0.75rem', color: 'var(--accent-sunset)', fontWeight: 600, marginTop: '4px', display: 'block' }}>
              주문 전체 내역 →
            </Link>
          </div>

          {/* Pending Orders */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Pending Orders (처리 대기)</span>
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#b45309' }}>
                <Clock size={16} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>
              {stats.pendingOrdersCount || 0}건
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, marginTop: '4px', display: 'block' }}>
              입금 & 검수 대기중
            </span>
          </div>

          {/* Completed Orders */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Completed Orders (완료)</span>
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#f0fdf4', color: '#15803d' }}>
                <CheckCircle size={16} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>
              {stats.completedOrdersCount || 0}건
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600, marginTop: '4px', display: 'block' }}>
              결제 완료 & 배송 완료
            </span>
          </div>

          {/* Low Stock Products */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Low Stock (품절 임박)</span>
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                <AlertTriangle size={16} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: stats.lowStockCount > 0 ? '#dc2626' : '#18181b' }}>
              {stats.lowStockCount || 0}개
            </h2>
            <Link href="/admin/inventory" style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginTop: '4px', display: 'block' }}>
              재고 보충 관리 →
            </Link>
          </div>
        </div>

        {/* 2. Order Status Pipeline Funnel */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '24px',
            border: '1px solid #e4e4e7',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>주문 처리 단계별 현황</h3>
            <Link href="/admin/orders" style={{ fontSize: '0.8125rem', color: 'var(--accent-sunset)', fontWeight: 600 }}>
              전체 주문 관리 →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
            }}
          >
            {[
              { key: 'pending', label: '결제대기', count: orderStatuses.pending, color: '#b45309', bg: '#fef3c7' },
              { key: 'confirmed', label: '주문접수', count: orderStatuses.confirmed, color: '#0369a1', bg: '#e0f2fe' },
              { key: 'processing', label: '상품준비중', count: orderStatuses.processing, color: '#6d28d9', bg: '#ede9fe' },
              { key: 'shipped', label: '배송중', count: orderStatuses.shipped, color: '#047857', bg: '#d1fae5' },
              { key: 'delivered', label: '배송완료', count: orderStatuses.delivered, color: '#15803d', bg: '#dcfce7' },
              { key: 'cancelled', label: '취소/환불', count: (orderStatuses.cancelled || 0) + (orderStatuses.refunded || 0), color: '#b91c1c', bg: '#fee2e2' },
            ].map((st) => (
              <div
                key={st.key}
                style={{
                  backgroundColor: st.bg,
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: st.color, display: 'block', marginBottom: '4px' }}>
                  {st.label}
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: st.color }}>
                  {st.count || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Grid: Recent Orders & Low Stock Alerts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          {/* Recent Orders Table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '24px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>최근 접수된 주문</h3>
              <Link href="/admin/orders" style={{ fontSize: '0.8125rem', color: 'var(--accent-sunset)', fontWeight: 600 }}>
                전체보기 →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentOrders.map((ord) => {
                const statusInfo = ORDER_STATUS_MAP[ord.order_status] || ORDER_STATUS_MAP['pending'];
                return (
                  <div
                    key={ord.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '6px',
                      backgroundColor: '#fbfbfb',
                      border: '1px solid #f0f0f2',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {ord.order_number}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: '#555' }}>
                          {ord.customer_name}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                        {formatKRW(ord.total_amount)} • {ord.item_count}개 품목
                      </p>
                    </div>

                    <select
                      value={ord.order_status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      style={{
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.text,
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="pending">결제대기</option>
                      <option value="confirmed">주문접수</option>
                      <option value="processing">상품준비중</option>
                      <option value="shipped">배송중</option>
                      <option value="delivered">배송완료</option>
                      <option value="cancelled">주문취소</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Products Warning */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '24px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#b45309" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>재고 부족 알림 ({lowStockItems.length})</h3>
              </div>
              <Link href="/admin/products" style={{ fontSize: '0.8125rem', color: 'var(--accent-sunset)', fontWeight: 600 }}>
                재고 관리 →
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#888', fontSize: '0.875rem' }}>
                모든 상품의 재고가 충분합니다. 👍
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lowStockItems.map((prod) => (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fef3c7',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={prod.images?.[0] || ''}
                        alt=""
                        style={{ width: '36px', height: '44px', objectFit: 'cover', borderRadius: '3px' }}
                      />
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{prod.name_ko}</p>
                        <p style={{ fontSize: '0.75rem', color: '#92400e' }}>
                          SKU: {prod.sku} • 남은 수량: <strong>{prod.stock}개</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleQuickStock(prod.id, 10)}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #fde68a',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#92400e',
                        cursor: 'pointer',
                      }}
                    >
                      +10개 입고
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
