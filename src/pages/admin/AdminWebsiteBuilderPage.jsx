import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { MediaPickerModal } from '../../components/common/MediaPickerModal.jsx';
import {
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  FolderTree,
  Tag,
  Film,
  Camera,
  Code,
  X,
  Image as ImageIcon,
} from 'lucide-react';

export function AdminWebsiteBuilderPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const { showToast } = useToast();

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    section_key: '',
    type: 'hero',
    title_ko: '',
    title_en: '',
    subtitle_ko: '',
    subtitle_en: '',
    content: {
      image_url: '',
      button_text_ko: '쇼핑하기',
      button_text_en: 'Shop Now',
      button_link: '/shop',
      filter_type: 'new',
      limit: 4,
      coupon_code: '',
      badge_ko: '',
      badge_en: '',
    },
  });

  const fetchSections = async () => {
    setLoading(true);
    try {
      const [secRes, catRes] = await Promise.all([
        api.get('/admin/builder/sections'),
        api.get('/admin/categories'),
      ]);
      if (secRes.success) setSections(secRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Fetch builder failed:', err);
      showToast('섹션 데이터를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleMove = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(newIndex, 0, moved);

    setSections(newSections);

    try {
      await api.patch('/admin/builder/sections/reorder', {
        sectionIds: newSections.map((s) => s.id),
      });
      showToast('섹션 순서가 저장되었습니다.', 'success');
    } catch (err) {
      showToast('순서 저장 실패', 'error');
      fetchSections();
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/admin/builder/sections/${id}/toggle`);
      showToast(res.message, 'success');
      fetchSections();
    } catch (err) {
      showToast('상태 변경 실패', 'error');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/admin/builder/sections/${id}/duplicate`);
      showToast('섹션이 복제되었습니다.', 'success');
      fetchSections();
    } catch (err) {
      showToast('복제 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 섹션을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/admin/builder/sections/${id}`);
      showToast('섹션이 삭제되었습니다.', 'info');
      fetchSections();
    } catch (err) {
      showToast('삭제 실패', 'error');
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      section_key: `sec_${Date.now().toString().slice(-6)}`,
      type: 'products_grid',
      title_ko: '특별 추천 상품 (Featured Selection)',
      title_en: 'Featured Selection',
      subtitle_ko: '노을이 엄선한 감각적인 컬렉션을 만나보세요.',
      subtitle_en: 'Curated contemporary essentials for everyday elegance',
      content: {
        filter_type: 'new',
        limit: 4,
        view_all_link: '/shop',
        image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
        button_text_ko: '더보기',
        button_text_en: 'Shop Now',
        button_link: '/shop',
        coupon_code: '',
        badge_ko: 'SEASON SPECIAL',
        badge_en: 'SEASON SPECIAL',
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sec) => {
    setIsEditMode(true);
    setEditingId(sec.id);
    setFormData({
      section_key: sec.section_key,
      type: sec.type,
      title_ko: sec.title_ko,
      title_en: sec.title_en,
      subtitle_ko: sec.subtitle_ko || '',
      subtitle_en: sec.subtitle_en || '',
      content: sec.content || {},
    });
    setIsModalOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/admin/builder/sections/${editingId}`, formData);
        showToast('섹션이 수정되었습니다.', 'success');
      } else {
        await api.post('/admin/builder/sections', formData);
        showToast('새 섹션이 생성되었습니다.', 'success');
      }
      setIsModalOpen(false);
      fetchSections();
    } catch (err) {
      showToast(err.message || '저장 실패', 'error');
    }
  };

  const getSectionIcon = (type) => {
    switch (type) {
      case 'hero': return <Sparkles size={16} color="var(--accent-sunset)" />;
      case 'products_grid':
      case 'products_carousel': return <ShoppingBag size={16} color="#2563eb" />;
      case 'categories_grid': return <FolderTree size={16} color="#16a34a" />;
      case 'promo_banner': return <Tag size={16} color="#d97706" />;
      case 'lookbook_story': return <Film size={16} color="#9333ea" />;
      case 'instagram_feed': return <Camera size={16} color="#e1306c" />;
      default: return <Code size={16} color="#71717a" />;
    }
  };

  return (
    <AdminLayout activePage="builder">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>홈페이지 섹션 빌더 (Website Builder)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              코딩 없이 홈페이지의 모든 섹션을 추가, 편집, 순서 변경 및 노출 관리할 수 있습니다.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.875rem' }}
            >
              <ExternalLink size={15} />
              <span>실시간 스토어 미리보기</span>
            </a>

            <button
              onClick={openAddModal}
              className="btn-primary"
              style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 20px', fontSize: '0.875rem' }}
            >
              <Plus size={16} />
              <span>새 섹션 추가</span>
            </button>
          </div>
        </div>

        {/* Section List (Draggable/Movable list) */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e4e4e7', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '16px 24px', backgroundColor: '#fafafa', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>
              홈페이지 배치 순서 (위에서 아래로 노출)
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>
              총 <strong>{sections.length}</strong>개 섹션
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: idx < sections.length - 1 ? '1px solid #f0f0f2' : 'none',
                  backgroundColor: sec.is_active ? '#ffffff' : '#fcfcfc',
                  opacity: sec.is_active ? 1 : 0.6,
                }}
              >
                {/* Reorder Buttons & Index */}
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
                      disabled={idx === sections.length - 1}
                      title="아래로 이동"
                      style={{ padding: '3px', borderRadius: '3px', backgroundColor: '#f4f4f5', color: '#555', opacity: idx === sections.length - 1 ? 0.3 : 1 }}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#a1a1aa', width: '20px' }}>
                    {idx + 1}
                  </span>

                  {/* Icon & Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#f4f4f5', display: 'flex', alignItems: 'center' }}>
                      {getSectionIcon(sec.type)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#18181b' }}>{sec.title_ko}</h4>
                        <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f4f4f5', color: '#71717a', fontFamily: 'monospace' }}>
                          {sec.type}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>
                        {sec.title_en} • key: {sec.section_key}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleToggle(sec.id)}
                    title={sec.is_active ? '숨김 처리' : '노출 활성화'}
                    style={{ padding: '6px 10px', backgroundColor: sec.is_active ? '#dcfce7' : '#f4f4f5', color: sec.is_active ? '#166534' : '#71717a', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {sec.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>{sec.is_active ? '노출중' : '숨김'}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(sec)}
                    style={{ padding: '6px 10px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontSize: '0.75rem', color: '#27272a', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit2 size={13} />
                    <span>편집</span>
                  </button>

                  <button
                    onClick={() => handleDuplicate(sec.id)}
                    title="섹션 복제"
                    style={{ padding: '6px 10px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontSize: '0.75rem', color: '#27272a', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy size={13} />
                    <span>복제</span>
                  </button>

                  <button
                    onClick={() => handleDelete(sec.id)}
                    title="섹션 삭제"
                    style={{ padding: '6px 8px', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#dc2626' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add / Edit Section Modal */}
        {isModalOpen && (
          <div className="backdrop" onClick={() => setIsModalOpen(false)} style={{ zIndex: 100 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '720px',
                maxHeight: '90vh',
                margin: '40px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {isEditMode ? '섹션 설정 편집' : '새 섹션 생성'}
                </h3>
                <button onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSection} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Section Type Selector */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">섹션 유형 (Section Type) *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="hero">히어로 메인 배너 (Hero Campaign)</option>
                    <option value="products_grid">상품 그리드 / 추천 상품 (Products Grid)</option>
                    <option value="categories_grid">카테고리 탐색 그리드 (Categories Grid)</option>
                    <option value="promo_banner">프로모션 / 쿠폰 배너 (Promo Banner)</option>
                    <option value="lookbook_story">에디토리얼 룩북 스토리 (Lookbook Editorial)</option>
                    <option value="instagram_feed">고객 커뮤니티 / 인스타그램 (Community Feed)</option>
                    <option value="value_props">안심 서비스 약속 바 (Value Props)</option>
                    <option value="custom_html">커스텀 텍스트 / HTML 블록</option>
                  </select>
                </div>

                {/* Section Titles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">한글 섹션 제목 *</label>
                    <input
                      type="text"
                      required
                      value={formData.title_ko}
                      onChange={(e) => setFormData({ ...formData, title_ko: e.target.value })}
                      placeholder="예: 2026 S/S 신상품"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">영문 섹션 제목 (English Title) *</label>
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

                {/* Subtitles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">한글 부제목 / 설명</label>
                    <input
                      type="text"
                      value={formData.subtitle_ko}
                      onChange={(e) => setFormData({ ...formData, subtitle_ko: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">영문 부제목 (English Subtitle)</label>
                    <input
                      type="text"
                      value={formData.subtitle_en}
                      onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Type Specific Fields */}
                {['products_grid', 'products_carousel'].includes(formData.type) && (
                  <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px', border: '1px solid #eee', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">상품 필터링 기준</label>
                      <select
                        value={formData.content?.filter_type || 'all'}
                        onChange={(e) => setFormData({
                          ...formData,
                          content: { ...formData.content, filter_type: e.target.value }
                        })}
                        className="form-select"
                      >
                        <option value="new">NEW 신상품 뱃지 상품</option>
                        <option value="best">BEST 베스트셀러 뱃지 상품</option>
                        <option value="featured">FEATURED 추천 상품</option>
                        <option value="all">전체 상품 (최신 등록순)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">노출 상품 개수</label>
                      <input
                        type="number"
                        value={formData.content?.limit || 4}
                        onChange={(e) => setFormData({
                          ...formData,
                          content: { ...formData.content, limit: Number(e.target.value) }
                        })}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

                {['hero', 'promo_banner'].includes(formData.type) && (
                  <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">배경 이미지 URL</label>
                        <button
                          type="button"
                          onClick={() => setIsMediaPickerOpen(true)}
                          style={{ fontSize: '0.75rem', color: 'var(--accent-sunset)', fontWeight: 600 }}
                        >
                          미디어 라이브러리에서 선택
                        </button>
                      </div>
                      <input
                        type="url"
                        value={formData.content?.image_url || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          content: { ...formData.content, image_url: e.target.value }
                        })}
                        className="form-input"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">버튼 텍스트 (한글)</label>
                        <input
                          type="text"
                          value={formData.content?.button_text_ko || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            content: { ...formData.content, button_text_ko: e.target.value }
                          })}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">버튼 링크 URL</label>
                        <input
                          type="text"
                          value={formData.content?.button_link || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            content: { ...formData.content, button_link: e.target.value }
                          })}
                          className="form-input"
                        />
                      </div>
                    </div>

                    {formData.type === 'promo_banner' && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">제공 쿠폰 코드 (선택)</label>
                        <input
                          type="text"
                          value={formData.content?.coupon_code || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            content: { ...formData.content, coupon_code: e.target.value.toUpperCase() }
                          })}
                          placeholder="WELCOME10"
                          className="form-input"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Modal Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    취소
                  </button>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)' }}>
                    {isEditMode ? '수정 내용 적용' : '섹션 생성 완료'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Media Picker Modal */}
        <MediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={(url) => setFormData({ ...formData, content: { ...formData.content, image_url: url } })}
        />
      </div>
    </AdminLayout>
  );
}
