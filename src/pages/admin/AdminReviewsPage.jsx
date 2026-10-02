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
import { useToast } from '../../context/ToastContext.jsx';
import { Star, Trash2, Sparkles } from 'lucide-react';

const PAGE_SIZE = 20;

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: 'created_at', dir: 'desc' });
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const { showToast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const qs = buildListParams({ page, pageSize: PAGE_SIZE, search: search.trim(), sort: sort.key, dir: sort.dir, status });
      const res = await adminApi.get(`/admin/reviews${qs}`);
      const { data, total: t } = normalizeListResponse(res, page, PAGE_SIZE);
      setReviews(data);
      setTotal(t);
    } catch (err) {
      console.error('Fetch reviews error:', err);
      setErrorMsg(err?.message || '리뷰 목록을 불러오지 못했습니다.');
      showToast('리뷰 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, sort, status]);

  const handleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
    setPage(1);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const prev = reviews;
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, is_approved: !currentStatus } : r)));
    try {
      const res = await adminApi.patch(`/admin/reviews/${id}/status`, { is_approved: !currentStatus });
      showToast(res.message, 'success');
    } catch (err) {
      setReviews(prev);
      showToast(err?.message || '상태 변경 실패', 'error');
    }
  };

  const handleToggleFeature = async (id, currentFeature) => {
    const prev = reviews;
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, is_featured: !currentFeature } : r)));
    try {
      const res = await adminApi.patch(`/admin/reviews/${id}/feature`, { is_featured: !currentFeature });
      showToast(res.message, 'success');
    } catch (err) {
      setReviews(prev);
      showToast(err?.message || '추천 상태 변경 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.delete(`/admin/reviews/${id}`);
      showToast('리뷰가 삭제되었습니다.', 'info');
      setDeleteId(null);
      fetchReviews();
    } catch (err) {
      showToast(err?.message || '삭제 실패', 'error');
    }
  };

  const columns = [
    {
      key: 'product',
      label: '대상 상품 Product',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {r.product_images?.[0] && (
            <img src={r.product_images[0]} alt="" style={{ width: '38px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
          )}
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.8125rem', margin: 0 }}>{r.product_name_ko || '상품'}</p>
            <span style={{ fontSize: '0.6875rem', color: '#888', fontFamily: 'monospace' }}>SKU: {r.product_sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'author',
      label: '작성자 / 별점 Author',
      render: (r) => (
        <div>
          <p style={{ fontWeight: 600, margin: 0 }}>{r.author_name}</p>
          <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', marginTop: '2px' }} role="img" aria-label={`${r.rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={13} fill={s <= r.rating ? '#f59e0b' : 'none'} aria-hidden />
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'comment',
      label: '리뷰 내용 Review',
      render: (r) => (
        <div style={{ maxWidth: '320px' }}>
          {r.title && <p style={{ fontWeight: 700, fontSize: '0.8125rem', margin: '0 0 2px' }}>{r.title}</p>}
          <p style={{ fontSize: '0.8125rem', color: '#444', lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {r.comment}
          </p>
          {r.image_url && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--adm-accent)', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
              [포토 리뷰 첨부됨 Photo attached]
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'rating',
      label: '별점 Rating',
      sortable: true,
      render: (r) => <strong>{r.rating} / 5</strong>,
    },
    {
      key: 'status',
      label: '상태 Status',
      render: (r) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(r.id, r.is_approved)}
          aria-label={`${r.is_approved ? 'Hide review 리뷰 숨기기' : 'Approve review 리뷰 승인'}`}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <StatusPill status={r.is_approved ? 'delivered' : 'cancelled'} label={r.is_approved ? '노출 승인 Approved' : '비공개 Hidden'} />
        </button>
      ),
    },
    {
      key: 'featured',
      label: '메인 추천 Featured',
      render: (r) => (
        <button
          type="button"
          onClick={() => handleToggleFeature(r.id, r.is_featured)}
          aria-label={`${r.is_featured ? 'Remove feature 추천 해제' : 'Feature review 추천 지정'}`}
          style={{
            fontSize: '0.75rem', padding: '3px 8px', borderRadius: '9999px', fontWeight: 700,
            backgroundColor: r.is_featured ? '#fff1f2' : '#f4f4f5',
            color: r.is_featured ? 'var(--adm-accent)' : '#71717a',
            border: '1px solid #e4e4e7', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
          }}
        >
          <Sparkles size={12} aria-hidden />
          <span>{r.is_featured ? 'BEST 추천중' : '일반'}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      label: '관리 Actions',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          className="adm-btn"
          style={{ padding: '6px 8px', color: '#dc2626', borderColor: '#fca5a5' }}
          onClick={() => setDeleteId(r.id)}
          aria-label="Delete review 리뷰 삭제"
        >
          <Trash2 size={14} aria-hidden />
        </button>
      ),
    },
  ];

  return (
    <AdminLayout activePage="reviews">
      <PageHeader
        ko="고객 리뷰 관리"
        en="Customer Reviews"
        desc="고객이 작성한 상품 평점 및 포토 리뷰 검수, 노출 승인, 베스트 추천 설정을 관리합니다."
      />

      <ErrorBanner message={errorMsg ? `리뷰 로드 실패: ${errorMsg}` : ''} onRetry={fetchReviews} />

      <Filters
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="리뷰 내용 검색 Search reviews…"
        selects={[
          {
            name: 'status', value: status, onChange: (v) => { setStatus(v); setPage(1); }, ariaLabel: '리뷰 상태 Review status',
            options: [
              { value: 'all', label: '전체 상태 All' },
              { value: 'approved', label: '노출 승인 Approved' },
              { value: 'pending', label: '검수 대기 Pending' },
              { value: 'featured', label: 'BEST 추천 Featured' },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={reviews}
        loading={loading}
        emptyTitle="등록된 고객 리뷰가 없습니다 No reviews found"
        emptyDesc="검수 대기 중인 리뷰가 없습니다."
        sort={sort}
        onSort={handleSort}
        rowKey={(r) => r.id}
      />

      <div style={{ marginTop: 12 }}>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="리뷰 삭제 Delete review"
        desc="이 리뷰를 삭제하시겠습니까? 삭제된 리뷰는 복구할 수 없습니다."
        confirmLabel="삭제하기 Delete"
        onConfirm={() => handleDelete(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </AdminLayout>
  );
}
