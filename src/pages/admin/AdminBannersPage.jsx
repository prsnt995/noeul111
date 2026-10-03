import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  PageHeader,
  ErrorBanner,
  Empty,
  ConfirmModal,
  StatusPill,
  normalizeListResponse,
  buildListParams,
} from '../../components/admin/ui/index.js';
import { Pagination } from '../../components/admin/ui/Pagination.jsx';
import { adminApi } from '../../utils/api.js';
import { safeHttpUrl } from '../../utils/imageHelper.js';
import { useToast } from '../../context/ToastContext.jsx';
import { MediaPickerModal } from '../../components/common/MediaPickerModal.jsx';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const PAGE_SIZE = 12;

export function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);
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
      setErrorMsg('');
      const qs = buildListParams({ page, pageSize: PAGE_SIZE });
      const res = await adminApi.get(`/admin/content/banners${qs}`);
      const { data, total: t } = normalizeListResponse(res, page, PAGE_SIZE);
      setBanners(data);
      setTotal(t);
    } catch (err) {
      console.error('Fetch banners failed:', err);
      setErrorMsg(err?.message || '배너 목록을 불러오지 못했습니다.');
      showToast('배너 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [page]);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      type: 'hero',
      title_ko: '',
      title_en: '',
      subtitle_ko: '',
      subtitle_en: '',
      image_url: '/products/men/tshirts/classic-tshirt/1.jpg',
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
        await adminApi.put(`/admin/content/banners/${editingId}`, formData);
        showToast('배너가 수정되었습니다.', 'success');
      } else {
        await adminApi.post('/admin/content/banners', formData);
        showToast('새 배너가 추가되었습니다.', 'success');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      showToast(err.message || '배너 저장 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.delete(`/admin/content/banners/${id}`);
      showToast('배너가 삭제되었습니다.', 'info');
      setDeleteId(null);
      fetchBanners();
    } catch (err) {
      showToast(err?.message || '삭제 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="banners">
      <PageHeader
        ko="배너 매니저"
        en="Banner Manager"
        desc="데스크탑/모바일 배너 이미지, 프로모션 띠배너 및 노출 기간을 관리합니다."
        actions={(
          <button type="button" className="adm-btn adm-btn-primary" onClick={openAddModal}>
            <Plus size={16} aria-hidden />
            <span>새 배너 등록 New banner</span>
          </button>
        )}
      />

      <ErrorBanner message={errorMsg ? `배너 로드 실패: ${errorMsg}` : ''} onRetry={fetchBanners} />

      {/* Banners Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="adm-card" style={{ padding: 16, display: 'grid', gap: 10 }}>
              <div className="adm-skel" style={{ height: 140 }} />
              <div className="adm-skel" style={{ height: 14 }} />
              <div className="adm-skel" style={{ height: 10, width: '60%' }} />
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="adm-card">
          <Empty
            title="등록된 배너가 없습니다 No banners yet"
            desc="새 배너를 등록해 쇼핑몰 전면에 노출하세요."
            action={(
              <button type="button" className="adm-btn adm-btn-primary" onClick={openAddModal}>
                <Plus size={14} aria-hidden /> 새 배너 등록
              </button>
            )}
          />
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {banners.map((b) => (
            <div
              key={b.id}
              className="adm-card"
              style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ position: 'relative', height: '180px', backgroundColor: '#121213' }}>
                {safeHttpUrl(b.image_url) ? (
                  <img src={safeHttpUrl(b.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <span style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <StatusPill status={b.is_active ? 'delivered' : 'neutral'} label={b.is_active ? '노출중 Live' : '숨김 Hidden'} />
                </span>
              </div>

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>{b.title_ko}</h4>
                  <p style={{ fontSize: '0.8125rem', color: '#71717a', margin: '2px 0 0' }}>{b.title_en}</p>
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
                      type="button"
                      onClick={() => openEditModal(b)}
                      className="adm-btn"
                      style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
                    >
                      <Edit2 size={13} aria-hidden />
                      <span>수정</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(b.id)}
                      className="adm-btn"
                      style={{ padding: '6px 10px', fontSize: '0.8125rem', color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      <Trash2 size={13} aria-hidden />
                      <span>삭제</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={(p) => { setPage(p); }} />
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="배너 삭제 Delete banner"
        desc="이 배너를 삭제하시겠습니까? 쇼핑몰에서 즉시 제거됩니다."
        confirmLabel="삭제하기 Delete"
        onConfirm={() => handleDelete(deleteId)}
        onClose={() => setDeleteId(null)}
      />

      {/* Modal */}
      {isModalOpen && (
        <>
          <div className="adm-backdrop" onClick={() => setIsModalOpen(false)} />
          <div className="adm-modal" role="dialog" aria-modal="true" aria-label={isEditMode ? '배너 정보 수정 Edit banner' : '새 배너 등록 New banner'} style={{ maxWidth: 620 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h2>
                {isEditMode ? '배너 정보 수정 Edit banner' : '새 배너 등록 New banner'}
              </h2>
              <button type="button" className="adm-icon-btn" onClick={() => setIsModalOpen(false)} aria-label="Close dialog">
                <X size={16} />
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">한글 부제목 (선택)</label>
                    <input
                      type="text"
                      value={formData.subtitle_ko}
                      onChange={(e) => setFormData({ ...formData, subtitle_ko: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">영문 부제목 (선택)</label>
                    <input
                      type="text"
                      value={formData.subtitle_en}
                      onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
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
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">버튼 텍스트 (영문)</label>
                    <input
                      type="text"
                      value={formData.button_text_en}
                      onChange={(e) => setFormData({ ...formData, button_text_en: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">노출 순서 (낮을수록 먼저)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">시작일</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">종료일</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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

                <div className="adm-modal-actions">
                  <button type="button" className="adm-btn" onClick={() => setIsModalOpen(false)}>
                    취소 Cancel
                  </button>
                  <button type="submit" className="adm-btn adm-btn-primary">
                    저장하기 Save
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        <MediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={(url) => setFormData({ ...formData, [activeImageField]: url })}
        />
    </AdminLayout>
  );
}
