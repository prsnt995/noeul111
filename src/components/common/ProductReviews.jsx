import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Star, Plus, ThumbsUp, X, CheckCircle, MessageSquare } from 'lucide-react';

export function ProductReviews({ productId }) {
  const { lang, t } = useLanguage();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: '5.0', totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    author_name: '',
    rating: 5,
    title: '',
    comment: '',
    image_url: '',
  });

  const fetchReviews = async () => {
    if (!productId) return;
    try {
      const res = await api.get(`/products/${productId}/reviews`);
      if (res.success) {
        setReviews(res.data);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/products/${productId}/reviews`, formData);
      showToast('리뷰가 성공적으로 등록되었습니다. 감사합니다!', 'success');
      setIsWriteModalOpen(false);
      setFormData({ author_name: '', rating: 5, title: '', comment: '', image_url: '' });
      fetchReviews();
    } catch (err) {
      showToast('리뷰 등록에 실패했습니다.', 'error');
    }
  };

  return (
    <div>
      {/* Review Summary Header */}
      <div
        style={{
          backgroundColor: '#fafafa',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e4e4e7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#18181b', lineHeight: 1 }}>
              {summary.averageRating}
            </span>
            <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', marginTop: '6px', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  fill={s <= Math.round(Number(summary.averageRating)) ? '#f59e0b' : 'none'}
                />
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'block', marginTop: '4px' }}>
              {summary.totalReviews}개 리뷰
            </span>
          </div>

          <div style={{ height: '50px', width: '1px', backgroundColor: '#e4e4e7' }} />

          <p style={{ fontSize: '0.875rem', color: '#52525b', lineHeight: 1.5 }}>
            고객님들의 솔직한 실착 후기입니다.<br />
            실제 구매 고객 평점 만족도 <strong>98%</strong>를 기록 중입니다.
          </p>
        </div>

        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="btn-primary"
          style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 20px', fontSize: '0.875rem' }}
        >
          <Plus size={16} />
          <span>리뷰 작성하기</span>
        </button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>리뷰를 불러오는 중...</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
          <MessageSquare size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
          <p>아직 등록된 첫 리뷰가 없습니다. 첫 리뷰를 작성해보세요!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{
                borderBottom: '1px solid #f0f0f2',
                paddingBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '1px', color: '#f59e0b' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} fill={s <= r.rating ? '#f59e0b' : 'none'} />
                    ))}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.author_name}</span>
                  {r.is_featured ? (
                    <span style={{ fontSize: '0.6875rem', backgroundColor: 'var(--accent-sunset)', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                      BEST REVIEW
                    </span>
                  ) : null}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>
                  {r.created_at?.split('T')[0] || r.created_at?.split(' ')[0]}
                </span>
              </div>

              {r.title && <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '6px' }}>{r.title}</h4>}
              <p style={{ fontSize: '0.875rem', color: '#333', lineHeight: 1.6 }}>{r.comment}</p>

              {r.image_url && (
                <div style={{ marginTop: '12px' }}>
                  <img
                    src={r.image_url}
                    alt=""
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Write Review Modal */}
      {isWriteModalOpen && (
        <div className="backdrop" onClick={() => setIsWriteModalOpen(false)} style={{ zIndex: 110 }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              margin: '60px auto',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>상품 리뷰 작성</h3>
              <button onClick={() => setIsWriteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Star Rating Picker */}
              <div>
                <label className="form-label">별점 평가 *</label>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                      <Star
                        size={28}
                        color="#f59e0b"
                        fill={star <= formData.rating ? '#f59e0b' : 'none'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">작성자 이름 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 김민수"
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">리뷰 제목 (선택)</label>
                <input
                  type="text"
                  placeholder="핏이나 소재감에 대한 한 줄 요약"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">솔직한 착용 후기 *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="사이즈, 원단 텍스처, 핏감 등에 대한 상세 후기를 남겨주세요."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">착용 포토 URL (선택)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsWriteModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                  취소
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--accent-sunset)' }}>
                  리뷰 등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
