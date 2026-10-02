import AdminPaymentActions from '../../components/admin/AdminPaymentActions.jsx';
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { ManualOrderModal } from '../../components/admin/ManualOrderModal.jsx';
import {
  PageHeader,
  Filters,
  DataTable,
  Pagination,
  ErrorBanner,
  ConfirmModal,
  Drawer,
  StatusPill,
  normalizeListResponse,
  buildListParams,
} from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { toCsv, downloadCsv, csvFilename } from '../../utils/csv.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ORDER_SOURCES, sourceLabel } from '../../utils/orderSources.js';
import {
  Truck,
  Eye,
  ImageIcon,
  Plus,
  Download,
} from 'lucide-react';

const ORDER_STATUS_KO = {
  pending_payment: '결제 대기',
  paid: '결제 완료',
  confirming: '결제 확인 중',
  canceled: '주문 취소',
  pending_verification: '검수 대기',
  pending: '입금 대기',
  confirmed: '결제 완료',
  processing: '상품준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '주문 취소',
  refunded: '반품/환불',
};

const PAYMENT_STATUS_PILL = {
  pending_payment: { ko: '입금 대기', status: 'pending_payment' },
  under_review: { ko: '입금 확인 요청', status: 'pending_payment' },
  paid: { ko: '입금 확인 완료', status: 'paid' },
  failed: { ko: '결제 실패', status: 'canceled' },
};

// Allowed manual transitions (mirrors backend state machine).
const NEXT_STATUSES = {
  pending_payment: ['canceled'],
  paid: ['processing'],
  processing: ['shipped', 'delivered'],
  shipped: ['delivered'],
};

const PAGE_SIZE = 20;

const updateFirestoreOrderStatus = async () => {};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: 'created_at', dir: 'desc' });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [search, setSearch] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();
  const { lang } = useLanguage();

  // Order Details Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Tracking Register Modal
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [courierName, setCourierName] = useState('CJ대한통운');
  const [trackingNumber, setTrackingNumber] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const qs = buildListParams({
        page,
        pageSize: PAGE_SIZE,
        search: search.trim(),
        sort: sort.key,
        dir: sort.dir,
        status: selectedStatus,
        payment_status: selectedPaymentStatus,
        source: selectedSource,
      });
      const res = await adminApi.get(`/admin/orders${qs}`);
      const { data, total: t } = normalizeListResponse(res, page, PAGE_SIZE);
      setOrders(data);
      setTotal(t);
    } catch (err) {
      console.error('Fetch orders error:', err);
      const msg = err?.message || '주문 목록을 불러오지 못했습니다.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, selectedPaymentStatus, selectedSource, page, sort]);

  const resetPage = (fn) => (v) => { fn(v); setPage(1); };

  const handleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'amount' ? 'desc' : 'desc' }));
    setPage(1);
  };

  const handleUpdateStatus = async (id, nextStatus) => {
    try {
      const res = await adminApi.patch(`/admin/orders/${id}/status`, { order_status: nextStatus });
      if (res.success && res.data) {
        await updateFirestoreOrderStatus(res.data.order_number, {
          order_status: res.data.order_status,
          payment_status: res.data.payment_status,
        });
        showToast(res.message, 'success');
        fetchOrders();
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(res.data);
        }
      }
    } catch (err) {
      showToast(err?.message || '상태 변경 실패', 'error');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size === orders.length && orders.length > 0 ? new Set() : new Set(orders.map((o) => o.id))));
  };

  const runBulk = async () => {
    if (!bulkAction) return;
    const target = bulkAction === 'processing' ? 'processing' : 'canceled';
    const guard = bulkAction === 'processing' ? 'paid' : 'pending_payment';
    const ids = [...selectedIds].filter((id) => orders.find((o) => o.id === id)?.order_status === guard);
    if (!ids.length) {
      showToast('해당 작업이 가능한 주문이 선택되지 않았습니다.', 'error');
      setBulkAction(null);
      return;
    }
    setBulkBusy(true);
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        await adminApi.patch(`/admin/orders/${id}/status`, { order_status: target });
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setBulkBusy(false);
    setBulkAction(null);
    setSelectedIds(new Set());
    showToast(fail ? `${ok}건 처리, ${fail}건 실패` : `${ok}건 처리되었습니다.`, fail ? 'error' : 'success');
    fetchOrders();
  };

  const openTrackingModal = (order) => {
    setTrackingModalOrder(order);
    setCourierName(order.courier_name || 'CJ대한통운');
    setTrackingNumber(order.tracking_number || '');
  };

  // CSV export of the current filter (all pages, capped at 1000 rows).
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const base = {
        search: search.trim(),
        sort: sort.key,
        dir: sort.dir,
        status: selectedStatus,
        payment_status: selectedPaymentStatus,
        source: selectedSource,
      };
      const all = [];
      let pageNum = 1;
      for (;;) {
        const qs = buildListParams({ ...base, page: pageNum, pageSize: 200 });
        const res = await adminApi.get(`/admin/orders${qs}`);
        const { data, total: t } = normalizeListResponse(res, pageNum, 200);
        all.push(...(data || []));
        if (all.length >= (t || 0) || !(data || []).length || all.length >= 1000) break;
        pageNum += 1;
      }
      const csv = toCsv(all, [
        { label: '주문번호 Order#', get: (o) => o.order_number },
        { label: '주문일시 Created', get: (o) => String(o.created_at || '').replace('T', ' ').slice(0, 19) },
        { label: '채널 Source', get: (o) => o.order_source || 'website' },
        { label: '고객명 Customer', get: (o) => o.customer_name },
        { label: '연락처 Phone', get: (o) => o.customer_phone },
        { label: '우편번호 Postal', get: (o) => o.postal_code },
        { label: '주소 Address', get: (o) => `${o.address || ''} ${o.detail_address || ''}`.trim() },
        { label: '품목 Items', get: (o) => (o.items || []).map((i) => `${i.product_name_ko || ''} ${i.size || ''}/${i.color || ''} x${i.quantity}`).join(' | ') },
        { label: '상품합계 Subtotal', get: (o) => o.subtotal },
        { label: '할인 Discount', get: (o) => o.discount_amount },
        { label: '배송비 Shipping', get: (o) => o.shipping_fee },
        { label: '총액 Total', get: (o) => o.total_amount },
        { label: '결제상태 Payment', get: (o) => o.payment_status },
        { label: '주문상태 Status', get: (o) => o.order_status },
        { label: '택배사 Courier', get: (o) => o.courier_name },
        { label: '운송장 Tracking', get: (o) => o.tracking_number },
      ]);
      downloadCsv(csvFilename('orders'), csv);
      showToast(`${all.length}건 CSV 다운로드됨 Downloaded`, 'success');
    } catch (err) {
      showToast(err?.message || 'CSV 다운로드 실패', 'error');
    } finally {
      setExporting(false);
    }
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
        await updateFirestoreOrderStatus(res.data.order_number, {
          courier_name: res.data.courier_name,
          tracking_number: res.data.tracking_number,
          order_status: res.data.order_status,
        });

        showToast('운송장 정보가 성공적으로 등록되었습니다.', 'success');
        setTrackingModalOrder(null);
        fetchOrders();
      }
    } catch (err) {
      showToast(err?.message || '운송장 등록 실패', 'error');
    }
  };

  const bulkEligible = (guard) => orders.filter((o) => selectedIds.has(o.id) && o.order_status === guard).length;

  const columns = [
    {
      key: 'order',
      label: '주문번호 / 일시 Order',
      render: (ord) => (
        <div>
          <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#18181b' }}>{ord.order_number}</span>
          <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block', marginTop: '2px' }}>
            {ord.created_at?.replace('T', ' ')?.slice(0, 16)}
          </span>
          <span
            style={{
              display: 'inline-block', marginTop: '4px', fontSize: '0.6875rem', fontWeight: 700,
              padding: '2px 7px', borderRadius: '10px',
              backgroundColor: (ord.order_source && ord.order_source !== 'website') ? '#ede9fe' : '#f4f4f5',
              color: (ord.order_source && ord.order_source !== 'website') ? '#5b21b6' : '#52525b',
            }}
          >
            {sourceLabel(ord.order_source || 'website', 'ko')} · {sourceLabel(ord.order_source || 'website', 'en')}
          </span>
          {ord.source_detail && (
            <span style={{ fontSize: '0.6875rem', color: '#71717a', display: 'block', marginTop: '2px' }}>{ord.source_detail}</span>
          )}
        </div>
      ),
    },
    {
      key: 'customer',
      label: '고객 / 입금자 Customer',
      render: (ord) => (
        <div>
          <p style={{ fontWeight: 600, color: '#18181b', margin: 0 }}>{ord.customer_name}</p>
          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
            입금자: <strong>{ord.payment_sender_name || ord.customer_name}</strong>
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: '주문 금액 Amount',
      sortable: true,
      render: (ord) => (
        <div>
          <span style={{ fontWeight: 700, color: '#18181b' }}>{formatKRW(ord.total_amount)}</span>
          <span style={{ fontSize: '0.6875rem', color: '#888', display: 'block' }}>{ord.items?.length}개 품목</span>
        </div>
      ),
    },
    {
      key: 'payment',
      label: '결제 상태 Payment',
      render: (ord) => {
        const pill = PAYMENT_STATUS_PILL[ord.payment_status] || PAYMENT_STATUS_PILL.pending_payment;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            <StatusPill status={pill.status} label={pill.ko} />
            {ord.payment_receipt_url && (
              <button
                type="button"
                onClick={() => setSelectedOrder(ord)}
                style={{ fontSize: '0.6875rem', color: 'var(--adm-accent)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px', padding: 0 }}
              >
                <ImageIcon size={12} aria-hidden />
                <span>영수증 보기 Receipt</span>
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'order_status',
      label: '주문 상태 Status',
      render: (ord) => (
        <select
          value={ord.order_status}
          onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
          className="adm-select"
          style={{ fontSize: '0.8125rem', fontWeight: 700, padding: '5px 8px' }}
          aria-label={`${ord.order_number} 상태 변경`}
        >
          <option value={ord.order_status}>{ORDER_STATUS_KO[ord.order_status] || ord.order_status}</option>
          {(NEXT_STATUSES[ord.order_status] || []).map((status) => (
            <option key={status} value={status}>{ORDER_STATUS_KO[status] || status}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'tracking',
      label: '운송장 Tracking',
      render: (ord) => (
        ord.tracking_number ? (
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{ord.courier_name}</span>
            <p style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: '#555', margin: 0 }}>{ord.tracking_number}</p>
          </div>
        ) : (
          <button type="button" className="adm-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => openTrackingModal(ord)}>
            + 운송장 등록
          </button>
        )
      ),
    },
    {
      key: 'actions',
      label: '관리 Actions',
      align: 'right',
      render: (ord) => (
        <button type="button" className="adm-btn" style={{ padding: '6px 12px', fontSize: '0.8125rem' }} onClick={() => setSelectedOrder(ord)}>
          <Eye size={13} aria-hidden />
          <span>상세보기</span>
        </button>
      ),
    },
  ];

  return (
    <AdminLayout activePage="orders">
      <PageHeader
        ko="주문 및 입금 관리"
        en="Orders & Payments"
        desc="고객 무통장 입금 영수증 검수, 주문 확정, 배송 처리 및 운송장 등록"
        actions={(
          <>
            <button type="button" className="adm-btn" onClick={handleExportCsv} disabled={exporting}>
              <Download size={15} aria-hidden />
              <span>{exporting ? '내보내는 중…' : 'CSV 다운로드 Export'}</span>
            </button>
            <button type="button" className="adm-btn adm-btn-primary" onClick={() => setShowManual(true)}>
              <Plus size={16} aria-hidden />
              <span>{lang === 'en' ? 'New Manual Order' : '외부 주문 등록'}</span>
            </button>
          </>
        )}
      />

      <ErrorBanner message={errorMsg ? `주문 로드 실패: ${errorMsg}` : ''} onRetry={fetchOrders} />

      <Filters
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="주문번호, 고객명, 입금자명, 연락처 Search…"
        selects={[
          {
            name: 'source', value: selectedSource, onChange: resetPage(setSelectedSource), ariaLabel: '주문 채널 Channel',
            options: [{ value: 'all', label: lang === 'en' ? 'All channels' : '전체 채널' },
              ...ORDER_SOURCES.map((s) => ({ value: s, label: `${sourceLabel(s, 'ko')} (${sourceLabel(s, 'en')})` }))],
          },
          {
            name: 'payment_status', value: selectedPaymentStatus, onChange: resetPage(setSelectedPaymentStatus), ariaLabel: '결제 상태 Payment status',
            options: [
              { value: 'all', label: '전체 결제 상태 All' },
              { value: 'under_review', label: '⭐ 입금 확인 요청 (검수 대기중)' },
              { value: 'pending_payment', label: '입금 대기 Pending' },
              { value: 'paid', label: '입금 확인 완료 Paid' },
            ],
          },
          {
            name: 'status', value: selectedStatus, onChange: resetPage(setSelectedStatus), ariaLabel: '주문 상태 Order status',
            options: [
              { value: 'all', label: '전체 주문 상태 All' },
              { value: 'pending_verification', label: '검수 대기' },
              { value: 'confirmed', label: '결제 완료' },
              { value: 'processing', label: '상품준비중' },
              { value: 'shipped', label: '배송중' },
              { value: 'delivered', label: '배송완료' },
              { value: 'canceled', label: '미결제 주문 취소' },
            ],
          },
        ]}
      />

      {selectedIds.size > 0 && (
        <div className="adm-card adm-filter-bar" role="toolbar" aria-label="Bulk actions">
          <strong style={{ fontSize: '0.85rem' }}>{selectedIds.size}개 선택됨 Selected</strong>
          <button type="button" className="adm-btn" onClick={() => setBulkAction('processing')}>
            상품준비중으로 이동 ({bulkEligible('paid')}건 가능)
          </button>
          <button type="button" className="adm-btn" onClick={() => setBulkAction('cancel')}>
            주문 취소 ({bulkEligible('pending_payment')}건 가능)
          </button>
          <button type="button" className="adm-btn" onClick={() => setSelectedIds(new Set())}>선택 해제</button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={orders}
        loading={loading}
        emptyTitle="해당 조건의 주문 내역이 없습니다 No orders found"
        emptyDesc="필터를 조정하거나 외부 주문을 등록하세요."
        sort={sort}
        onSort={handleSort}
        rowKey={(r) => r.id}
        selectable
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleSelectAll}
      />

      <div style={{ marginTop: 12 }}>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </div>

      <ConfirmModal
        open={!!bulkAction}
        title={bulkAction === 'processing' ? '일괄 상품준비중 처리 Bulk → Processing' : '일괄 주문 취소 Bulk Cancel'}
        desc={bulkAction === 'processing'
          ? `결제 완료(paid) 상태 ${bulkEligible('paid')}건이 상품준비중으로 이동합니다. 다른 상태는 건너뜁니다.`
          : `미결제(pending_payment) 상태 ${bulkEligible('pending_payment')}건이 취소됩니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel={bulkBusy ? '처리 중…' : bulkAction === 'processing' ? '이동하기 Move' : '취소하기 Cancel orders'}
        onConfirm={runBulk}
        onClose={() => (bulkBusy ? null : setBulkAction(null))}
      />

      {/* Order Details Drawer */}
      <Drawer
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="주문 상세 내역 & 입금 검수 Order Detail"
        subtitle={selectedOrder ? `${selectedOrder.order_number}` : ''}
      >
        {selectedOrder && (
          <div style={{ display: 'grid', gap: 16 }}>
            <AdminPaymentActions key={selectedOrder.id} orderId={selectedOrder.id} />

            <div className="adm-card" style={{ padding: 16, fontSize: '0.875rem', lineHeight: 1.7 }}>
              <p style={{ margin: 0 }}><strong>수령인:</strong> {selectedOrder.customer_name} ({selectedOrder.customer_phone})</p>
              <p style={{ margin: 0 }}><strong>이메일:</strong> {selectedOrder.customer_email || '미입력'}</p>
              <p style={{ margin: 0 }}><strong>배송 주소:</strong> [{selectedOrder.postal_code}] {selectedOrder.address} {selectedOrder.detail_address}</p>
              <p style={{ margin: 0 }}><strong>배송 메모:</strong> {selectedOrder.shipping_memo || '없음'}</p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 12px' }}>주문 품목 내역 Items</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid #f0f0f2', paddingBottom: '10px' }}>
                    {item.image_url && <img src={item.image_url} alt="" style={{ width: '48px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{item.product_name_ko}</p>
                      <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0 }}>{item.size} / {item.color} • {item.quantity}개</p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{formatKRW(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>상품 합계 Subtotal:</span>
                <span>{formatKRW(selectedOrder.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>배송비 Shipping:</span>
                <span>{formatKRW(selectedOrder.shipping_fee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, borderTop: '1px dashed #e4e4e7', paddingTop: '10px' }}>
                <span>최종 결제 금액 Total:</span>
                <span style={{ color: 'var(--adm-accent)' }}>{formatKRW(selectedOrder.total_amount)}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Tracking Number Register Modal */}
      {trackingModalOrder && (
        <>
          <div className="adm-backdrop" onClick={() => setTrackingModalOrder(null)} />
          <div className="adm-modal" role="dialog" aria-modal="true" aria-label="운송장 등록 Tracking">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck size={20} aria-hidden color="var(--adm-accent)" />
              운송장 등록 &amp; 배송 시작 Tracking
            </h2>
            <p className="adm-modal-sub">{trackingModalOrder.order_number}</p>
            <form onSubmit={handleSaveTracking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="adm-label" htmlFor="adm-courier">택배사 선택 Courier</label>
                <select id="adm-courier" value={courierName} onChange={(e) => setCourierName(e.target.value)} className="adm-select" style={{ width: '100%' }}>
                  <option value="CJ대한통운">CJ대한통운</option>
                  <option value="우체국택배">우체국택배</option>
                  <option value="롯데택배">롯데택배</option>
                  <option value="한진택배">한진택배</option>
                  <option value="로젠택배">로젠택배</option>
                </select>
              </div>
              <div>
                <label className="adm-label" htmlFor="adm-tracking">운송장 번호 (숫자) Tracking number</label>
                <input
                  id="adm-tracking"
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="예: 682948192039"
                  className="adm-input"
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0 }}>
                * 운송장 등록 시 주문 상태가 즉시 <strong>&apos;배송중(Shipped)&apos;</strong>으로 변경되고 고객에게 배송 알림이 발송됩니다.
              </p>
              <div className="adm-modal-actions">
                <button type="button" className="adm-btn" onClick={() => setTrackingModalOrder(null)}>취소 Cancel</button>
                <button type="submit" className="adm-btn adm-btn-primary">등록 및 배송 시작</button>
              </div>
            </form>
          </div>
        </>
      )}

      {showManual && (
        <ManualOrderModal
          onClose={() => setShowManual(false)}
          onCreated={() => fetchOrders()}
        />
      )}
    </AdminLayout>
  );
}
