import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Menu, Plus, ArrowUp, ArrowDown, Edit2, Trash2, X, Link as LinkIcon, ChevronRight } from 'lucide-react';

export function AdminMenusPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState([]);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    parent_id: '',
    title_ko: '',
    title_en: '',
    link_type: 'custom',
    link_value: '',
    badge_tag: '',
    sort_order: 1,
    is_active: true,
  });

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const [menuRes, catRes, pageRes] = await Promise.all([
        api.get('/admin/menus'),
        api.get('/admin/categories'),
        api.get('/admin/pages'),
      ]);
      if (menuRes.success) setMenus(menuRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (pageRes.success) setPages(pageRes.data);
    } catch (err) {
      console.error('Fetch menus error:', err);
      showToast('메뉴 데이터를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleMove = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= menus.length) return;

    const newMenus = [...menus];
    const [moved] = newMenus.splice(index, 1);
    newMenus.splice(newIndex, 0, moved);

    setMenus(newMenus);

    try {
      await api.patch('/admin/menus/reorder', {
        menuIds: newMenus.map((m) => m.id),
      });
      showToast('메뉴 순서가 변경되었습니다.', 'success');
    } catch (err) {
      showToast('순서 변경 실패', 'error');
      fetchMenus();
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      parent_id: '',
      title_ko: '',
      title_en: '',
      link_type: 'custom',
      link_value: '/shop',
      badge_tag: '',
      sort_order: menus.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (m) => {
    setIsEditMode(true);
    setEditingId(m.id);
    setFormData({
      parent_id: m.parent_id || '',
      title_ko: m.title_ko,
      title_en: m.title_en,
      link_type: m.link_type || 'custom',
      link_value: m.link_value,
      badge_tag: m.badge_tag || '',
      sort_order: m.sort_order || 1,
      is_active: Boolean(m.is_active),
    });
    setIsModalOpen(true);
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/admin/menus/${editingId}`, formData);
        showToast('메뉴 항목이 수정되었습니다.', 'success');
      } else {
        await api.post('/admin/menus', formData);
        showToast('새 메뉴 항목이 추가되었습니다.', 'success');
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (err) {
      showToast(err.message || '저장 실패', 'error');
    }
  };

  const handleDeleteMenu = async (id) => {
    if (!window.confirm('이 메뉴 항목을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/admin/menus/${id}`);
      showToast('메뉴 항목이 삭제되었습니다.', 'info');
      fetchMenus();
    } catch (err) {
      showToast('삭제 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="menus">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>네비게이션 메뉴 관리 (Navigation Menus)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              웹사이트 상단 헤더 메뉴 및 드롭다운 하위 메뉴를 자유롭게 구성할 수 있습니다.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary"
            style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 20px', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            <span>새 메뉴 추가</span>
          </button>
        </div>

        {/* Menu Items Table */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e4e4e7', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '16px 24px', backgroundColor: '#fafafa', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>
              메뉴 노출 순서 (좌측에서 우측)
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>
              총 <strong>{menus.length}</strong>개 메뉴 항목
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {menus.map((m, idx) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: idx < menus.length - 1 ? '1px solid #f0f0f2' : 'none',
                  backgroundColor: m.parent_id ? '#fafafa' : '#ffffff',
                  paddingLeft: m.parent_id ? '48px' : '24px',
                }}
              >
                {/* Reorder & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      title="위로 이동"
                      style={{ padding: '3px', borderRadius: '3px', backgroundColor: '#f4f4f5', color: '#555', opacity: idx === 0 ? 0.3 : 1 }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === menus.length - 1}
                      title="아래로 이동"
                      style={{ padding: '3px', borderRadius: '3px', backgroundColor: '#f4f4f5', color: '#555', opacity: idx === menus.length - 1 ? 0.3 : 1 }}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#a1a1aa', width: '20px' }}>
                    {idx + 1}
                  </span>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {m.parent_id && <ChevronRight size={14} color="#a1a1aa" />}
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#18181b' }}>{m.title_ko}</h4>
                      <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>({m.title_en})</span>
                      {m.badge_tag && (
                        <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--accent-sunset)', color: '#fff', fontWeight: 700 }}>
                          {m.badge_tag}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px', fontFamily: 'monospace' }}>
                      URL: {m.link_value} • 유형: {m.link_type}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => openEditModal(m)}
                    style={{ padding: '6px 12px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontSize: '0.75rem', color: '#27272a', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit2 size={13} />
                    <span>편집</span>
                  </button>

                  <button
                    onClick={() => handleDeleteMenu(m.id)}
                    style={{ padding: '6px 8px', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#dc2626' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add / Edit Menu Modal */}
        {isModalOpen && (
          <div className="backdrop" onClick={() => setIsModalOpen(false)} style={{ zIndex: 100 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '560px',
                margin: '60px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {isEditMode ? '메뉴 항목 수정' : '새 메뉴 항목 추가'}
                </h3>
                <button onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveMenu} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">한글 메뉴명 *</label>
                    <input
                      type="text"
                      required
                      value={formData.title_ko}
                      onChange={(e) => setFormData({ ...formData, title_ko: e.target.value })}
                      placeholder="예: 신상품"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">영문 메뉴명 *</label>
                    <input
                      type="text"
                      required
                      value={formData.title_en}
                      onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                      placeholder="e.g. New Arrivals"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Quick Link Selector */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">빠른 링크 대상 선택</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({ ...formData, link_value: e.target.value });
                      }
                    }}
                    className="form-select"
                  >
                    <option value="">-- 자주 사용하는 페이지 선택 --</option>
                    <option value="/shop">전체 상품 카탈로그 (/shop)</option>
                    <option value="/shop?filter=new">신상품 모아보기 (/shop?filter=new)</option>
                    <option value="/shop?filter=best">베스트셀러 (/shop?filter=best)</option>
                    <option value="/about">브랜드 스토리 (/about)</option>
                    <optgroup label="카테고리 링크">
                      {categories.map((c) => (
                        <option key={c.id} value={`/shop?category=${c.slug}`}>{c.name_ko} ({c.name_en})</option>
                      ))}
                    </optgroup>
                    <optgroup label="커스텀 페이지">
                      {pages.map((p) => (
                        <option key={p.id} value={`/p/${p.slug}`}>{p.title_ko}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">이동할 URL 경로 *</label>
                  <input
                    type="text"
                    required
                    value={formData.link_value}
                    onChange={(e) => setFormData({ ...formData, link_value: e.target.value })}
                    placeholder="/shop 또는 /p/lookbook"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">뱃지 텍스트 (선택)</label>
                    <input
                      type="text"
                      value={formData.badge_tag}
                      onChange={(e) => setFormData({ ...formData, badge_tag: e.target.value.toUpperCase() })}
                      placeholder="예: NEW, HOT, SALE"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">상위 메뉴 (선택 - 하위 드롭다운 시)</label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">최상위 메뉴 (Top Level)</option>
                      {menus.filter((m) => !m.parent_id && m.id !== editingId).map((m) => (
                        <option key={m.id} value={m.id}>{m.title_ko} ({m.title_en})</option>
                      ))}
                    </select>
                  </div>
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
      </div>
    </AdminLayout>
  );
}
