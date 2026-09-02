import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Film, Plus, Search, Copy, Trash2, X, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';

export function AdminMediaPage() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
      const res = await api.get(`/admin/media?search=${encodeURIComponent(search)}`);
      if (res.success) setMediaList(res.data);
    } catch (err) {
      console.error('Fetch media error:', err);
      showToast('미디어 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [search]);

  const handleDirectFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const fd = new FormData();
    files.forEach((file) => {
      fd.append('images', file);
    });

    try {
      const token = localStorage.getItem('noeul_auth_token');
      const response = await fetch('/api/admin/upload-multiple', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await response.json();
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
      await api.post('/admin/media', formData);
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
    if (!window.confirm('이 미디어를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/admin/media/${id}`);
      showToast('미디어가 삭제되었습니다.', 'info');
      fetchMedia();
    } catch (err) {
      showToast('삭제 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="media">
      <div>
        {/* Hidden Global File Input for 1-Click Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleDirectFileUpload}
          multiple
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>미디어 라이브러리 (Media Library)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              컴퓨터에서 사진을 직접 업로드하거나 URL을 등록하여 쇼핑몰 전역에서 재사용합니다.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary"
              style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 20px', fontSize: '0.875rem' }}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>업로드 중...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>사진 파일 직접 업로드</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.875rem' }}
            >
              <Plus size={16} />
              <span>URL로 등록</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e4e4e7', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} color="#999" style={{ position: 'absolute', top: '10px', left: '10px' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="미디어 이름, 태그 검색..."
              className="form-input"
              style={{ padding: '8px 12px 8px 34px', fontSize: '0.875rem' }}
            />
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>
            총 <strong>{mediaList.length}</strong>개 미디어 파일
          </span>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#888' }}>미디어 로딩 중...</div>
        ) : mediaList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e4e4e7', color: '#888' }}>
            등록된 미디어 파일이 없습니다. 상단의 '사진 파일 직접 업로드' 버튼을 눌러 사진을 추가해보세요.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {mediaList.map((m) => (
              <div
                key={m.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e4e4e7',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ height: '160px', backgroundColor: '#eee', overflow: 'hidden', position: 'relative' }}>
                  <img src={m.url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
                      {m.tags || '태그 없음'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f0f0f2' }}>
                    <button
                      onClick={() => handleCopyUrl(m.url)}
                      style={{ fontSize: '0.75rem', color: 'var(--accent-sunset)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Copy size={13} />
                      <span>URL 복사</span>
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      style={{ padding: '4px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Media Modal */}
        {isModalOpen && (
          <div className="backdrop" onClick={() => setIsModalOpen(false)} style={{ zIndex: 100 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '520px',
                margin: '60px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>새 미디어 자산 등록</h3>
                <button onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
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
                    placeholder="https://images.unsplash.com/..."
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

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                    취소
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--accent-sunset)' }}>
                    등록하기
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
