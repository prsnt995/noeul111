import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { PageHeader, ErrorBanner, Empty, ConfirmModal } from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { HomeBlocks } from '../../components/home/HomeBlocks.jsx';
import { newBlock, normalizeBlocks, blockSummary, groupBannerRows, moveBlock, applyPreset, validateLayout } from '../../utils/homeLayout.js';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical, Save, Upload, RotateCcw, X, Monitor, Smartphone, Package, ImageIcon } from 'lucide-react';
import ProductPickerModal from '../../components/admin/home/ProductPickerModal.jsx';
import { MediaPickerModal } from '../../components/common/MediaPickerModal.jsx';
import '../../styles/admin-home.css';

const BLOCK_PALETTE = [
  { type: 'hero', label: '히어로', desc: '상단 대형 배너' },
  { type: 'delivery', label: '빠른 배송', desc: 'Fast delivery 띠' },
  { type: 'product_rail', label: '상품 진열', desc: '베스트/신상/카테고리/수동' },
  { type: 'category_tiles', label: '카테고리 타일', desc: '카테고리 탐색' },
  { type: 'category_row', label: '카테고리 행', desc: '카테고리별 상품' },
  { type: 'banner', label: '배너', desc: '프로모션 배너' },
  { type: 'editorial', label: '에디토리얼', desc: '마무리 브랜드 띠' },
];

function cloneBlock(b) { return { ...b, id: 'blk_' + Math.random().toString(36).slice(2, 10) }; }

export function AdminHomePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doc, setDoc] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [storefrontData, setStorefrontData] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'publish'|'discard'|'reset'
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(1200);
  const [pickerBlockId, setPickerBlockId] = useState(null);
  const [mediaTarget, setMediaTarget] = useState(null);

  const markDirty = useCallback(() => setDirty(true), []);
  const applyBlocks = useCallback((next) => {
    setHistory(h => [...h, blocks]);
    setFuture([]);
    setBlocks(next);
    setDirty(true);
  }, [blocks]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [homeRes, catRes, banRes, sfRes] = await Promise.all([
        adminApi.get('/admin/content/home'),
        adminApi.get('/admin/categories'),
        adminApi.get('/admin/content/banners'),
        adminApi.get('/storefront/home').catch(() => null),
      ]);
      const d = homeRes?.data || {};
      setDoc(d);
      const draftBlocks = d?.draft?.blocks || d?.blocks || [];
      setBlocks(Array.isArray(draftBlocks) ? draftBlocks.map(b => ({ ...b })) : []);
      setCategories(Array.isArray(catRes?.data) ? catRes.data : (catRes?.data?.data || []));
      setBanners(Array.isArray(banRes?.data) ? banRes.data : (banRes?.data?.data || []));
      setStorefrontData(sfRes?.data || null);
      setDirty(false);
    } catch (e) {
      setError(e?.message || 'LOAD_FAILED');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Crash-recovery autosave (local only; never published).
  useEffect(() => {
    if (!dirty) return;
    try { localStorage.setItem('noeul_home_layout_autosave', JSON.stringify({ blocks, savedAt: new Date().toISOString() })); } catch { /* ignore */ }
  }, [blocks, dirty]);

  // Prevent accidental tab close while there are unsaved edits.
  useEffect(() => {
    if (!dirty && !hasChanges) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, hasChanges]);

  // Offer recovery on mount if an autosave exists.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('noeul_home_layout_autosave');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.blocks) && parsed.blocks.length && !dirty) {
        // Only offer if there is no published layout yet to avoid clobbering.
        if (!(doc?.published?.blocks?.length)) {
          showToast('자동 저장된 초안이 있습니다. 복구하려면 콘솔에서 localStorage를 확인하세요.', 'info');
        }
      }
    } catch { /* ignore */ }
  }, []);

  const publishedBlocks = doc?.published?.blocks || [];
  const hasChanges = useMemo(() => {
    try { return JSON.stringify(blocks) !== JSON.stringify(publishedBlocks); } catch { return false; }
  }, [blocks, publishedBlocks]);

  const ctx = useMemo(() => ({
    categories: categories.map(c => ({ slug: c.slug, name_ko: c.name_ko, name_en: c.name_en })),
    bannerIds: new Set(banners.map(b => b.id)),
    maxRows: 6,
  }), [categories, banners]);

  const updateBlock = (id, patch) => {
    applyBlocks(blocks.map(b => b.id === id ? { ...b, ...patch } : b));
  };
  const removeBlock = (id) => {
    applyBlocks(blocks.filter(b => b.id !== id));
    if (expandedId === id) setExpandedId(null);
  };
  const duplicateBlock = (id) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const nb = cloneBlock(blocks[idx]);
    const next = blocks.slice();
    next.splice(idx + 1, 0, nb);
    applyBlocks(next);
  };
  const toggleEnabled = (id) => {
    applyBlocks(blocks.map(b => b.id === id ? { ...b, enabled: b.enabled === false ? true : false } : b));
  };
  const addBlock = (type) => {
    const nb = newBlock(type);
    applyBlocks([...blocks, nb]);
    setExpandedId(nb.id);
  };
  const move = (from, to) => {
    applyBlocks(moveBlock(blocks, from, to));
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setFuture(f => [blocks, ...f]);
    setBlocks(prev);
    setDirty(true);
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setFuture(f => f.slice(1));
    setHistory(h => [...h, blocks]);
    setBlocks(next);
    setDirty(true);
  };

  const handleDragStart = (e, index) => {
    setDragIndex(index);
    try { e.dataTransfer.setData('text/plain', String(index)); } catch {}
  };
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDropIndex(index);
  };
  const handleDrop = (e, index) => {
    e.preventDefault();
    const from = dragIndex !== null ? dragIndex : Number(e.dataTransfer.getData('text/plain'));
    if (Number.isFinite(from) && from !== index) move(from, index);
    setDragIndex(null);
    setDropIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDropIndex(null); };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const normalized = normalizeBlocks(blocks, ctx);
      const res = await adminApi.put('/admin/content/home', { blocks: normalized, base_revision: doc?.revision });
      setDoc(res?.data || doc);
      setBlocks((res?.data?.draft?.blocks) || normalized);
      setDirty(false);
      showToast('초안이 저장되었습니다.', 'success');
    } catch (e) {
      if (e?.status === 409 || e?.code === 'LAYOUT_CONFLICT') showToast('다른 곳에서 먼저 수정되었습니다 — 새로고침 후 다시 시도하세요.', 'error');
      else showToast(e?.message || '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const doPublish = async () => {
    setPublishing(true);
    try {
      // Publish operates on the server-side draft, so any unsaved edits on
      // screen must be saved first — otherwise we'd publish stale content.
      let currentDoc = doc;
      if (dirty || hasChanges) {
        const normalized = normalizeBlocks(blocks, ctx);
        const saveRes = await adminApi.put('/admin/content/home', { blocks: normalized, base_revision: doc?.revision });
        currentDoc = saveRes?.data || doc;
        setDoc(currentDoc);
        setBlocks((currentDoc?.draft?.blocks) || normalized);
        setDirty(false);
        showToast('초안을 먼저 저장한 뒤 게시합니다.', 'info');
      }
      const res = await adminApi.post('/admin/content/home/publish', { base_revision: currentDoc?.revision ?? doc?.revision });
      setDoc(res?.data || currentDoc);
      setBlocks((res?.data?.draft?.blocks) || blocks);
      setDirty(false);
      showToast('홈페이지가 게시되었습니다.', 'success');
    } catch (e) {
      if (e?.status === 409 || e?.code === 'LAYOUT_CONFLICT') {
        showToast('다른 곳에서 먼저 수정되었습니다 — 새로고침 후 다시 시도하세요.', 'error');
      } else {
        showToast(e?.message || '게시 실패', 'error');
      }
    } finally {
      setPublishing(false);
      setConfirmAction(null);
    }
  };
  const doDiscard = async () => {
    try {
      const res = await adminApi.post('/admin/content/home/discard', { base_revision: doc?.revision });
      setDoc(res?.data || doc);
      setBlocks((res?.data?.draft?.blocks) || []);
      setDirty(false);
      showToast('초안이 되돌려졌습니다.', 'success');
    } catch (e) {
      showToast(e?.message || '되돌리기 실패', 'error');
    } finally {
      setConfirmAction(null);
    }
  };
  const doReset = async () => {
    try {
      await adminApi.delete('/admin/content/home');
      await load();
      showToast('기본 레이아웃으로 복원되었습니다.', 'success');
    } catch (e) {
      showToast(e?.message || '복원 실패', 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  const createBannerFromImage = async (blockId, url, kind = 'promo') => {
    try {
      const created = await adminApi.post('/admin/content/banners', {
        type: kind === 'hero' ? 'hero' : 'promo',
        placement: kind === 'hero' ? 'home_hero' : 'home_after_best',
        title_ko: '홈 배너',
        title_en: 'Home Banner',
        image_url: url,
        is_active: true,
        sort_order: 1,
      });
      const newId = created?.data?.id;
      if (!newId) throw new Error('BANNER_CREATE_FAILED');
      setBanners(prev => [created.data, ...prev]);
      if (kind === 'hero' || kind === 'editorial') {
        updateBlock(blockId, { banner_id: newId, source: 'specific', image_mode: 'banner' });
      } else {
        updateBlock(blockId, { source: 'specific', banner_id: newId });
      }
      showToast('배너가 생성되고 블록에 연결되었습니다.', 'success');
    } catch (e) {
      showToast(e?.message || '배너 생성 실패', 'error');
    } finally {
      setMediaTarget(null);
    }
  };

  const previewData = useMemo(() => {
    const base = storefrontData || {};
    return { ...base, layout: blocks };
  }, [storefrontData, blocks]);

  const pickerBlock = pickerBlockId ? blocks.find(b => b.id === pickerBlockId) : null;

  if (loading) {
    return (
      <AdminLayout activePage="home">
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>불러오는 중…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePage="home">
      <PageHeader
        title="홈 편집"
        subtitle="드래그 앤 드롭으로 홈페이지 섹션을 구성하고, 상품 개수·카테고리·배너 크기를 설정합니다."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`adm-home-status ${hasChanges ? 'is-dirty' : 'is-clean'}`}>
              {doc?.published?.blocks?.length ? (hasChanges ? '변경사항 있음' : '게시됨') : '게시 안 됨 · 기본 레이아웃'}
            </span>
            <button className="btn btn-ghost" onClick={() => setPreviewOpen(true)}><Eye size={14} /> 미리보기</button>
            <button className="btn btn-ghost" disabled={!hasChanges} onClick={() => setConfirmAction('discard')}>초안 버리기</button>
            <button className="btn btn-ghost" onClick={undo} disabled={!history.length} title="실행 취소">↶ 실행취소</button>
            <button className="btn btn-ghost" onClick={redo} disabled={!future.length} title="다시 실행">↷ 다시실행</button>
            <button className="btn btn-primary" onClick={saveDraft} disabled={saving || !dirty && !hasChanges}>
              <Save size={14} /> {saving ? '저장 중…' : '초안 저장'}
            </button>
            <button className="btn btn-primary" onClick={() => setConfirmAction('publish')} disabled={publishing || !blocks.length}>
              <Upload size={14} /> {publishing ? '게시 중…' : '게시'}
            </button>
          </div>
        }
      />
      {error ? <ErrorBanner message={error} /> : null}

      <div className="adm-home-workspace">
        {/* LEFT: editor */}
        <div className="adm-home-editor-pane">
          <div className="adm-home-palette adm-home-palette--compact">
            <strong>블록 추가</strong>
            <div style={{ marginBottom: 8 }}>
            <select className="form-select" onChange={(e) => { if (e.target.value) { const nb = applyPreset(e.target.value, ctx); if (nb) applyBlocks(nb); e.target.value = ''; } }} defaultValue="">
              <option value="">레이아웃 프리셋…</option>
              <option value="minimal">미니멀</option>
              <option value="rich">리치 (기본)</option>
              <option value="sale">세일 집중</option>
              <option value="landing">랜딩</option>
            </select>
          </div>
          <div className="adm-home-palette__chips">
              {BLOCK_PALETTE.map(p => (
                <button key={p.type} className="adm-home-palette__chip" onClick={() => addBlock(p.type)} title={p.desc}>
                  <Plus size={12} /> {p.label}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmAction('reset')} style={{ marginTop: 8 }}>
              <RotateCcw size={12} /> 기본값 복원
            </button>
          </div>

          <div className="adm-home-list">
            {blocks.length === 0 ? (
              <Empty title="블록이 없습니다" description="위에서 블록을 추가하세요." />
            ) : (
              blocks.map((b, index) => {
                const isExpanded = expandedId === b.id;
                const isDragging = dragIndex === index;
                const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index;
                return (
                  <div
                    key={b.id}
                    className={`adm-home-block ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''} ${b.enabled === false ? 'is-disabled' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="adm-home-block__head">
                      <button className="adm-home-block__handle" aria-label="드래그하여 이동" type="button">
                        <GripVertical size={14} />
                      </button>
                      <div className="adm-home-block__title">
                        <strong>{BLOCK_PALETTE.find(p => p.type === b.type)?.label || b.type}</strong>
                        <small>{blockSummary(b, ctx)}</small>
                      </div>
                      {b.banner_id && banners.find(x => x.id === b.banner_id)?.image_url && (
                        <img src={banners.find(x => x.id === b.banner_id).image_url} alt="" style={{ width: 40, height: 26, objectFit: 'cover', borderRadius: 3, border: '1px solid #ddd' }} />
                      )}
                      <div className="adm-home-block__actions">
                        <button type="button" title="위로" onClick={() => move(index, index - 1)} disabled={index === 0}><ChevronUp size={14} /></button>
                        <button type="button" title="아래로" onClick={() => move(index, index + 1)} disabled={index === blocks.length - 1}><ChevronDown size={14} /></button>
                        <button type="button" title={b.enabled === false ? '표시' : '숨기기'} onClick={() => toggleEnabled(b.id)}>
                          {b.enabled === false ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button type="button" title="복제" onClick={() => duplicateBlock(b.id)}><Copy size={14} /></button>
                        <button type="button" title="삭제" onClick={() => removeBlock(b.id)}><Trash2 size={14} /></button>
                        <button type="button" title="편집" onClick={() => setExpandedId(isExpanded ? null : b.id)}>
                          {isExpanded ? <X size={14} /> : <span style={{ fontSize: 11 }}>편집</span>}
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="adm-home-block__body">
                        <BlockEditor
                          block={b}
                          categories={categories}
                          banners={banners}
                          storefrontData={storefrontData}
                          ctx={ctx}
                          onChange={(patch) => updateBlock(b.id, patch)}
                          onPickProducts={() => setPickerBlockId(b.id)}
                          onPickImage={(kind) => setMediaTarget({ blockId: b.id, kind })}
                        />
                        <div className="adm-home-advanced">
                          <details open>
                            <summary>고급 (라벨 / 기기 / 게시 일정)</summary>
                            <div className="adm-home-editor" style={{ marginTop: 8 }}>
                              <label>라벨 (관리용)</label>
                              <input className="form-input" value={b.label || ''} onChange={(e) => updateBlock(b.id, { label: e.target.value })} />
                              <label>노출 기기</label>
                              <select className="form-select" value={b.device || 'all'} onChange={(e) => updateBlock(b.id, { device: e.target.value })}>
                                <option value="all">모든 기기</option>
                                <option value="desktop">데스크톱만</option>
                                <option value="mobile">모바일만</option>
                              </select>
                              <label>게시 시작일</label>
                              <input type="date" className="form-input" value={b.start_date || ''} onChange={(e) => updateBlock(b.id, { start_date: e.target.value || null })} />
                              <label>게시 종료일</label>
                              <input type="date" className="form-input" value={b.end_date || ''} onChange={(e) => updateBlock(b.id, { end_date: e.target.value || null })} />
                            </div>
                          </details>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: live preview */}
        <div className="adm-home-preview-pane">
          <div className="adm-home-preview-pane__head">
            <strong>실시간 미리보기 (초안)</strong>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewWidth(390)}><Smartphone size={12} /> 모바일</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewWidth(1200)}><Monitor size={12} /> 데스크톱</button>
            </div>
          </div>
          {(() => {
            const issues = validateLayout(blocks, ctx);
            if (!issues.length) return null;
            return (
              <div style={{ marginBottom: 8, padding: 8, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 11 }}>
                <strong style={{ color: '#9a3412' }}>검증 경고</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#7c2d12' }}>
                  {issues.map((it, i) => <li key={i}>{it.level === 'error' ? '🔴' : '🟡'} {it.message}</li>)}
                </ul>
              </div>
            );
          })()}
          <div className="adm-home-preview-pane__body" style={{ maxWidth: previewWidth }}>
            <HomeBlocks blocks={blocks} data={previewData} />
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="adm-home-preview-backdrop" onClick={() => setPreviewOpen(false)}>
          <div className="adm-home-preview" onClick={(e) => e.stopPropagation()} style={{ maxWidth: previewWidth }}>
            <div className="adm-home-preview__head">
              <strong>미리보기 (초안)</strong>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPreviewWidth(390)}><Smartphone size={12} /> 모바일</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setPreviewWidth(1200)}><Monitor size={12} /> 데스크톱</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setPreviewOpen(false)}><X size={12} /></button>
              </div>
            </div>
            <div className="adm-home-preview__body">
              <HomeBlocks blocks={blocks} data={previewData} />
            </div>
          </div>
        </div>
      )}

      {/* Media picker (banner photo) */}
      {mediaTarget && (
        <MediaPickerModal
          isOpen
          onClose={() => setMediaTarget(null)}
          onSelect={(url) => createBannerFromImage(mediaTarget.blockId, url, mediaTarget.kind)}
        />
      )}

      {/* Product picker */}
      {pickerBlock && (
        <ProductPickerModal
          block={pickerBlock}
          categories={categories}
          storefrontData={storefrontData}
          onClose={() => setPickerBlockId(null)}
          onSave={(ids) => { updateBlock(pickerBlock.id, { product_ids: ids }); setPickerBlockId(null); }}
        />
      )}

      {/* Confirm modals */}
      {confirmAction === 'publish' && (
        <ConfirmModal
          open
          title="홈페이지 게시"
          desc="현재 초안을 라이브 홈페이지에 게시할까요?"
          confirmLabel="게시"
          onConfirm={doPublish}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'discard' && (
        <ConfirmModal
          open
          title="초안 버리기"
          desc="저장되지 않은 초안을 되돌리고 마지막 게시본으로 돌아갑니다."
          confirmLabel="되돌리기"
          onConfirm={doDiscard}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'reset' && (
        <ConfirmModal
          open
          title="기본값 복원"
          desc="홈페이지 레이아웃을 삭제하고 기본 레이아웃으로 복원합니다. 이 작업은 되돌릴 수 없습니다."
          confirmLabel="복원"
          danger
          onConfirm={doReset}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </AdminLayout>
  );
}

function BlockEditor({ block, categories, banners, storefrontData, ctx, onChange, onPickProducts, onPickImage }) {
  const catOptions = categories || [];
  const bannerOptions = banners || [];
  switch (block.type) {
    case 'hero':
      return (
        <div className="adm-home-editor">
          <label>배너 위치</label>
          <input className="form-input" value={block.placement} onChange={(e) => onChange({ placement: e.target.value })} placeholder="home_hero" />
          <label>또는 지정 배너 ID</label>
          <select className="form-select" value={block.banner_id} onChange={(e) => onChange({ banner_id: e.target.value })}>
            <option value="">(자동)</option>
            {bannerOptions.map(b => <option key={b.id} value={b.id}>{b.title_ko || b.title_en || b.id}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPickImage('hero')}>
              <ImageIcon size={12} /> 배너 사진 추가/변경
            </button>
            {block.banner_id && banners.find(b => b.id === block.banner_id)?.image_url && (
              <img src={banners.find(b => b.id === block.banner_id).image_url} alt="" style={{ width: 60, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
            )}
          </div>
          <label>높이</label>
          <select className="form-select" value={block.height} onChange={(e) => onChange({ height: e.target.value })}>
            <option value="sm">작게</option><option value="md">보통</option><option value="lg">크게</option>
          </select>
        </div>
      );
    case 'delivery':
      return (
        <div className="adm-home-editor">
          <label>변형</label>
          <select className="form-select" value={block.variant} onChange={(e) => onChange({ variant: e.target.value })}>
            <option value="slim">슬림</option><option value="default">기본</option>
          </select>
        </div>
      );
    case 'product_rail':
      return (
        <div className="adm-home-editor">
          <label>소스</label>
          <select className="form-select" value={block.source} onChange={(e) => onChange({ source: e.target.value })}>
            <option value="best">베스트</option><option value="new">신상품</option><option value="category">카테고리</option><option value="sale">세일</option><option value="all">전체</option><option value="manual">수동 선택</option>
          </select>
          {block.source === 'category' && (
            <>
              <label>카테고리</label>
              <select className="form-select" value={block.category_slug} onChange={(e) => onChange({ category_slug: e.target.value })}>
                <option value="">(선택)</option>
                {catOptions.map(c => <option key={c.id || c.slug} value={c.slug}>{c.name_ko || c.name_en || c.slug} ({(c.product_count ?? '')})</option>)}
              </select>
            </>
          )}
          {block.source === 'manual' && (
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onPickProducts}>
                <Package size={12} /> 상품 선택 ({(block.product_ids || []).length})
              </button>
              {(block.product_ids || []).length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {(block.product_ids || []).slice(0, 8).map((id, i) => {
                    const all = (storefrontData?.categories || []).flatMap(c => c.products || []);
                    const p = all.find(x => x.id === id);
                    const img = p ? ((Array.isArray(p.images) && p.images[0]) || p.image_url || '') : '';
                    return img
                      ? <img key={i} src={img} alt="" title={p?.name_ko} style={{ width: 32, height: 42, objectFit: 'cover', borderRadius: 3, border: '1px solid #ddd' }} />
                      : <span key={i} style={{ fontSize: 10, padding: '2px 6px', background: '#eef2ff', borderRadius: 4, color: '#3730a3' }}>#{id}</span>;
                  })}
                </div>
              )}
            </div>
          )}
          <label>개수</label>
          <input type="number" min={1} max={12} className="form-input" value={block.limit} onChange={(e) => onChange({ limit: Number(e.target.value) })} />
          <label>표시</label>
          <select className="form-select" value={block.display} onChange={(e) => onChange({ display: e.target.value })}>
            <option value="carousel">캐러셀</option><option value="grid">그리드</option>
          </select>
          <label>제목 (한국어)</label>
          <input className="form-input" value={block.title_ko} onChange={(e) => onChange({ title_ko: e.target.value })} />
          <label>제목 (영어)</label>
          <input className="form-input" value={block.title_en} onChange={(e) => onChange({ title_en: e.target.value })} />
          <label>Eyebrow</label>
          <input className="form-input" value={block.eyebrow} onChange={(e) => onChange({ eyebrow: e.target.value })} />
          <label>더보기 링크</label>
          <input className="form-input" value={block.more_href} onChange={(e) => onChange({ more_href: e.target.value })} />
        </div>
      );
    case 'category_tiles':
      return (
        <div className="adm-home-editor">
          <label>타일 개수</label>
          <input type="number" min={2} max={8} className="form-input" value={block.limit} onChange={(e) => onChange({ limit: Number(e.target.value) })} />
        </div>
      );
    case 'category_row':
      return (
        <div className="adm-home-editor">
          <label>카테고리</label>
          <select className="form-select" value={block.category_slug} onChange={(e) => onChange({ category_slug: e.target.value })}>
            <option value="">(선택)</option>
            {catOptions.map(c => <option key={c.id || c.slug} value={c.slug}>{c.name_ko || c.name_en || c.slug}</option>)}
          </select>
          <label>상품 개수</label>
          <input type="number" min={2} max={12} className="form-input" value={block.limit} onChange={(e) => onChange({ limit: Number(e.target.value) })} />
          {block.category_slug && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {(() => {
                const sfCat = (storefrontData?.categories || []).find(c => c.slug === block.category_slug);
                const prods = sfCat?.products || [];
                return prods.slice(0, 6).map((p, i) => {
                  const img = (Array.isArray(p.images) && p.images[0]) || p.image_url || '';
                  return img ? <img key={i} src={img} alt="" style={{ width: 32, height: 42, objectFit: 'cover', borderRadius: 3, border: '1px solid #ddd' }} /> : null;
                });
              })()}
              <span style={{ fontSize: 10, color: '#888', alignSelf: 'center' }}>
                {categories.find(c => c.slug === block.category_slug)?.product_count ?? 0}개 상품
              </span>
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={block.show_anchored_banners !== false} onChange={(e) => onChange({ show_anchored_banners: e.target.checked })} />
            연결된 배너 표시
          </label>
        </div>
      );
    case 'banner':
      return (
        <div className="adm-home-editor">
          <label>소스</label>
          <select className="form-select" value={block.source} onChange={(e) => onChange({ source: e.target.value })}>
            <option value="placement">위치 (자동)</option><option value="specific">지정 배너</option>
          </select>
          {block.source === 'placement' ? (
            <>
              <label>위치</label>
              <select className="form-select" value={block.placement} onChange={(e) => onChange({ placement: e.target.value })}>
                <option value="home_hero">홈 히어로</option>
                <option value="home_after_best">베스트 다음</option>
                <option value="home_after_browse">탐색 다음</option>
                <option value="home_between_categories">카테고리 사이</option>
                <option value="home_before_footer">에디토리얼 전</option>
                <option value="shop_top">쇼프 상단</option>
              </select>
              <label>개수</label>
              <input type="number" min={1} max={5} className="form-input" value={block.limit} onChange={(e) => onChange({ limit: Number(e.target.value) })} />
            </>
          ) : (
            <>
              <label>배너</label>
              <select className="form-select" value={block.banner_id} onChange={(e) => onChange({ banner_id: e.target.value })}>
                <option value="">(선택)</option>
                {bannerOptions.map(b => <option key={b.id} value={b.id}>{b.title_ko || b.title_en || b.id}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPickImage('banner')}>
                  <ImageIcon size={12} /> 사진 추가/변경
                </button>
                {block.banner_id && banners.find(b => b.id === block.banner_id)?.image_url && (
                  <img src={banners.find(b => b.id === block.banner_id).image_url} alt="" style={{ width: 60, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
                )}
              </div>
            </>
          )}
          <label>너비</label>
          <div className="adm-home-chips">
            <button type="button" className={block.width === 'full' ? 'is-active' : ''} onClick={() => onChange({ width: 'full' })}>전체폭</button>
            <button type="button" className={block.width === 'half' ? 'is-active' : ''} onClick={() => onChange({ width: 'half' })}>절반폭</button>
          </div>
          <label>높이</label>
          <select className="form-select" value={block.height} onChange={(e) => onChange({ height: e.target.value })}>
            <option value="sm">작게</option><option value="md">보통</option><option value="lg">크게</option>
          </select>
        </div>
      );
    case 'editorial':
      return (
        <div className="adm-home-editor">
          <label>이미지 모드</label>
          <select className="form-select" value={block.image_mode} onChange={(e) => onChange({ image_mode: e.target.value })}>
            <option value="auto">자동</option><option value="banner">지정 배너</option>
          </select>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPickImage('editorial')} style={{ alignSelf: 'flex-start' }}>
            <ImageIcon size={12} /> 배너 사진 추가/변경
          </button>
          {block.image_mode === 'banner' && (
            <>
              <label>배너</label>
              <select className="form-select" value={block.banner_id} onChange={(e) => onChange({ banner_id: e.target.value })}>
                <option value="">(선택)</option>
                {bannerOptions.map(b => <option key={b.id} value={b.id}>{b.title_ko || b.title_en || b.id}</option>)}
              </select>
            </>
          )}
          <label>제목</label>
          <input className="form-input" value={block.title_ko} onChange={(e) => onChange({ title_ko: e.target.value })} />
          <label>링크</label>
          <input className="form-input" value={block.href} onChange={(e) => onChange({ href: e.target.value })} />
        </div>
      );
    default:
      return null;
  }
}

export default AdminHomePage;
