import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Star, Eye, EyeOff, Trash2, Sparkles, Check, X } from 'lucide-react';

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reviews');
      if (res.success) setReviews(res.data);
    } catch (err) {
      console.error('Fetch reviews error:', err);
      showToast('리뷰 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/admin/reviews/${id}/status`, { is_approved: !currentStatus });
      showToast(res.message, 'success');
      fetchReviews();
    } catch (err) {
      showToast('상태 변경 실패', 'error');
    }
  };

  const handleToggleFeature = async (id, currentFeature) => {
    try {
      const res = await api.patch(`/admin/reviews/${id}/feature`, { is_featured: !currentFeature });
      showToast(res.message, 'success');
      fetchReviews();
    } catch (err) {
      showToast('추천 상태 변경 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 리뷰를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      showToast('리뷰가 삭제되었습니다.', 'info');
      fetchReviews();
    } catch (err) {
      showToast('삭제 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="reviews">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>고객 리뷰 관리 (Customer Reviews)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              고객이 작성한 상품 평점 및 포토 리뷰 검수, 노출 승인, 베스트 추천 설정을 관리합니다.
            </p>
          </div>
        </div>

        {/* Reviews List */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e4e4e7', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e4e4e7', color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px' }}>대상 상품</th>
                  <th style={{ padding: '14px 16px' }}>작성자 / 별점</th>
                  <th style={{ padding: '14px 16px' }}>리뷰 내용</th>
                  <th style={{ padding: '14px 16px' }}>상태</th>
                  <th style={{ padding: '14px 16px' }}>메인 추천</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                      리뷰 데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                      등록된 고객 리뷰가 없습니다.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f2' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {r.product_images?.[0] && (
                            <img src={r.product_images[0]} alt="" style={{ width: '38px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                          )}
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{r.product_name_ko || '상품'}</p>
                            <span style={{ fontSize: '0.6875rem', color: '#888', fontFamily: 'monospace' }}>SKU: {r.product_sku}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontWeight: 600 }}>{r.author_name}</p>
                        <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', marginTop: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={13} fill={s <= r.rating ? '#f59e0b' : 'none'} />
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', maxWidth: '320px' }}>
                        {r.title && <p style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '2px' }}>{r.title}</p>}
                        <p style={{ fontSize: '0.8125rem', color: '#444', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {r.comment}
                        </p>
                        {r.image_url && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--accent-sunset)', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                            [포토 리뷰 첨부됨]
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleToggleStatus(r.id, r.is_approved)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: r.is_approved ? '#dcfce7' : '#fee2e2',
                            color: r.is_approved ? '#166534' : '#991b1b',
                            fontWeight: 700,
                          }}
                        >
                          {r.is_approved ? '노출 승인' : '비공개'}
                        </button>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleToggleFeature(r.id, r.is_featured)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: r.is_featured ? '#fff1f2' : '#f4f4f5',
                            color: r.is_featured ? 'var(--accent-sunset)' : '#71717a',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Sparkles size={12} />
                          <span>{r.is_featured ? 'BEST 추천중' : '일반'}</span>
                        </button>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(r.id)}
                          style={{ padding: '6px 8px', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#dc2626' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
