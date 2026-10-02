import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  PageHeader,
  Filters,
  DataTable,
  Pagination,
  ErrorBanner,
  ConfirmModal,
  StatusPill,
  normalizeListResponse,
  buildListParams,
} from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const PAGE_SIZE = 20;

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: 'code', dir: 'asc' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    description_ko: '',
    description_en: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: '',
    start_date: '',
    end_date: '',
    usage_limit: 1000,
    is_active: true,
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const qs = buildListParams({ page, pageSize: PAGE_SIZE, search: search.trim(), sort: sort.key, dir: sort.dir });
      const res = await adminApi.get(`/admin/coupons${qs}`);
      const { data, total: t } = normalizeListResponse(res, page, PAGE_SIZE);
      setCoupons(data);
      setTotal(t);
    } catch (err) {
      console.error('Fetch coupons error:', err);
      setErrorMsg(err?.message || '쿠폰 목록을 불러오지 못했습니다.');
      showToast('쿠폰 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page, sort]);

  const handleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
    setPage(1);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      code: '',
      description_ko: '',
      description_en: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 50000,
      max_discount_amount: 50000,
      start_date: '',
      end_date: '',
      usage_limit: 500,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setIsEditMode(true);
    setEditingId(c.id);
    setFormData({
      code: c.code,
      description_ko: c.description_ko || '',
      description_en: c.description_en || '',
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount || 0,
      max_discount_amount: c.max_discount_amount || '',
      start_date: c.start_date || '',
      end_date: c.end_date || '',
      usage_limit: c.usage_limit || 1000,
      is_active: Boolean(c.is_active),
    });
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        discount_value: Number(formData.discount_value),
        min_order_amount: Number(formData.min_order_amount) || 0,
        max_discount_amount: formData.max_discount_amount === '' || formData.max_discount_amount == null ? '' : Number(formData.max_discount_amount),
      };
      if (payload.discount_type === 'percentage' && (!Number.isInteger(payload.discount_value) || payload.discount_value < 1 || payload.discount_value > 100)) {
        showToast('비율 할인은 1~100% 사이의 정수로 입력하세요.', 'error');
        return;
      }
      if (payload.discount_type === 'fixed' && (!Number.isInteger(payload.discount_value) || payload.discount_value <= 0)) {
        showToast('고정 금액 할인은 1원 이상의 정수로 입력하세요.', 'error');
        return;
      }
      if (isEditMode) {
        await adminApi.put(`/admin/coupons/${editingId}`, payload);
        showToast('쿠폰 정보가 수정되었습니다.', 'success');
      } else {
        await adminApi.post('/admin/coupons', payload);
        showToast('새 할인 쿠폰이 발행되었습니다.', 'success');
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      showToast(err.message || '저장 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.delete(`/admin/coupons/${id}`);
      showToast('쿠폰이 삭제되었습니다.', 'info');
      setDeleteId(null);
      fetchCoupons();
    } catch (err) {
      showToast(err?.message || '삭제 실패', 'error');
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`쿠폰 코드 ${code} 복사됨`, 'info');
    } catch {
      showToast('복사에 실패했습니다.', 'error');
    }
  };

  const columns = [
    {
      key: 'code',
      label: '쿠폰 코드 / 설명 Code',
      sortable: true,
      render: (c) => (
        <div>
          <button
            type="button"
            onClick={() => copyCode(c.code)}
            title="클릭하여 코드 복사 Click to copy"
            style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1rem', color: 'var(--adm-accent)', backgroundColor: '#fff1f2', padding: '3px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          >
            {c.code}
          </button>
          <p style={{ fontSize: '0.8125rem', color: '#18181b', marginTop: '6px', fontWeight: 600, marginBottom: 0 }}>{c.description_ko}</p>
          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{c.description_en}</span>
        </div>
      ),
    },
    {
      key: 'benefit',
      label: '할인 혜택 Benefit',
      render: (c) => (
        <div>
          <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#18181b' }}>
            {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `${formatKRW(c.discount_value)} 할인`}
          </span>
          {c.max_discount_amount && (
            <span style={{ fontSize: '0.6875rem', color: '#888', display: 'block' }}>
              최대 {formatKRW(c.max_discount_amount)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'min',
      label: '최소 주문 금액 Minimum',
      render: (c) => (
        <span style={{ color: '#52525b' }}>
          {c.min_order_amount > 0 ? `${formatKRW(c.min_order_amount)} 이상` : '제한 없음 None'}
        </span>
      ),
    },
    {
      key: 'usage',
      label: '사용 현황 Usage',
      render: (c) => <span><strong>{c.times_used || 0}</strong> / {c.usage_limit}회</span>,
    },
    {
      key: 'status',
      label: '상태 Status',
      render: (c) => (
        <StatusPill status={c.is_active ? 'delivered' : 'neutral'} label={c.is_active ? '사용가능 Active' : '비활성 Inactive'} />
      ),
    },
    {
      key: 'actions',
      label: '관리 Actions',
      align: 'right',
      render: (c) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={() => openEditModal(c)} className="adm-btn" style={{ padding: '6px 10px', fontSize: '0.8125rem' }}>
            <Edit2 size={13} aria-hidden />
            <span>수정</span>
          </button>
          <button type="button" onClick={() => setDeleteId(c.id)} className="adm-btn" style={{ padding: '6px 10px', fontSize: '0.8125rem', color: '#dc2626', borderColor: '#fca5a5' }}>
            <Trash2 size={13} aria-hidden />
            <span>삭제</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout activePage="coupons">
      <PageHeader
        ko="쿠폰 & 할인 프로모션 관리"
        en="Coupons & Promotions"
        desc="비율(%) 또는 고정 금액(₩) 할인 쿠폰을 생성하고 사용 조건을 설정합니다. 코드를 클릭하면 복사됩니다."
        actions={(
          <button type="button" className="adm-btn adm-btn-primary" onClick={openAddModal}>
            <Plus size={16} aria-hidden />
            <span>새 쿠폰 발행 New coupon</span>
          </button>
        )}
      />

      <ErrorBanner message={errorMsg ? `쿠폰 로드 실패: ${errorMsg}` : ''} onRetry={fetchCoupons} />

      <Filters
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="쿠폰 코드 검색 Search code…"
      />

      <DataTable
        columns={columns}
        rows={coupons}
        loading={loading}
        emptyTitle="등록된 쿠폰이 없습니다 No coupons found"
        emptyDesc="새 쿠폰을 발행해 보세요."
        sort={sort}
        onSort={handleSort}
        rowKey={(r) => r.id}
      />

      <div style={{ marginTop: 12 }}>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="쿠폰 삭제 Delete coupon"
        desc="이 쿠폰을 삭제하시겠습니까? 삭제된 쿠폰은 복구할 수 없습니다."
        confirmLabel="삭제하기 Delete"
        onConfirm={() => handleDelete(deleteId)}
        onClose={() => setDeleteId(null)}
      />

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <>
            <div className="adm-backdrop" onClick={() => setIsModalOpen(false)} />
            <div className="adm-modal" role="dialog" aria-modal="true" aria-label={isEditMode ? '쿠폰 정보 수정 Edit coupon' : '새 쿠폰 발행 New coupon'} style={{ maxWidth: 560 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <h2>
                  {isEditMode ? '쿠폰 정보 수정 Edit coupon' : '새 쿠폰 발행 New coupon'}
                </h2>
                <button type="button" className="adm-icon-btn" onClick={() => setIsModalOpen(false)} aria-label="Close dialog">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">쿠폰 코드 (대문자 및 숫자) *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="예: SUMMER20, WELCOME10"
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">할인 유형 *</label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                      className="form-select"
                    >
                      <option value="percentage">비율 할인 (% Discount)</option>
                      <option value="fixed">고정 금액 할인 (₩ Amount Discount)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      할인 수치 ({formData.discount_type === 'percentage' ? '%' : '₩'}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={formData.discount_type === 'percentage' ? 100 : undefined}
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                      className="form-input"
                    />
                    <span style={{ fontSize: '0.6875rem', color: '#71717a' }}>
                      {formData.discount_type === 'percentage' ? '1~100% 정수. 최대 할인 한도로 상한 설정 가능.' : '원 단위 정수.'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">최소 주문 금액 (₩)</label>
                    <input
                      type="number"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">최대 할인 한도 (선택 ₩)</label>
                    <input
                      type="number"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">한글 설명 *</label>
                  <input
                    type="text"
                    required
                    value={formData.description_ko}
                    onChange={(e) => setFormData({ ...formData, description_ko: e.target.value })}
                    placeholder="예: 2026 시즌 오픈 특별 10% 할인"
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">영문 설명</label>
                  <input
                    type="text"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="e.g. 10% off for 2026 season launch"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span style={{ fontSize: '0.875rem' }}>쿠폰 활성화 (Active)</span>
                </div>

                <div className="adm-modal-actions">
                  <button type="button" className="adm-btn" onClick={() => setIsModalOpen(false)}>
                    취소 Cancel
                  </button>
                  <button type="submit" className="adm-btn adm-btn-primary">
                    발행하기 Save
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
    </AdminLayout>
  );
}
