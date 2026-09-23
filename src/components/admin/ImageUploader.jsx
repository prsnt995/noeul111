import React, { useState, useRef } from 'react';
import { adminApi } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { MediaPickerModal } from '../common/MediaPickerModal.jsx';
import { Upload, X, Image as ImageIcon, Star, ArrowLeft, ArrowRight, Plus, Loader2 } from 'lucide-react';

function normalizeImages(images) {
  return (images || []).map(item => {
    if (typeof item === 'string') return { url: item, color: null };
    return { url: item.url, color: item.color || null, variant_id: item.variant_id || null };
  });
}

export function ImageUploader({ images = [], onChange, maxImages = 10, label = '상품 사진 (Product Images)', availableColors = [] }) {
  const [uploading, setUploading] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const normalized = normalizeImages(images);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      showToast(`최대 ${maxImages}장의 사진까지만 등록 가능합니다.`, 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const data = await adminApi.post('/admin/upload-multiple', formData);
      if (data.success && data.data) {
        const uploaded = data.data.map((f) => ({ url: f.url, color: null }));
        onChange([...normalized, ...uploaded]);
        showToast(`${uploaded.length}장의 사진이 성공적으로 업로드되었습니다.`, 'success');
      } else {
        showToast(data.message || '사진 업로드 실패', 'error');
      }
    } catch (err) {
      console.error('File upload error:', err);
      showToast('사진 업로드 중 오류가 발생했습니다.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    const next = [...normalized];
    next.splice(index, 1);
    onChange(next);
  };

  const handleSetPrimary = (index) => {
    if (index === 0) return;
    const next = [...normalized];
    const [selected] = next.splice(index, 1);
    next.unshift(selected);
    onChange(next);
    showToast('대표 메인 사진으로 지정되었습니다.', 'info');
  };

  const handleMove = (index, direction) => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= normalized.length) return;
    const next = [...normalized];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
  };

  const handleColorChange = (index, color) => {
    const next = [...normalized];
    next[index] = { ...next[index], color: color || null };
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
          {label} ({normalized.length}/{maxImages})
        </label>
        <button
          type="button"
          onClick={() => setIsMediaPickerOpen(true)}
          style={{ fontSize: '0.75rem', color: 'var(--accent-sunset)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          미디어 라이브러리에서 선택
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
        style={{ display: 'none' }}
      />

      {/* Upload Drop Zone / Button */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed #d4d4d8',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#fafafa',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-sunset)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d4d4d8')}
      >
        {uploading ? (
          <>
            <Loader2 size={32} className="animate-spin" color="var(--accent-sunset)" />
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#52525b' }}>
              사진을 서버로 업로드하는 중입니다...
            </p>
          </>
        ) : (
          <>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#fff1f2',
                color: 'var(--accent-sunset)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Upload size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#18181b' }}>
                컴퓨터 / 기기에서 사진 파일 업로드하기
              </p>
              <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
                클릭하여 JPG, PNG, WEBP 사진 선택 (최대 10장, 드래그 앤 드롭 지원)
              </span>
            </div>
          </>
        )}
      </div>

      {/* Image Thumbnails List */}
      {normalized.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
            marginTop: '8px',
          }}
        >
          {normalized.map((item, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative',
                borderRadius: '6px',
                border: idx === 0 ? '2px solid var(--accent-sunset)' : '1px solid #e4e4e7',
                overflow: 'hidden',
                backgroundColor: '#f4f4f5',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '3 / 4', overflow: 'hidden', backgroundColor: '#f4f4f5' }}>
                <img
                  src={item.url}
                  alt={`Uploaded ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Main / Primary Badge */}
                {idx === 0 ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      backgroundColor: 'var(--accent-sunset)',
                      color: '#ffffff',
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    대표 사진
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    title="대표 메인 사진으로 지정"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 4px',
                      fontSize: '0.625rem',
                      cursor: 'pointer',
                    }}
                  >
                    대표로 설정
                  </button>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="사진 삭제"
                >
                  <X size={12} />
                </button>

                {/* Reorder Buttons */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '4px',
                    right: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: '3px',
                    padding: '2px 4px',
                  }}
                >
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'left')}
                    style={{ background: 'none', border: 'none', color: idx === 0 ? '#666' : '#fff', cursor: idx === 0 ? 'default' : 'pointer' }}
                  >
                    <ArrowLeft size={12} />
                  </button>
                  <span style={{ fontSize: '0.625rem', color: '#fff', fontWeight: 700 }}>
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    disabled={idx === normalized.length - 1}
                    onClick={() => handleMove(idx, 'right')}
                    style={{ background: 'none', border: 'none', color: idx === normalized.length - 1 ? '#666' : '#fff', cursor: idx === normalized.length - 1 ? 'default' : 'pointer' }}
                  >
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* Color assignment per image — reorder plan */}
              <div style={{ padding: '6px', backgroundColor: '#fff', borderTop: '1px solid #e4e4e7' }}>
                <select
                  value={item.color || ''}
                  onChange={(e) => handleColorChange(idx, e.target.value || null)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '0.6875rem', border: '1px solid #e4e4e7', borderRadius: '4px', backgroundColor: '#fff' }}
                  title="이 사진을 특정 색상에 연결하면 해당 색상 선택 시 이 이미지가 먼저 표시됩니다. 비워두면 모든 색상에서 표시."
                >
                  <option value="">모든 색상 (공용)</option>
                  {availableColors.map((c, i) => (
                    <option key={i} value={c.name_en || c.name || c.name_ko}>
                      {c.name_ko || c.name_en} ({c.name_en || c.name})
                    </option>
                  ))}
                </select>
                {item.color && <span style={{ fontSize: '0.625rem', color: 'var(--accent-sunset)', marginTop: 4, display: 'block' }}>→ {item.color} 전용</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: '0.6875rem', color: '#71717a', margin: 0 }}>
        색상을 지정하면 상품 상세에서 해당 색상 선택 시 지정된 이미지가 먼저 표시됩니다 (reorder). 미지정 이미지는 모든 색상에서 표시됩니다. 예: 5장 중 2장 파랑, 3장 초록.
      </p>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          if (normalized.length < maxImages) {
            onChange([...normalized, { url, color: null }]);
          }
        }}
      />
    </div>
  );
}
