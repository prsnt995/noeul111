import React, { useState, useRef } from 'react';
import { adminApi } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { MediaPickerModal } from '../common/MediaPickerModal.jsx';
import {
  PRODUCT_IMAGE_MAX,
  UPLOAD_BATCH_SIZE,
  UPLOAD_CONCURRENCY,
  UPLOAD_FAILED_GENERIC,
} from '../../config/upload.js';
import {
  validateImageFiles,
  downscaleImage,
  uploadErrorText,
} from '../../utils/upload.js';
import { Upload, X, Image as ImageIcon, Star, ArrowLeft, ArrowRight, Plus, Loader2 } from 'lucide-react';

function normalizeImages(images) {
  return (images || []).map(item => {
    if (typeof item === 'string') return { url: item, color: null };
    return { url: item.url, color: item.color || null, variant_id: item.variant_id || null };
  });
}

export function ImageUploader({ images = [], onChange, maxImages = PRODUCT_IMAGE_MAX, label = '상품 사진 (Product Images)', availableColors = [], mode = 'gallery' }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [lastFiles, setLastFiles] = useState([]);
  const [failedCount, setFailedCount] = useState(0);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();
  const { lang } = useLanguage() || { lang: 'ko' };

  const normalized = normalizeImages(images);

  const KNOWN_CODES = new Set([
    'TOO_MANY_FILES', 'FILE_TOO_LARGE', 'UNSUPPORTED_TYPE',
    'STORAGE_FULL', 'UPLOAD_FAILED', 'NO_FILES',
  ]);

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    setFailedCount(0);
    // 2 + 3. Every file passes the downscale/compress helper (over-limit
    // rasters shrink, small files return untouched), then uploads go out
    // sequentially in small batches (dodges serverless body caps).
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    try {
      const prepared = [];
      for (const f of files) {
        prepared.push(await downscaleImage(f));
      }
      const uploaded = [];
      const failed = [];
      const batches = [];
      for (let i = 0; i < prepared.length; i += UPLOAD_BATCH_SIZE) {
        batches.push(prepared.slice(i, i + UPLOAD_BATCH_SIZE));
      }
      let doneCount = 0;
      const runBatch = async (chunk) => {
        const formData = new FormData();
        chunk.forEach((file) => formData.append('images', file));
        try {
          const data = await adminApi.post('/admin/upload-multiple', formData);
          if (data?.success) {
            const rows = data.uploaded || data.data || [];
            uploaded.push(...rows.map((u) => ({ url: u.url, color: null })));
            for (const f of (data.failed || [])) failed.push(f);
          } else {
            const code = KNOWN_CODES.has(data?.code) ? data.code : UPLOAD_FAILED_GENERIC;
            chunk.forEach((file) => failed.push({ name: file.name, code }));
          }
        } catch (err) {
          const code = KNOWN_CODES.has(err?.message) ? err.message : UPLOAD_FAILED_GENERIC;
          chunk.forEach((file) => failed.push({ name: file.name, code }));
        }
        doneCount += chunk.length;
        setProgress({ done: Math.min(prepared.length, doneCount), total: prepared.length });
      };
      const queue = [...batches];
      const workers = Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, async () => {
        while (queue.length) {
          const batch = queue.shift();
          if (batch) await runBatch(batch);
        }
      });
      await Promise.all(workers);
      if (uploaded.length) {
        if (maxImages === 1) onChange(uploaded.slice(0, 1));
        else onChange([...normalized, ...uploaded].slice(0, maxImages));
      }
      if (uploaded.length && !failed.length) {
        showToast(`${uploaded.length}장의 사진이 성공적으로 업로드되었습니다.`, 'success');
      } else if (uploaded.length && failed.length) {
        showToast(`${uploaded.length}장 성공, ${failed.length}장 실패`, 'info');
      }
      for (const f of failed.slice(0, 5)) {
        showToast(uploadErrorText(f.code, lang, f.name, { max: maxImages }), 'error');
      }
      if (failed.length > 5) {
        showToast(`그 외 ${failed.length - 5}건의 실패가 더 있습니다.`, 'error');
      }
      setFailedCount(failed.length);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (files.length === 0) return;

    // 1. Pre-flight: name every bad file before any network traffic.
    const { accepted, issues } = validateImageFiles(files, { existingCount: images.length, max: maxImages });
    for (const issue of issues) {
      showToast(uploadErrorText(issue.code, lang, issue.name, { max: maxImages }), 'error');
    }
    if (accepted.length === 0) return;

    setLastFiles(accepted);
    await uploadFiles(accepted);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length === 0) return;
    const { accepted, issues } = validateImageFiles(files, { existingCount: images.length, max: maxImages });
    for (const issue of issues) {
      showToast(uploadErrorText(issue.code, lang, issue.name, { max: maxImages }), 'error');
    }
    if (accepted.length === 0) return;
    setLastFiles(accepted);
    await uploadFiles(accepted);
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
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/avif"
        style={{ display: 'none' }}
      />

      {/* Upload Drop Zone / Button */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent-sunset)' : '#d4d4d8'}`,
          backgroundColor: dragOver ? '#fff5f5' : '#fafafa',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
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
              사진을 서버로 업로드하는 중입니다{progress ? ` (${progress.done}/${progress.total})` : '...'}
            </p>
            {progress && (
              <div style={{ width: '100%', maxWidth: '320px', height: '8px', backgroundColor: '#e4e4e7', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%`,
                    height: '100%',
                    backgroundColor: 'var(--accent-sunset)',
                    borderRadius: '999px',
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>
            )}
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
                클릭하여 JPG, PNG, WEBP, GIF, AVIF 선택 (최대 {maxImages}장 · 장당 8MB · 2MB 초과분은 자동 최적화)
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
                {mode === 'gallery' && (idx === 0 ? (
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
                ))}

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

              {/* Color assignment per image — reorder plan (gallery mode only) */}
              {mode === 'gallery' && (
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
              )}
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: '0.6875rem', color: '#71717a', margin: 0 }}>
        색상을 지정하면 상품 상세에서 해당 색상 선택 시 지정된 이미지가 먼저 표시됩니다 (reorder). 미지정 이미지는 모든 색상에서 표시됩니다. 예: 5장 중 2장 파랑, 3장 초록.
      </p>

      {failedCount > 0 && lastFiles.length > 0 && !uploading && (
        <button
          type="button"
          onClick={() => uploadFiles(lastFiles)}
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
        >
          실패한 파일 재시도 ({failedCount}장)
        </button>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          if (maxImages === 1) {
            onChange([{ url, color: null }]);
          } else if (normalized.length < maxImages) {
            onChange([...normalized, { url, color: null }]);
          }
        }}
      />
    </div>
  );
}
