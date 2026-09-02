import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { MediaPickerModal } from '../../components/common/MediaPickerModal.jsx';
import { Image as ImageIcon, Plus, Edit2, Trash2, X, Eye, EyeOff, Calendar } from 'lucide-react';

export function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeImageField, setActiveImageField] = useState('image_url');

  const [formData, setFormData] = useState({
    type: 'hero',
    title_ko: '',
    title_en: '',
    subtitle_ko: '',
    subtitle_en: '',
    image_url: '',
    mobile_image_url: '',
    link_url: '/shop',
    button_text_ko: '쇼핑하기',
    button_text_en: 'Shop Now',
    start_date: '',
    end_date: '',
    is_active: true,
    sort_order: 1,
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/content/banners');
      if (res.success) setBanners(res.data);
    } catch (err) {
      console.error('Fetch banners failed:', err);
      showToast('배너 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      type: 'hero',
      title_ko: '',
      title_en: '',
      subtitle_ko: '',
      subtitle_en: '',
      image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
      mobile_image_url: '',
      link_url: '/shop',
      button_text_ko: '신규 컬렉션 쇼핑하기',
      button_text_en: 'Shop Now',
      start_date: '',
      end_date: '',
      is_active: true,
      sort_order: banners.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (b) => {
    setIsEditMode(true);
    setEditingId(b.id);
    setFormData({
      type: b.type,
      title_ko: b.title_ko,
      title_en: b.title_en,
      subtitle_ko: b.subtitle_ko || '',
      subtitle_en: b.subtitle_en || '',
      image_url: b.image_url || '',
      mobile_image_url: b.mobile_image_url || '',
      link_url: b.link_url || '',
      button_text_ko: b.button_text_ko || '',
      button_text_en: b.button_text_en || '',
      start_date: b.start_date || '',
      end_date: b.end_date || '',
      is_active: Boolean(b.is_active),
      sort_order: b.sort_order || 1,
    });
    setIsModalOpen(true);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/admin/content/banners/${editingId}`, formData);
        showToast('배너가 수정되었습니다.', 'success');
      } else {
        await api.post('/admin/content/banners', formData);
        showToast('새 배너가 추가되었습니다.', 'success');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      showToast(err.message || '배너 저장 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 배너를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/admin/content/banners/${id}`);
      showToast('배너가 삭제되었습니다.', 'info');
      fetchBanners();
    } catch (err) {
      showToast('삭제 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="banners">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>배너 매니저 (Banner Manager)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              데스크탑/모바일 배너 이미지, 프로모션 띠배너 및 노출 기간을 관리합니다.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary"
            style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 20px', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            <span>새 배너 등록</span>
          </button>
        </div>

        {/* Banners Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {banners.map((b) => (
            <div
              key={b.id}
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
              <div style={{ position: 'relative', height: '180px', backgroundColor: '#121213' }}>
                {b.image_url ? (
                  <img src={b.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                    텍스트 전용 배너
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    fontSize: '0.6875rem',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {b.type}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: b.is_active ? '#dcfce7' : '#fee2e2',
                    color: b.is_active ? '#166534' : '#991b1b',
                    fontSize: '0.6875rem',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  {b.is_active ? '노출중' : '숨김'}
                </span>
              </div>

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{b.title_ko}</h4>
                  <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>{b.title_en}</p>
                  {b.subtitle_ko && (
                    <p style={{ fontSize: '0.8125rem', color: '#52525b', marginTop: '6px', lineHeight: 1.4 }}>
                      {b.subtitle_ko}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f0f0f2' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>링크: {b.link_url || '없음'}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(b)}
                      style={{ padding: '6px 10px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit2 size={13} />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
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

        {/* Modal */}
        {isModalOpen && (
          <div className="backdrop" onClick={() => setIsModalOpen(false)} style={{ zIndex: 100 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '620px',
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
                  {isEditMode ? '배너 정보 수정' : '새 배너 등록'}
                </h3>
                <button onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveBanner} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">배너 구분 (Type)</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="hero">메인 히어로 배너 (Hero Banner)</option>
                    <option value="promo">중간 프로모션 배너 (Promo Banner)</option>
                    <option value="announcement">상단 띠배너 (Top Announcement)</option>
                    <option value="popup">팝업 배너 (Modal Popup)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">한글 제목 *</label>
                    <input
                      type="text"
                      required
                      value={formData.title_ko}
                      onChange={(e) => setFormData({ ...formData, title_ko: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">영문 제목 *</label>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="form-label">데스크탑 이미지 URL *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveImageField('image_url');
                        setIsMediaPickerOpen(true);
                      }}
                      style={{ fontSize: '0.75rem', color: 'var(--accent-sunset)', fontWeight: 600 }}
                    >
                      미디어에서 선택
                    </button>
                  </div>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">모바일 전용 이미지 URL (선택)</label>
                  <input
                    type="url"
                    value={formData.mobile_image_url}
                    onChange={(e) => setFormData({ ...formData, mobile_image_url: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">클릭 이동 링크 URL</label>
                    <input
                      type="text"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      placeholder="/shop"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">버튼 텍스트 (한글)</label>
                    <input
                      type="text"
                      value={formData.button_text_ko}
                      onChange={(e) => setFormData({ ...formData, button_text_ko: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span style={{ fontSize: '0.875rem' }}>쇼핑몰에 즉시 노출 활성화 (Active)</span>
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

        <MediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={(url) => setFormData({ ...formData, [activeImageField]: url })}
        />
      </div>
    </AdminLayout>
  );
}
