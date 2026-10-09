import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  PageHeader,
  Filters,
  ErrorBanner,
  ConfirmModal,
} from '../../components/admin/ui/index.js';
import { adminApi } from '../../utils/api.js';
import { useListParams } from '../../hooks/useListParams.js';
import { useToast } from '../../context/ToastContext.jsx';
import { CardGridSkeleton } from '../../components/admin/AdminSkeleton.jsx';
import { Plus, Edit2, Trash2, FolderTree, X, Eye, EyeOff, ArrowUp, ArrowDown, Package, Users, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export function AdminCategoriesPage() {
  // Filter state lives in the URL (?search=&gender=&status=) — client-side
  // filtering over the full category list.
  const listParams = useListParams({ keys: ['search', 'gender', 'status'] });
  const pv = listParams.values;
  const search = pv.search || '';
  const genderFilter = pv.gender || 'all';
  const statusFilter = pv.status || 'all';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    slug: '',
    name_ko: '',
    name_en: '',
    description_ko: '',
    description_en: '',
    gender: 'unisex',
    sort_order: 0,
    is_active: true,
  });
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [sampleProducts, setSampleProducts] = useState({});
  const [sampleLoading, setSampleLoading] = useState({});

  const fetchCategories = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const res = await adminApi.get('/admin/categories');
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('401') || msg.includes('SIGN_IN_REQUIRED')) setErrorMsg('관리자 로그인이 필요합니다.');
      else if (msg.includes('403')) setErrorMsg('관리자 권한이 없습니다.');
      else setErrorMsg(msg || '카테고리를 불러오지 못했습니다.');
      showToast('카테고리를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = useMemo(() => {
    let list = [...categories];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => c.slug.toLowerCase().includes(q) || c.name_ko.toLowerCase().includes(q) || c.name_en.toLowerCase().includes(q));
    }
    if (genderFilter !== 'all') list = list.filter(c => (c.gender || 'unisex') === genderFilter);
    if (statusFilter === 'active') list = list.filter(c => c.is_active);
    if (statusFilter === 'hidden') list = list.filter(c => !c.is_active);
    return list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);
  }, [categories, search, genderFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter(c => c.is_active).length;
    const totalProducts = categories.reduce((s, c) => s + (c.product_count || 0), 0);
    const avgProducts = total ? (totalProducts / total).toFixed(1) : 0;
    return { total, active, hidden: total - active, totalProducts, avgProducts };
  }, [categories]);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      slug: '',
      name_ko: '',
      name_en: '',
      description_ko: '',
      description_en: '',
      gender: 'unisex',
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
      gender: cat.gender || 'unisex',
      sort_order: cat.sort_order || 0,
      is_active: Boolean(cat.is_active),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        name_en: formData.name_en || formData.name_ko,
        description_en: formData.description_en || formData.description_ko || '',
      };
      if (isEditMode) {
        await adminApi.put(`/admin/categories/${editingId}`, payload);
        showToast('카테고리가 수정되었습니다.', 'success');
      } else {
        await adminApi.post('/admin/categories', payload);
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
      await adminApi.delete(`/admin/categories/${id}`);
      showToast('카테고리가 삭제되었습니다.', 'info');
      setDeleteConfirmId(null);
      fetchCategories();
    } catch (err) {
      showToast(err.message || '삭제 실패', 'error');
    }
  };

  const toggleActive = async (cat) => {
    try {
      await adminApi.put(`/admin/categories/${cat.id}`, { is_active: !cat.is_active });
      showToast(cat.is_active ? '카테고리가 숨김 처리되었습니다.' : '카테고리가 활성화되었습니다.', 'success');
      fetchCategories();
    } catch (err) {
      showToast('상태 변경 실패', 'error');
    }
  };

  const moveOrder = async (cat, dir) => {
    const sorted = [...filtered].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const idx = sorted.findIndex(c => c.id === cat.id);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const target = sorted[targetIdx];
    // Atomic reorder: single PATCH with the full new order (no split PUTs).
    try {
      const next = [...sorted];
      next[idx] = target;
      next[targetIdx] = cat;
      await adminApi.patch('/admin/categories/reorder', { orderedIds: next.map((c) => c.id) });
      fetchCategories();
    } catch {
      showToast('순서 변경 실패', 'error');
    }
  };

  const toggleExpanded = async (cat) => {
    if (expandedCategory === cat.id) {
      setExpandedCategory(null);
      return;
    }
    setExpandedCategory(cat.id);
    if (sampleProducts[cat.slug]) return;
    setSampleLoading(prev => ({ ...prev, [cat.id]: true }));
    try {
      const res = await adminApi.get(`/admin/products?category=${encodeURIComponent(cat.slug)}&limit=5`);
      if (res.success) {
        setSampleProducts(prev => ({ ...prev, [cat.slug]: res.data || [] }));
      }
    } catch {
      // fallback to public catalog if admin empty
      try {
        const res = await adminApi.get(`/catalog/products?category=${encodeURIComponent(cat.slug)}&limit=5`);
        if (res.success) setSampleProducts(prev => ({ ...prev, [cat.slug]: res.data || [] }));
      } catch {}
    } finally {
      setSampleLoading(prev => ({ ...prev, [cat.id]: false }));
    }
  };

  return (
    <AdminLayout activePage="categories">
      <PageHeader
        ko="카테고리 관리"
        desc="상품 분류 카테고리 추가, 노출 순서 및 성별/활성 관리"
        actions={(
          <button type="button" className="adm-btn adm-btn-primary" onClick={openAddModal}>
            <Plus size={16} aria-hidden />
            <span>새 카테고리 추가</span>
          </button>
        )}
      />

      <ErrorBanner message={errorMsg ? `로드 실패: ${errorMsg}` : ''} onRetry={fetchCategories} />

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontSize: '0.6875rem', color: '#71717a', fontWeight: 700, textTransform: 'uppercase' }}>전체 카테고리</div><div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.total}</div></div>
            <FolderTree size={20} color="#71717a" />
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 700 }}>활성</div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{stats.active}</div></div>
            <Eye size={20} color="#16a34a" />
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontSize: '0.6875rem', color: '#dc2626', fontWeight: 700 }}>숨김</div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{stats.hidden}</div></div>
            <EyeOff size={20} color="#dc2626" />
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontSize: '0.6875rem', color: '#71717a', fontWeight: 700 }}>총 상품</div><div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.totalProducts}</div><div style={{ fontSize: '0.6875rem', color: '#a1a1aa' }}>평균 {stats.avgProducts}/카테고리</div></div>
            <Package size={20} color="#71717a" />
          </div>
        </div>

        {/* Filters */}
        <Filters
          searchValue={search}
          onSearch={(v) => listParams.set({ search: v })}
          onReset={listParams.reset}
          searchPlaceholder="슬러그, 카테고리명 검색..."
          selects={[
            {
              name: 'gender', value: genderFilter, onChange: (v) => listParams.set({ gender: v }), ariaLabel: '성별', label: '성별',
              options: [
                { value: 'all', label: '전체 성별' },
                { value: 'unisex', label: '남녀공용' },
                { value: 'men', label: '남성' },
                { value: 'women', label: '여성' },
              ],
            },
            {
              name: 'status', value: statusFilter, onChange: (v) => listParams.set({ status: v }), ariaLabel: '상태', label: '상태',
              options: [
                { value: 'all', label: '전체 상태' },
                { value: 'active', label: '활성' },
                { value: 'hidden', label: '숨김' },
              ],
            },
          ]}
        >
          <span style={{ fontSize: '0.75rem', color: '#71717a', marginLeft: 'auto' }}>{filtered.length} / {stats.total} 표시</span>
        </Filters>

        {/* Categories Grid */}
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e4e4e7', color: '#71717a' }}>
            <FolderTree size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600 }}>조건에 맞는 카테고리가 없습니다.</p>
            <p style={{ fontSize: '0.8125rem', marginTop: 4 }}>검색어나 필터를 초기화하거나 새 카테고리를 추가하세요.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filtered.map((cat) => (
              <div key={cat.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: cat.is_active ? '1px solid #e4e4e7' : '1px dashed #fca5a5', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', opacity: cat.is_active ? 1 : 0.85 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 16px', backgroundColor: '#f4f4f5', borderBottom: '1px solid #e4e4e7' }}>
                  <span style={{ backgroundColor: '#18181b', color: '#ffffff', fontSize: '0.6875rem', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                    slug: {cat.slug}
                  </span>
                  <span style={{ backgroundColor: cat.is_active ? '#16a34a' : '#fee2e2', color: cat.is_active ? '#fff' : '#dc2626', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                    {cat.is_active ? '활성' : '숨김'}
                  </span>
                  <span style={{ marginLeft: 'auto', backgroundColor: '#ffffff', color: '#18181b', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', border: '1px solid #e4e4e7', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Package size={12} /> {cat.product_count || 0}개
                  </span>
                  <span style={{ backgroundColor: cat.gender === 'women' ? '#fce7f3' : cat.gender === 'men' ? '#dbeafe' : '#f3f4f6', color: cat.gender === 'women' ? '#be185d' : cat.gender === 'men' ? '#1e40af' : '#374151', fontSize: '0.625rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {cat.gender || 'unisex'}
                  </span>
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '2px' }}>
                      {cat.name_ko}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#71717a', lineHeight: 1.4, marginTop: '6px', minHeight: 32 }}>
                      {cat.description_ko || cat.description_en || '설명 없음 — 상품 분류용 카테고리입니다.'}
                    </p>
                  </div>

                  {/* Available products in this category — B) 5 thumbs drawer on click, lazy 1 query per open */}
                  {expandedCategory === cat.id ? (
                    <div style={{ marginTop: 12, padding: '12px', backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e4e4e7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#18181b' }}>이 카테고리 상품 ({(sampleProducts[cat.slug] || []).length}개 미리보기)</span>
                        <button onClick={() => setExpandedCategory(null)} style={{ fontSize: '0.6875rem', color: '#71717a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><ChevronUp size={12} /> 접기</button>
                      </div>
                      {sampleLoading[cat.id] ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {[0,1,2,3,4].map(i => <div key={i} style={{ width: 56, height: 72, backgroundColor: '#e4e4e7', borderRadius: 6, animation: 'pulse 1.4s infinite' }} />)}
                        </div>
                      ) : (sampleProducts[cat.slug] || []).length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: '#71717a' }}>상품 없음 — 먼저 상품을 이 카테고리에 등록하세요.</p>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                          {(sampleProducts[cat.slug] || []).map(p => (
                            <a key={p.id} href={`/shop?category=${cat.slug}`} style={{ flexShrink: 0, width: 56, textAlign: 'center', textDecoration: 'none' }}>
                              <img src={p.images?.[0] || p.image_url || '/products/men/tshirts/classic-tshirt/1.jpg'} alt={p.name_ko} style={{ width: 56, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #e4e4e7' }} loading="lazy" />
                              <div style={{ fontSize: '0.625rem', color: '#52525b', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 56 }}>{p.name_ko}</div>
                            </a>
                          ))}
                        </div>
                      )}
                      <a href={`/shop?category=${cat.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.6875rem', color: '#2563eb', marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}><ExternalLink size={12} /> 쇼핑몰에서 전체 보기</a>
                    </div>
                  ) : (
                    <button onClick={() => toggleExpanded(cat)} style={{ marginTop: 12, width: '100%', padding: '8px', backgroundColor: '#f4f4f5', border: '1px dashed #d4d4d8', borderRadius: 6, fontSize: '0.75rem', color: '#52525b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Package size={12} /> 이 카테고리 상품 {cat.product_count || 0}개 보기 <ChevronDown size={12} />
                    </button>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f0f0f2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.6875rem', color: '#888' }}>순서: <strong>{cat.sort_order}</strong></span>
                      <button onClick={() => moveOrder(cat, 'up')} title="위로 이동" style={{ padding: '4px', backgroundColor: '#f4f4f5', borderRadius: 4, border: '1px solid #e4e4e7', cursor: 'pointer' }}><ArrowUp size={12} /></button>
                      <button onClick={() => moveOrder(cat, 'down')} title="아래로 이동" style={{ padding: '4px', backgroundColor: '#f4f4f5', borderRadius: 4, border: '1px solid #e4e4e7', cursor: 'pointer' }}><ArrowDown size={12} /></button>
                      <button onClick={() => toggleActive(cat)} title={cat.is_active ? '숨김 처리' : '활성화'} style={{ padding: '4px 6px', backgroundColor: cat.is_active ? '#fef3c7' : '#dcfce7', borderRadius: 4, border: '1px solid #e4e4e7', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {cat.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <a href={`/shop?category=${cat.slug}`} target="_blank" rel="noopener noreferrer" title="쇼핑몰에서 보기" style={{ padding: '6px 10px', backgroundColor: '#eff6ff', borderRadius: '4px', fontSize: '0.75rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                        <Users size={12} /> 보기
                      </a>
                      <button onClick={() => openEditModal(cat)} style={{ padding: '6px 10px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontSize: '0.75rem', color: '#18181b', display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #e4e4e7', cursor: 'pointer' }}>
                        <Edit2 size={12} /> 수정
                      </button>
                      <button onClick={() => setDeleteConfirmId(cat.id)} style={{ padding: '6px 10px', backgroundColor: '#fee2e2', borderRadius: '4px', fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #fecaca', cursor: 'pointer' }}>
                        <Trash2 size={12} /> 삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmModal
          open={!!deleteConfirmId}
          title="카테고리 삭제"
          desc="카테고리를 삭제하시겠습니까? 카테고리에 속한 상품이 있을 경우 삭제할 수 없습니다. 먼저 상품의 카테고리를 변경하세요."
          confirmLabel="삭제"
          onConfirm={() => handleDelete(deleteConfirmId)}
          onClose={() => setDeleteConfirmId(null)}
        />

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <>
            <div className="adm-backdrop" onClick={() => setIsModalOpen(false)} />
            <div className="adm-modal" role="dialog" aria-modal="true" aria-label={isEditMode ? '카테고리 수정' : '새 카테고리 추가'} style={{ maxWidth: 560 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <h2>{isEditMode ? '카테고리 수정' : '새 카테고리 추가'}</h2>
                <button type="button" className="adm-icon-btn" onClick={() => setIsModalOpen(false)} aria-label="닫기"><X size={16} /></button>
              </div>

              <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">영문 슬러그 (Slug) * — URL 주소용</label>
                  <input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })} placeholder="예: knitwear, outerwear" className="form-input" />
                  <span style={{ fontSize: '0.6875rem', color: '#71717a' }}>소문자, 숫자, -, _ 만 허용. 예: /shop?category={formData.slug || 'example'}</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">카테고리명 *</label>
                  <input type="text" required value={formData.name_ko} onChange={(e) => setFormData({ ...formData, name_ko: e.target.value, name_en: e.target.value })} placeholder="예: 니트 / 가디건" className="form-input" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">성별</label>
                    <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="form-select">
                      <option value="unisex">남녀공용</option>
                      <option value="men">남성</option>
                      <option value="women">여성</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">노출 순서</label>
                    <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })} className="form-input" />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">카테고리 설명 (선택)</label>
                  <input type="text" value={formData.description_ko} onChange={(e) => setFormData({ ...formData, description_ko: e.target.value, description_en: e.target.value })} placeholder="카테고리 설명" className="form-input" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', backgroundColor: formData.is_active ? '#f0fdf4' : '#fef2f2', borderRadius: 8, border: `1px solid ${formData.is_active ? '#bbf7d0' : '#fecaca'}` }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.is_active ? '#166534' : '#991b1b' }}>
                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                    <span>{formData.is_active ? '활성 — 쇼핑몰에 노출' : '숨김 — 관리자만 보임'}</span>
                  </label>
                </div>

                <div className="adm-modal-actions">
                  <button type="button" className="adm-btn" onClick={() => setIsModalOpen(false)}>취소</button>
                  <button type="submit" className="adm-btn adm-btn-primary">저장하기</button>
                </div>
              </form>
            </div>
          </>
        )}
    </AdminLayout>
  );
}
