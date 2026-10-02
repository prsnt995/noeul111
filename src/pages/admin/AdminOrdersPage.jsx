import AdminPaymentActions from '../../components/admin/AdminPaymentActions.jsx';
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { ManualOrderModal } from '../../components/admin/ManualOrderModal.jsx';
import { adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ORDER_SOURCES, sourceLabel } from '../../utils/orderSources.js';
import {
  Search,
  Truck,
  Eye,
  X,
  ImageIcon,
  Plus
} from 'lucide-react';

const ORDER_STATUS_MAP = {
  pending_payment: { label: '결제 대기', bg: '#fef3c7', text: '#92400e' },
  paid: { label: '결제 완료', bg: '#dcfce7', text: '#166534' },
  confirming: { label: '결제 확인 중', bg: '#fef3c7', text: '#92400e' },
  canceled: { label: '주문 취소', bg: '#fee2e2', text: '#991b1b' },
  pending_verification: { label: '주문접수 (검수대기)', bg: '#fef3c7', text: '#92400e' },
  pending: { label: '주문접수 (입금대기)', bg: '#fef3c7', text: '#92400e' },
  confirmed: { label: '결제완료 (주문확정)', bg: '#dcfce7', text: '#166534' },
  processing: { label: '상품준비중', bg: '#e0e7ff', text: '#3730a3' },
  shipped: { label: '배송중', bg: '#f3e8ff', text: '#6b21a8' },
  delivered: { label: '배송완료', bg: '#f4f4f5', text: '#27272a' },
  cancelled: { label: '주문취소', bg: '#fee2e2', text: '#991b1b' },
  refunded: { label: '반품/환불', bg: '#ffe4e6', text: '#be123c' },
};

const PAYMENT_STATUS_MAP = {
  pending_payment: { label: '입금 대기', bg: '#fee2e2', text: '#991b1b' },
  under_review: { label: '입금 확인 요청 (영수증 등록됨)', bg: '#fef9c3', text: '#854d0e', highlight: true },
  paid: { label: '입금 확인 완료', bg: '#dcfce7', text: '#166534' },
  failed: { label: '결제 실패', bg: '#fee2e2', text: '#991b1b' },
};

const updateFirestoreOrderStatus = async () => {};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [search, setSearch] = useState('');
  const [showManual, setShowManual] = useState(false);
  const { showToast } = useToast();
  const { lang } = useLanguage();

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Tracking Register Modal
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [courierName, setCourierName] = useState('CJ대한통운');
  const [trackingNumber, setTrackingNumber] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let queryParams = `?status=${selectedStatus}&payment_status=${selectedPaymentStatus}&source=${selectedSource}`;
      if (search.trim()) queryParams += `&search=${encodeURIComponent(search.trim())}`;

      const res = await adminApi.get(`/admin/orders${queryParams}`);
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      showToast('주문 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, selectedPaymentStatus, selectedSource]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (id, nextStatus) => {
    try {
      const res = await adminApi.patch(`/admin/orders/${id}/status`, { order_status: nextStatus });
      if (res.success && res.data) {
        // Sync to Firestore for real-time user notification
        await updateFirestoreOrderStatus(res.data.order_number, {
          order_status: res.data.order_status,
          payment_status: res.data.payment_status
        });

        showToast(res.message, 'success');
        fetchOrders();
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(res.data);
        }
      }
    } catch (err) {
      showToast('상태 변경 실패', 'error');
    }
  };

  const openTrackingModal = (order) => {
    setTrackingModalOrder(order);
    setCourierName(order.courier_name || 'CJ대한통운');
    setTrackingNumber(order.tracking_number || '');
  };

  const handleSaveTracking = async (e) => {
    e.preventDefault();
    if (!trackingModalOrder || !trackingNumber.trim()) return;

    try {
      const res = await adminApi.patch(`/admin/orders/${trackingModalOrder.id}/tracking`, {
        courier_name: courierName,
        tracking_number: trackingNumber.trim(),
        auto_ship: true,
      });

      if (res.success && res.data) {
        // Sync tracking number and shipped status to Firestore
        await updateFirestoreOrderStatus(res.data.order_number, {
          courier_name: res.data.courier_name,
          tracking_number: res.data.tracking_number,
          order_status: res.data.order_status
        });

        showToast('운송장 정보가 성공적으로 등록되었습니다.', 'success');
        setTrackingModalOrder(null);
        fetchOrders();
      }
    } catch (err) {
      showToast('운송장 등록 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="orders">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>주문 및 입금 관리 (Orders & Payments)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              고객 무통장 입금 영수증 검수, 주문 확정, 배송 처리 및 운송장 등록
            </p>
          </div>
          <button
            onClick={() => setShowManual(true)}
            className="btn-primary"
            style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 18px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            <Plus size={16} />
            <span>{lang === 'en' ? 'New Manual Order' : '외부 주문 등록'}</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '18px 24px',
            borderRadius: '10px',
            border: '1px solid #e4e4e7',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Channel / Source Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.875rem' }}
            >
              <option value="all">{lang === 'en' ? 'All channels' : '전체 채널'}</option>
              {ORDER_SOURCES.map(s => (
                <option key={s} value={s}>{sourceLabel(s, 'ko')} ({sourceLabel(s, 'en')})</option>
              ))}
            </select>

            {/* Payment Status Filter */}
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.875rem', fontWeight: 700, borderColor: selectedPaymentStatus === 'under_review' ? '#eab308' : '#e4e4e7' }}
            >
              <option value="all">전체 결제 상태</option>
              <option value="under_review">⭐ 입금 확인 요청 (검수 대기중)</option>
              <option value="pending_payment">입금 대기</option>
              <option value="paid">입금 확인 완료 (Paid)</option>
            </select>

            {/* Order Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.875rem' }}
            >
              <option value="all">전체 주문 상태</option>
              <option value="pending_verification">검수 대기</option>
              <option value="confirmed">결제 완료</option>
              <option value="processing">상품준비중</option>
              <option value="shipped">배송중</option>
              <option value="delivered">배송완료</option>
              <option value="canceled">미결제 주문 취소</option>
            </select>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#999" style={{ position: 'absolute', top: '10px', left: '10px' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="주문번호, 고객명, 입금자명, 연락처"
                className="form-input"
                style={{ padding: '8px 12px 8px 34px', fontSize: '0.875rem', width: '260px' }}
              />
            </div>
            <button type="submit" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
              검색
            </button>
          </form>
        </div>

        {/* Orders Table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e4e4e7',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e4e4e7', color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px' }}>주문번호 / 일시</th>
                  <th style={{ padding: '14px 16px' }}>고객 / 입금자명</th>
                  <th style={{ padding: '14px 16px' }}>주문 금액</th>
                  <th style={{ padding: '14px 16px' }}>결제 및 영수증 상태</th>
                  <th style={{ padding: '14px 16px' }}>주문 상태</th>
                  <th style={{ padding: '14px 16px' }}>운송장</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      주문 내역을 불러오는 중...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      해당 조건의 주문 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    const statusInfo = ORDER_STATUS_MAP[ord.order_status] || ORDER_STATUS_MAP['pending'];
                    const paymentInfo = PAYMENT_STATUS_MAP[ord.payment_status] || PAYMENT_STATUS_MAP['pending_payment'];

                    return (
                      <tr key={ord.id} style={{ borderBottom: '1px solid #f0f0f2', backgroundColor: ord.payment_status === 'under_review' ? '#fffdf0' : '#ffffff' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#18181b' }}>{ord.order_number}</span>
                          <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block', marginTop: '2px' }}>
                            {ord.created_at?.replace('T', ' ')?.slice(0, 16)}
                          </span>
                          <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', backgroundColor: (ord.order_source && ord.order_source !== 'website') ? '#ede9fe' : '#f4f4f5', color: (ord.order_source && ord.order_source !== 'website') ? '#5b21b6' : '#52525b' }}>
                            {sourceLabel(ord.order_source || 'website', 'ko')} · {sourceLabel(ord.order_source || 'website', 'en')}
                          </span>
                          {ord.source_detail && (
                            <span style={{ fontSize: '0.6875rem', color: '#71717a', display: 'block', marginTop: '2px' }}>{ord.source_detail}</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontWeight: 600, color: '#18181b' }}>{ord.customer_name}</p>
                          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
                            입금자: <strong>{ord.payment_sender_name || ord.customer_name}</strong>
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: 700, color: '#18181b' }}>{formatKRW(ord.total_amount)}</span>
                          <span style={{ fontSize: '0.6875rem', color: '#888', display: 'block' }}>
                            {ord.items?.length}개 품목
                          </span>
                        </td>

                        {/* Payment & Screenshot Badge */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: paymentInfo.bg,
                                color: paymentInfo.text,
                                border: ord.payment_status === 'under_review' ? '1px solid #facc15' : 'none',
                              }}
                            >
                              {paymentInfo.label}
                            </span>

                            {ord.payment_receipt_url && (
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                style={{
                                  fontSize: '0.6875rem',
                                  color: 'var(--accent-sunset)',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  padding: 0,
                                }}
                              >
                                <ImageIcon size={12} />
                                <span>영수증 보기</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Order Status Selector */}
                        <td style={{ padding: '14px 16px' }}>
                          <select
                            value={ord.order_status}
                            onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                            style={{
                              backgroundColor: statusInfo.bg,
                              color: statusInfo.text,
                              border: 'none',
                              borderRadius: '4px',
                              padding: '5px 8px',
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <option value={ord.order_status}>{statusInfo.label}</option>
                            {({ pending_payment: ['canceled'], paid: ['processing'], processing: ['shipped', 'delivered'], shipped: ['delivered'] }[ord.order_status] || []).map(status => <option key={status} value={status}>{ORDER_STATUS_MAP[status].label}</option>)}
                          </select>
                        </td>

                        {/* Tracking Info */}
                        <td style={{ padding: '14px 16px' }}>
                          {ord.tracking_number ? (
                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{ord.courier_name}</span>
                              <p style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: '#555' }}>{ord.tracking_number}</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => openTrackingModal(ord)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                backgroundColor: '#f4f4f5',
                                borderRadius: '4px',
                                color: '#52525b',
                                border: '1px solid #e4e4e7',
                                cursor: 'pointer',
                              }}
                            >
                              + 운송장 등록
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={13} />
                            <span>상세보기</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal (With Payment Screenshot Verification) */}
        {selectedOrder && (
          <div className="backdrop" onClick={() => setSelectedOrder(null)} style={{ zIndex: 100 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '720px',
                maxHeight: '90vh',
                margin: '40px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-xl)',
                padding: '32px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e4e4e7', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>주문 상세 내역 & 입금 검수</h3>
                  <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--accent-sunset)' }}>
                    {selectedOrder.order_number}
                  </span>
                </div>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <AdminPaymentActions key={selectedOrder.id} orderId={selectedOrder.id} />

              {/* Customer & Shipping Details */}
              <div style={{ backgroundColor: '#fafafa', padding: '18px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.875rem', lineHeight: 1.7 }}>
                <p><strong>수령인:</strong> {selectedOrder.customer_name} ({selectedOrder.customer_phone})</p>
                <p><strong>이메일:</strong> {selectedOrder.customer_email || '미입력'}</p>
                <p><strong>배송 주소:</strong> [{selectedOrder.postal_code}] {selectedOrder.address} {selectedOrder.detail_address}</p>
                <p><strong>배송 메모:</strong> {selectedOrder.shipping_memo || '없음'}</p>
              </div>

              {/* Items List */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '12px' }}>주문 품목 내역</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid #f0f0f2', paddingBottom: '10px' }}>
                      <img src={item.image_url} alt="" style={{ width: '48px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.product_name_ko}</p>
                        <p style={{ fontSize: '0.75rem', color: '#71717a' }}>{item.size} / {item.color} • {item.quantity}개</p>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{formatKRW(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial summary */}
              <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>상품 합계:</span>
                  <span>{formatKRW(selectedOrder.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>배송비:</span>
                  <span>{formatKRW(selectedOrder.shipping_fee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, borderTop: '1px dashed #e4e4e7', paddingTop: '10px' }}>
                  <span>최종 결제 금액:</span>
                  <span style={{ color: 'var(--accent-sunset)' }}>{formatKRW(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Number Register Modal */}
        {trackingModalOrder && (
          <div className="backdrop" onClick={() => setTrackingModalOrder(null)} style={{ zIndex: 110 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '460px',
                margin: '100px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '28px',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={20} color="var(--accent-sunset)" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>운송장 등록 & 배송 시작</h3>
                </div>
                <button onClick={() => setTrackingModalOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveTracking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">택배사 선택</label>
                  <select
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="form-select"
                  >
                    <option value="CJ대한통운">CJ대한통운</option>
                    <option value="우체국택배">우체국택배</option>
                    <option value="롯데택배">롯데택배</option>
                    <option value="한진택배">한진택배</option>
                    <option value="로젠택배">로젠택배</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">운송장 번호 (숫자)</label>
                  <input
                    type="text"
                    required
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="예: 682948192039"
                    className="form-input"
                  />
                </div>

                <p style={{ fontSize: '0.75rem', color: '#71717a' }}>
                  * 운송장 등록 시 주문 상태가 즉시 <strong>'배송중(Shipped)'</strong>으로 변경되고 고객에게 배송 알림이 발송됩니다.
                </p>

                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setTrackingModalOrder(null)} className="btn-secondary" style={{ flex: 1 }}>
                    취소
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--accent-sunset)' }}>
                    등록 및 배송 시작
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showManual && (
          <ManualOrderModal
            onClose={() => setShowManual(false)}
            onCreated={() => fetchOrders()}
          />
        )}
      </div>
    </AdminLayout>
  );
}
