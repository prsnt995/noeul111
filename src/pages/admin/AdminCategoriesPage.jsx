import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { adminApi } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { CardGridSkeleton } from '../../components/admin/AdminSkeleton.jsx';
import { Plus, Edit2, Trash2, FolderTree, X, AlertCircle, Search, Eye, EyeOff, ArrowUp, ArrowDown, Image as ImageIcon, Package, Users, Filter, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { MediaPickerModal } from '../../components/common/MediaPickerModal.jsx';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [errorMsg, setErrorMsg] = useState('');
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    slug: '',
    name_ko: '',
    name_en: '',
    description_ko: '',
    description_en: '',
    image_url: '',
    gender: 'unisex',
    sort_order: 0,
    is_active: true,
  });
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [sampleProducts, setSampleProducts] = useState({});
  const [sampleLoading, setSampleLoading] = useState({});
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      image_url: '',
      gender: 'unisex',
      sort_order: categories.length + 1,
      is_active: true,
    });
    setShowAdvanced(false);
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
      image_url: cat.image_url || '',
      gender: cat.gender || 'unisex',
      sort_order: cat.sort_order || 0,
      is_active: Boolean(cat.is_active),
    });
    setShowAdvanced(Boolean(cat.image_url));
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await adminApi.put(`/admin/categories/${editingId}`, formData);
        showToast('카테고리가 수정되었습니다.', 'success');
      } else {
        await adminApi.post('/admin/categories', formData);
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
    // swap sort_order
    try {
      await Promise.all([
        adminApi.put(`/admin/categories/${cat.id}`, { sort_order: target.sort_order }),
        adminApi.put(`/admin/categories/${target.id}`, { sort_order: cat.sort_order }),
      ]);
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
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>카테고리 관리 (Category Management)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              상품 분류 카테고리 추가, 배너 이미지, 노출 순서 및 성별/활성 관리 — Supabase `app.categories` (free-tier 15개)
            </p>
          </div>
          <button onClick={openAddModal} className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 18px', fontSize: '0.875rem' }}>
            <Plus size={16} />
            <span>새 카테고리 추가</span>
          </button>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: 16, fontSize: '0.875rem' }}>
            <strong>로드 실패:</strong> {errorMsg} <button onClick={fetchCategories} style={{ marginLeft: 8, padding: '4px 10px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>다시 시도</button>
          </div>
        )}

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
        <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #e4e4e7', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#999" style={{ position: 'absolute', top: 9, left: 9 }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="슬러그, 한글/영문명 검색" className="form-input" style={{ padding: '6px 10px 6px 28px', fontSize: '0.8125rem', width: 200 }} />
            </div>
            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="form-select" style={{ padding: '6px 10px', fontSize: '0.8125rem' }}>
              <option value="all">전체 성별</option>
              <option value="unisex">Unisex</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select" style={{ padding: '6px 10px', fontSize: '0.8125rem' }}>
              <option value="all">전체 상태</option>
              <option value="active">활성만</option>
              <option value="hidden">숨김만</option>
            </select>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{filtered.length} / {stats.total} 표시</span>
        </div>

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
                <div style={{ position: 'relative', height: '160px', backgroundColor: '#f4f4f5' }}>
                  <img src={cat.image_url || '/products/men/tshirts/classic-tshirt/1.jpg'} alt={cat.name_ko} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#ffffff', fontSize: '0.6875rem', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                    slug: {cat.slug}
                  </span>
                  <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: cat.is_active ? '#16a34a' : '#fee2e2', color: cat.is_active ? '#fff' : '#dc2626', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                    {cat.is_active ? '활성' : '숨김'}
                  </span>
                  <span style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: '#ffffff', color: '#18181b', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Package size={12} /> {cat.product_count || 0}개
                  </span>
                  <span style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: cat.gender === 'women' ? '#fce7f3' : cat.gender === 'men' ? '#dbeafe' : '#f3f4f6', color: cat.gender === 'women' ? '#be185d' : cat.gender === 'men' ? '#1e40af' : '#374151', fontSize: '0.625rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {cat.gender || 'unisex'}
                  </span>
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '2px' }}>
                      {cat.name_ko} <span style={{ fontSize: '0.8125rem', color: '#71717a', fontWeight: 400 }}>({cat.name_en})</span>
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#71717a', lineHeight: 1.4, marginTop: '6px', minHeight: 32 }}>
                      {cat.description_ko || cat.description_en || '설명 없음 — 상품 분류용 카테고리입니다.'}
                    </p>
                    {cat.description_en && cat.description_ko && (
                      <p style={{ fontSize: '0.6875rem', color: '#a1a1aa', marginTop: 4 }}>{cat.description_en}</p>
                    )}
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
        {deleteConfirmId && (
          <div className="backdrop" onClick={() => setDeleteConfirmId(null)} style={{ zIndex: 110 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', margin: '120px auto', backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <AlertCircle size={24} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>카테고리를 삭제하시겠습니까?</h3>
              <p style={{ fontSize: '0.875rem', color: '#71717a', marginBottom: '24px' }}>카테고리에 속한 상품이 있을 경우 삭제할 수 없습니다. 먼저 상품의 카테고리를 변경하세요.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary" style={{ flex: 1 }}>취소</button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="btn-primary" style={{ flex: 1, backgroundColor: '#dc2626' }}>확인 및 삭제</button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="backdrop" onClick={() => setIsModalOpen(false)} style={{ zIndex: 100 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '560px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{isEditMode ? '카테고리 수정' : '새 카테고리 추가'}</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">영문 슬러그 (Slug) * — URL에 사용</label>
                  <input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })} placeholder="e.g. outerwear, knitwear" className="form-input" />
                  <span style={{ fontSize: '0.6875rem', color: '#71717a' }}>소문자, 숫자, -, _ 만 허용. 예: /shop?category={formData.slug || 'example'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">한글 카테고리명 *</label>
                    <input type="text" required value={formData.name_ko} onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })} placeholder="예: 아우터" className="form-input" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">영문 카테고리명 *</label>
                    <input type="text" required value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} placeholder="e.g. Outerwear" className="form-input" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">성별 (Gender)</label>
                    <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="form-select">
                      <option value="unisex">Unisex (공용)</option>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">노출 순서</label>
                    <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })} className="form-input" />
                  </div>
                </div>

                <details open={showAdvanced} onToggle={(e) => setShowAdvanced(e.target.open)} style={{ border: '1px dashed #d4d4d8', borderRadius: 8, padding: '10px 12px', backgroundColor: '#fafafa' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700, color: '#52525b' }}>
                    고급 (선택): 배너 이미지 {formData.image_url ? '• 설정됨' : '• 미사용 (기본 이미지)'}
                  </summary>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input type="url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="선택 안 하면 기본 이미지 사용" className="form-input" style={{ flex: 1 }} />
                    <button type="button" onClick={() => setIsMediaPickerOpen(true)} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>미디어에서 선택</button>
                    {formData.image_url && <button type="button" onClick={() => setFormData({ ...formData, image_url: '' })} className="btn-secondary">지우기</button>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="preview" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e4e4e7' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <img src="/products/men/tshirts/classic-tshirt/1.jpg" alt="default preview" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px dashed #d4d4d8', opacity: 0.7 }} />
                    )}
                    <span style={{ fontSize: '0.6875rem', color: '#71717a', lineHeight: 1.5 }}>
                      비워두면 기본 이미지 사용. 미디어 라이브러리에서 Supabase `product-media` 업로드본을 고르면 URL을 몰라도 됩니다.
                    </span>
                  </div>
                </details>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">한글 설명</label>
                  <input type="text" value={formData.description_ko} onChange={(e) => setFormData({ ...formData, description_ko: e.target.value })} placeholder="카테고리 설명 (한글)" className="form-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">영문 설명</label>
                  <input type="text" value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} placeholder="Category description (EN)" className="form-input" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', backgroundColor: formData.is_active ? '#f0fdf4' : '#fef2f2', borderRadius: 8, border: `1px solid ${formData.is_active ? '#bbf7d0' : '#fecaca'}` }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.is_active ? '#166534' : '#991b1b' }}>
                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                    <span>{formData.is_active ? '활성 — 쇼핑몰에 노출' : '숨김 — 관리자만 보임'}</span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">취소</button>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)' }}>저장하기</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <MediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={(url) => {
            setFormData(prev => ({ ...prev, image_url: url }));
            setIsMediaPickerOpen(false);
            setShowAdvanced(true);
          }}
        />
      </div>
    </AdminLayout>
  );
}
