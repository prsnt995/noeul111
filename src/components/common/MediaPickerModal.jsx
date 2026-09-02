import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Search, Plus, Check, X, Image as ImageIcon, Copy, Upload, Loader2 } from 'lucide-react';

export function MediaPickerModal({ isOpen, onClose, onSelect }) {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/media?search=${encodeURIComponent(search)}`);
      if (res.success) {
        setMediaList(res.data);
      }
    } catch (err) {
      console.error('Fetch media failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, search]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));

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
      if (data.success && data.data) {
        showToast(`${data.data.length}개 파일이 업로드되었습니다.`, 'success');
        fetchMedia();
        if (data.data.length === 1) {
          onSelect(data.data[0].url);
          onClose();
        }
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
    if (!newUrl) return;
    try {
      await api.post('/admin/media', {
        name: newName || '업로드 이미지',
        url: newUrl,
        tags: newTags,
      });
      showToast('미디어가 등록되었습니다.', 'success');
      setNewUrl('');
      setNewName('');
      setNewTags('');
      setIsAdding(false);
      fetchMedia();
    } catch (err) {
      showToast('미디어 등록 실패', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: '85vh',
          margin: '40px auto',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ImageIcon size={20} color="var(--accent-sunset)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>사진 및 미디어 선택 (Media Library)</h3>
          </div>
          <button onClick={onClose} style={{ color: '#71717a', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="#999" style={{ position: 'absolute', top: '10px', left: '10px' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이미지 이름, 태그 검색..."
              className="form-input"
              style={{ padding: '8px 12px 8px 34px', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.8125rem', backgroundColor: 'var(--accent-sunset)' }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>{uploading ? '업로드 중...' : '새 파일 직접 업로드'}</span>
            </button>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.8125rem' }}
            >
              <Plus size={14} />
              <span>{isAdding ? '닫기' : 'URL 등록'}</span>
            </button>
          </div>
        </div>

        {/* Quick Add Form */}
        {isAdding && (
          <form onSubmit={handleAddMedia} style={{ padding: '16px 24px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #e4e4e7', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="url"
              required
              placeholder="이미지 URL (https://...)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="form-input"
              style={{ flex: 2, minWidth: '200px', fontSize: '0.8125rem' }}
            />
            <input
              type="text"
              placeholder="이름 (선택)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="form-input"
              style={{ flex: 1, minWidth: '120px', fontSize: '0.8125rem' }}
            />
            <input
              type="text"
              placeholder="태그 (예: banner, hero)"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="form-input"
              style={{ flex: 1, minWidth: '120px', fontSize: '0.8125rem' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8125rem', backgroundColor: 'var(--accent-sunset)' }}>
              저장
            </button>
          </form>
        )}

        {/* Media Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>미디어 불러오는 중...</div>
          ) : mediaList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>등록된 미디어가 없습니다. '새 파일 직접 업로드'로 사진을 등록해보세요.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
              {mediaList.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelect(m.url);
                    onClose();
                  }}
                  style={{
                    border: '1px solid #e4e4e7',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: '#fafafa',
                    transition: 'transform 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-sunset)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e4e4e7';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ height: '120px', backgroundColor: '#eee', overflow: 'hidden' }}>
                    <img src={m.url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name}
                    </p>
                    <span style={{ fontSize: '0.6875rem', color: '#888' }}>{m.tags || '이미지'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
