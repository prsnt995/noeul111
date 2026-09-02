import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { formatKRW } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Tag, Plus, Edit2, Trash2, X, Check, Copy } from 'lucide-react';

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const res = await api.get('/admin/coupons');
      if (res.success) setCoupons(res.data);
    } catch (err) {
      console.error('Fetch coupons error:', err);
      showToast('쿠폰 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

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
      if (isEditMode) {
        await api.put(`/admin/coupons/${editingId}`, formData);
        showToast('쿠폰 정보가 수정되었습니다.', 'success');
      } else {
        await api.post('/admin/coupons', formData);
        showToast('새 할인 쿠폰이 발행되었습니다.', 'success');
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      showToast(err.message || '저장 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 쿠폰을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      showToast('쿠폰이 삭제되었습니다.', 'info');
      fetchCoupons();
    } catch (err) {
      showToast('삭제 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="coupons">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>쿠폰 & 할인 프로모션 관리</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              비율(%) 또는 고정 금액(₩) 할인 쿠폰을 생성하고 사용 조건을 설정합니다.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary"
            style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 20px', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            <span>새 쿠폰 발행</span>
          </button>
        </div>

        {/* Coupons Table */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e4e4e7', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e4e4e7', color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px' }}>쿠폰 코드 / 설명</th>
                  <th style={{ padding: '14px 16px' }}>할인 혜택</th>
                  <th style={{ padding: '14px 16px' }}>최소 주문 금액</th>
                  <th style={{ padding: '14px 16px' }}>사용 현황</th>
                  <th style={{ padding: '14px 16px' }}>상태</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                      쿠폰 데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                      등록된 쿠폰이 없습니다.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f2' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1rem', color: 'var(--accent-sunset)', backgroundColor: '#fff1f2', padding: '3px 8px', borderRadius: '4px' }}>
                          {c.code}
                        </span>
                        <p style={{ fontSize: '0.8125rem', color: '#18181b', marginTop: '6px', fontWeight: 600 }}>{c.description_ko}</p>
                        <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{c.description_en}</span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#18181b' }}>
                          {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `${formatKRW(c.discount_value)} 할인`}
                        </span>
                        {c.max_discount_amount && (
                          <span style={{ fontSize: '0.6875rem', color: '#888', display: 'block' }}>
                            최대 {formatKRW(c.max_discount_amount)}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', color: '#52525b' }}>
                        {c.min_order_amount > 0 ? `${formatKRW(c.min_order_amount)} 이상` : '제한 없음'}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600 }}>{c.times_used || 0}</span> / {c.usage_limit}회
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: c.is_active ? '#dcfce7' : '#f4f4f5',
                            color: c.is_active ? '#166534' : '#71717a',
                            fontWeight: 700,
                          }}
                        >
                          {c.is_active ? '사용가능' : '비활성'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(c)}
                            style={{ padding: '6px 10px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Edit2 size={13} />
                            <span>수정</span>
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{ padding: '6px 10px', backgroundColor: '#fee2e2', borderRadius: '4px', fontSize: '0.8125rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={13} />
                            <span>삭제</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="backdrop" onClick={() => setIsModalOpen(false)} style={{ zIndex: 100 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '560px',
                margin: '60px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {isEditMode ? '쿠폰 정보 수정' : '새 쿠폰 발행'}
                </h3>
                <button onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
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
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                      className="form-input"
                    />
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    취소
                  </button>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)' }}>
                    발행하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
