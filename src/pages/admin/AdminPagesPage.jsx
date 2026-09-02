import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { MediaPickerModal } from '../../components/common/MediaPickerModal.jsx';
import { FileText, Plus, Edit2, Trash2, X, ExternalLink, Eye, EyeOff } from 'lucide-react';

export function AdminPagesPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    slug: '',
    title_ko: '',
    title_en: '',
    banner_image: '',
    content_ko: '',
    content_en: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
  });

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pages');
      if (res.success) setPages(res.data);
    } catch (err) {
      console.error('Fetch pages failed:', err);
      showToast('페이지 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      slug: '',
      title_ko: '',
      title_en: '',
      banner_image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
      content_ko: '<h2>페이지 제목</h2>\n<p>여기에 본문 내용을 작성해주세요.</p>',
      content_en: '<h2>Page Title</h2>\n<p>Write your page content here.</p>',
      meta_title: '',
      meta_description: '',
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setIsEditMode(true);
    setEditingId(p.id);
    setFormData({
      slug: p.slug,
      title_ko: p.title_ko,
      title_en: p.title_en,
      banner_image: p.banner_image || '',
      content_ko: p.content_ko || '',
      content_en: p.content_en || '',
      meta_title: p.meta_title || '',
      meta_description: p.meta_description || '',
      is_published: Boolean(p.is_published),
    });
    setIsModalOpen(true);
  };

  const handleSavePage = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/admin/pages/${editingId}`, formData);
        showToast('페이지가 성공적으로 수정되었습니다.', 'success');
      } else {
        await api.post('/admin/pages', formData);
        showToast('새 페이지가 생성되었습니다.', 'success');
      }
      setIsModalOpen(false);
      fetchPages();
    } catch (err) {
      showToast(err.message || '저장 실패', 'error');
    }
  };

  const handleDeletePage = async (id) => {
    if (!window.confirm('이 페이지를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/admin/pages/${id}`);
      showToast('페이지가 삭제되었습니다.', 'info');
      fetchPages();
    } catch (err) {
      showToast('삭제 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="pages">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>커스텀 페이지 관리 (Custom Pages CMS)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              룩북, 쇼룸 안내, 브랜드 소개, 배송/교환 정책 등 독립된 커스텀 페이지를 생성하고 관리합니다.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary"
            style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 20px', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            <span>새 페이지 생성</span>
          </button>
        </div>

        {/* Pages Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {pages.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e4e4e7',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {p.banner_image && (
                <div style={{ height: '140px', backgroundColor: '#eee', overflow: 'hidden' }}>
                  <img src={p.banner_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{p.title_ko}</h3>
                      <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>{p.title_en}</p>
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: p.is_published ? '#dcfce7' : '#f4f4f5',
                        color: p.is_published ? '#166534' : '#71717a',
                        fontWeight: 700,
                      }}
                    >
                      {p.is_published ? '공개중' : '비공개'}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'monospace', display: 'block', marginTop: '6px' }}>
                    URL: /p/{p.slug}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f0f0f2' }}>
                  <a
                    href={`/p/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.8125rem', color: 'var(--accent-sunset)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>페이지 열기</span>
                    <ExternalLink size={13} />
                  </a>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(p)}
                      style={{ padding: '6px 10px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit2 size={13} />
                      <span>편집</span>
                    </button>
                    <button
                      onClick={() => handleDeletePage(p.id)}
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

        {/* Create / Edit Page Modal */}
        {isModalOpen && (
          <div className="backdrop" onClick={() => setIsModalOpen(false)} style={{ zIndex: 100 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '780px',
                maxHeight: '90vh',
                margin: '40px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {isEditMode ? '페이지 내용 수정' : '새 커스텀 페이지 작성'}
                </h3>
                <button onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSavePage} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">URL 슬러그 (Slug) *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                      placeholder="예: lookbook, craftsmanship"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label">상단 배너 이미지 URL</label>
                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(true)}
                        style={{ fontSize: '0.75rem', color: 'var(--accent-sunset)', fontWeight: 600 }}
                      >
                        미디어에서 선택
                      </button>
                    </div>
                    <input
                      type="url"
                      value={formData.banner_image}
                      onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">한글 페이지 제목 *</label>
                    <input
                      type="text"
                      required
                      value={formData.title_ko}
                      onChange={(e) => setFormData({ ...formData, title_ko: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">영문 페이지 제목 *</label>
                    <input
                      type="text"
                      required
                      value={formData.title_en}
                      onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">한글 페이지 본문 내용 (HTML 지원) *</label>
                  <textarea
                    rows={6}
                    required
                    value={formData.content_ko}
                    onChange={(e) => setFormData({ ...formData, content_ko: e.target.value })}
                    className="form-textarea"
                    style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">영문 페이지 본문 내용 (English Content)</label>
                  <textarea
                    rows={4}
                    value={formData.content_en}
                    onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                    className="form-textarea"
                    style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  />
                  <span style={{ fontSize: '0.875rem' }}>즉시 공개 발행 (Publish Live)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    취소
                  </button>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)' }}>
                    저장 및 발행
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <MediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={(url) => setFormData({ ...formData, banner_image: url })}
        />
      </div>
    </AdminLayout>
  );
}
