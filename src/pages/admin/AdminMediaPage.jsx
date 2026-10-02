import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  PageHeader,
  Filters,
  Pagination,
  ErrorBanner,
  Empty,
  ConfirmModal,
  normalizeListResponse,
  buildListParams,
} from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Plus, Copy, Trash2, X, Upload, Loader2 } from 'lucide-react';

const PAGE_SIZE = 24;

export function AdminMediaPage() {
  const [mediaList, setMediaList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    tags: '',
  });

  const fetchMedia = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const qs = buildListParams({ page, pageSize: PAGE_SIZE, search: search.trim() });
      const res = await adminApi.get(`/admin/media${qs}`);
      const { data, total: t } = normalizeListResponse(res, page, PAGE_SIZE);
      setMediaList(data);
      setTotal(t);
    } catch (err) {
      console.error('Fetch media error:', err);
      setErrorMsg(err?.message || '미디어 목록을 불러오지 못했습니다.');
      showToast('미디어 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [page]);

  const handleDirectFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const fd = new FormData();
    files.forEach((file) => {
      fd.append('images', file);
    });

    try {
      // Cookie session via adminApi (CSRF + credentials included); the legacy
      // Bearer-token path is retired with password auth.
      const data = await adminApi.post('/admin/upload-multiple', fd);
      if (data.success) {
        showToast(`${data.data?.length || files.length}개의 사진 파일이 업로드되었습니다.`, 'success');
        fetchMedia();
      } else {
        showToast(data.message || '업로드 실패', 'error');
      }
    } catch (err) {
      showToast('업로드 중 오류 발생', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddMedia = async (e) => {
    e.preventDefault();
    try {
      await adminApi.post('/admin/media', formData);
      showToast('새 미디어가 등록되었습니다.', 'success');
      setIsModalOpen(false);
      setFormData({ name: '', url: '', tags: '' });
      fetchMedia();
    } catch (err) {
      showToast('미디어 등록 실패', 'error');
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    showToast('이미지 URL이 클립보드에 복사되었습니다.', 'info');
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.delete(`/admin/media/${id}`);
      showToast('미디어가 삭제되었습니다.', 'info');
      setDeleteId(null);
      fetchMedia();
    } catch (err) {
      showToast(err?.message || '삭제 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="media">
      {/* Hidden Global File Input for 1-Click Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDirectFileUpload}
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        aria-hidden
        tabIndex={-1}
      />

      <PageHeader
        ko="미디어 라이브러리"
        en="Media Library"
        desc="컴퓨터에서 사진을 직접 업로드하거나 URL을 등록하여 쇼핑몰 전역에서 재사용합니다."
        actions={(
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="adm-btn adm-btn-primary"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  <span>업로드 중…</span>
                </>
              ) : (
                <>
                  <Upload size={16} aria-hidden />
                  <span>사진 파일 직접 업로드 Upload</span>
                </>
              )}
            </button>
            <button type="button" onClick={() => setIsModalOpen(true)} className="adm-btn">
              <Plus size={16} aria-hidden />
              <span>URL로 등록</span>
            </button>
          </>
        )}
      />

      <ErrorBanner message={errorMsg ? `미디어 로드 실패: ${errorMsg}` : ''} onRetry={fetchMedia} />

      <Filters
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="미디어 이름, 태그 검색 Search…"
      >
        <span style={{ fontSize: '0.8125rem', color: '#71717a', marginLeft: 'auto' }}>
          총 <strong>{total}</strong>개 미디어 파일
        </span>
      </Filters>

      {/* Media Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="adm-card" style={{ padding: 12, display: 'grid', gap: 8 }}>
              <div className="adm-skel" style={{ height: 140 }} />
              <div className="adm-skel" style={{ height: 12 }} />
            </div>
          ))}
        </div>
      ) : mediaList.length === 0 ? (
        <div className="adm-card">
          <Empty
            title="등록된 미디어 파일이 없습니다 No media yet"
            desc="상단의 '사진 파일 직접 업로드' 버튼을 눌러 사진을 추가해 보세요."
            action={(
              <button type="button" className="adm-btn adm-btn-primary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} aria-hidden /> 사진 업로드하기
              </button>
            )}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {mediaList.map((m) => (
            <div key={m.id} className="adm-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '160px', backgroundColor: '#eee', overflow: 'hidden', position: 'relative' }}>
                <img src={m.url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>

              <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.name}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px', marginBottom: 0 }}>
                    {m.tags || '태그 없음'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f0f0f2' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(m.url)}
                    style={{ fontSize: '0.75rem', color: 'var(--adm-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Copy size={13} aria-hidden />
                    <span>URL 복사 Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(m.id)}
                    aria-label={`${m.name} 삭제 Delete`}
                    className="adm-icon-btn"
                    style={{ color: '#dc2626' }}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="미디어 삭제 Delete media"
        desc="이 미디어를 삭제하시겠습니까? 사용 중인 배너·상품 이미지가 깨질 수 있습니다."
        confirmLabel="삭제하기 Delete"
        onConfirm={() => handleDelete(deleteId)}
        onClose={() => setDeleteId(null)}
      />

      {/* Add Media Modal */}
      {isModalOpen && (
        <>
          <div className="adm-backdrop" onClick={() => setIsModalOpen(false)} />
          <div className="adm-modal" role="dialog" aria-modal="true" aria-label="새 미디어 자산 등록 New media" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h2>새 미디어 자산 등록 New media</h2>
              <button type="button" className="adm-icon-btn" onClick={() => setIsModalOpen(false)} aria-label="Close dialog">
                <X size={16} />
              </button>
            </div>

              <form onSubmit={handleAddMedia} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">미디어 이름 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 2026 SS 울 블레이저 메인 룩"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">이미지 URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="/products/men/tshirts/classic-tshirt/1.jpg"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">태그 (쉼표 구분)</label>
                  <input
                    type="text"
                    placeholder="예: hero, outerwear, black"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="adm-modal-actions">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="adm-btn" style={{ flex: 1 }}>
                    취소 Cancel
                  </button>
                  <button type="submit" className="adm-btn adm-btn-primary" style={{ flex: 1 }}>
                    등록하기 Save
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
    </AdminLayout>
  );
}
