import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Plus, Edit2, Trash2, FolderTree, X, AlertCircle } from 'lucide-react';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    slug: '',
    name_ko: '',
    name_en: '',
    description_ko: '',
    description_en: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Fetch categories failed:', err);
      showToast('카테고리를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      slug: '',
      name_ko: '',
      name_en: '',
      description_ko: '',
      description_en: '',
      image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop',
      sort_order: categories.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setIsEditMode(true);
    setEditingId(cat.id);
    setFormData({
      slug: cat.slug,
      name_ko: cat.name_ko,
      name_en: cat.name_en,
      description_ko: cat.description_ko || '',
      description_en: cat.description_en || '',
      image_url: cat.image_url || '',
      sort_order: cat.sort_order || 0,
      is_active: Boolean(cat.is_active),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/admin/categories/${editingId}`, formData);
        showToast('카테고리가 수정되었습니다.', 'success');
      } else {
        await api.post('/admin/categories', formData);
        showToast('새 카테고리가 등록되었습니다.', 'success');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      showToast(err.message || '저장 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/categories/${id}`);
      showToast('카테고리가 삭제되었습니다.', 'info');
      setDeleteConfirmId(null);
      fetchCategories();
    } catch (err) {
      showToast(err.message || '삭제 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="categories">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>카테고리 관리 (Category Management)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              상품 분류 카테고리 추가, 영문/한글명 설정, 배너 이미지 및 노출 순서 관리
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary"
            style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 18px', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            <span>새 카테고리 추가</span>
          </button>
        </div>

        {/* Categories Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #e4e4e7',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ position: 'relative', height: '160px', backgroundColor: '#eee' }}>
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop'}
                  alt={cat.name_ko}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: '#ffffff',
                    fontSize: '0.6875rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  slug: {cat.slug}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: '#ffffff',
                    color: '#18181b',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  등록 상품: {cat.product_count || 0}개
                </span>
              </div>

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '2px' }}>
                    {cat.name_ko} <span style={{ fontSize: '0.875rem', color: '#71717a', fontWeight: 400 }}>({cat.name_en})</span>
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#71717a', lineHeight: 1.5, marginTop: '8px' }}>
                    {cat.description_ko || '설명 없음'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f0f0f2' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>
                    노출 순서: <strong>{cat.sort_order}</strong>
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(cat)}
                      style={{ padding: '6px 10px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontSize: '0.8125rem', color: '#18181b', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit2 size={13} />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(cat.id)}
                      style={{ padding: '6px 10px', backgroundColor: '#fee2e2', borderRadius: '4px', fontSize: '0.8125rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={13} />
                      <span>삭제</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Delete Confirmation */}
        {deleteConfirmId && (
          <div className="backdrop" onClick={() => setDeleteConfirmId(null)} style={{ zIndex: 110 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '420px',
                margin: '120px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '28px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <AlertCircle size={24} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>카테고리를 삭제하시겠습니까?</h3>
              <p style={{ fontSize: '0.875rem', color: '#71717a', marginBottom: '24px' }}>
                카테고리에 속한 상품이 있을 경우 삭제할 수 없습니다.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary" style={{ flex: 1 }}>
                  취소
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="btn-primary"
                  style={{ flex: 1, backgroundColor: '#dc2626' }}
                >
                  확인 및 삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
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
                  {isEditMode ? '카테고리 수정' : '새 카테고리 추가'}
                </h3>
                <button onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">영문 슬러그 (Slug) *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                    placeholder="e.g. outerwear, knitwear"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">한글 카테고리명 *</label>
                    <input
                      type="text"
                      required
                      value={formData.name_ko}
                      onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
                      placeholder="예: 아우터"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">영문 카테고리명 *</label>
                    <input
                      type="text"
                      required
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      placeholder="e.g. Outerwear"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">배너 이미지 URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">한글 설명</label>
                  <input
                    type="text"
                    value={formData.description_ko}
                    onChange={(e) => setFormData({ ...formData, description_ko: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">노출 순서 (숫자 낮을수록 앞)</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <span>활성화 (Active)</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    취소
                  </button>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)' }}>
                    저장하기
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
