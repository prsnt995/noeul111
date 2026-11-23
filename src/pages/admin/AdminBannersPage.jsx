import React, { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  PageHeader,
  ErrorBanner,
  Empty,
  ConfirmModal,
  StatusPill,
  normalizeListResponse,
  buildListParams,
} from '../../components/admin/ui/index.js';
import { Pagination } from '../../components/admin/ui/Pagination.jsx';
import { adminApi } from '../../utils/api.js';
import { safeHttpUrl } from '../../utils/imageHelper.js';
import { useToast } from '../../context/ToastContext.jsx';
import { MediaPickerModal } from '../../components/common/MediaPickerModal.jsx';
import { Plus, Edit2, Trash2, X, Eye, Monitor, Smartphone } from 'lucide-react';

const PAGE_SIZE = 12;

// Where the storefront renders a banner. `home_between_categories` uses the
// anchor fields below to pick the exact seam.
const PLACEMENTS = [
  { value: 'home_hero', label: '홈 히어로', desc: '홈 최상단 대형 배너' },
  { value: 'home_after_best', label: '베스트 다음', desc: 'BEST 레일 바로 아래 (레거시)' },
  { value: 'home_after_browse', label: '탐색 다음', desc: '카테고리/최근 상품 다음 프로모션' },
  { value: 'home_between_categories', label: '카테고리 사이', desc: '지정 카테고리 앞/뒤' },
  { value: 'home_before_footer', label: '에디토리얼 전', desc: '신상품 다음, 에디토리얼 앞' },
  { value: 'nav_mega_men', label: 'MEN 메가 메뉴', desc: '데스크탑 MEN 패널 이미지' },
  { value: 'nav_mega_women', label: 'WOMEN 메가 메뉴', desc: '데스크탑 WOMEN 패널 이미지' },
  { value: 'shop_top', label: '쇼프 상단', desc: '쇼프 페이지 상단' },
];
const PLACEMENT_MAP = Object.fromEntries(PLACEMENTS.map((p) => [p.value, p]));

function inferPlacement(banner) {
  if (banner?.placement) return banner.placement;
  if (banner?.type === 'hero') return 'home_hero';
  if (banner?.type === 'promo') return 'home_between_categories';
  return '';
}

const EMPTY_FORM = {
  type: 'hero',
  placement: 'home_hero',
  anchor_category: '',
  anchor_position: 'after',
  title_ko: '',
  title_en: '',
  subtitle_ko: '',
  subtitle_en: '',
  image_url: '',
  mobile_image_url: '',
  link_url: '/shop',
  button_text_ko: '쇼핑하기',
  button_text_en: 'Shop Now',
  alt_ko: '',
  alt_en: '',
  theme: 'auto',
  cta_style: 'ghost',
  overlay_opacity: 35,
  open_in_new_tab: false,
  header_overlay: false,
  start_date: '',
  end_date: '',
  is_active: true,
  sort_order: 1,
};

function formFromBanner(b, fallbackOrder = 1) {
  return {
    ...EMPTY_FORM,
    type: b.type || 'hero',
    placement: inferPlacement(b) || 'home_hero',
    anchor_category: b.anchor_category || '',
    anchor_position: b.anchor_position === 'before' ? 'before' : 'after',
    title_ko: b.title_ko || '',
    title_en: b.title_en || '',
    subtitle_ko: b.subtitle_ko || '',
    subtitle_en: b.subtitle_en || '',
    image_url: b.image_url || '',
    mobile_image_url: b.mobile_image_url || '',
    link_url: b.link_url || '',
    button_text_ko: b.button_text_ko || '',
    button_text_en: b.button_text_en || '',
    alt_ko: b.alt_ko || '',
    alt_en: b.alt_en || '',
    theme: ['light', 'dark', 'auto'].includes(b.theme) ? b.theme : 'auto',
    cta_style: ['ghost', 'solid', 'underline'].includes(b.cta_style) ? b.cta_style : 'ghost',
    overlay_opacity: Number.isFinite(Number(b.overlay_opacity)) ? Number(b.overlay_opacity) : 35,
    open_in_new_tab: Boolean(b.open_in_new_tab),
    header_overlay: Boolean(b.header_overlay),
    start_date: b.start_date || '',
    end_date: b.end_date || '',
    is_active: b.is_active === undefined ? true : Boolean(b.is_active),
    sort_order: Number(b.sort_order) || fallbackOrder,
  };
}

export function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [categories, setCategories] = useState([]);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeImageField, setActiveImageField] = useState('image_url');

  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const qs = buildListParams({ page, pageSize: PAGE_SIZE });
      const res = await adminApi.get(`/admin/content/banners${qs}`);
      const { data, total: t } = normalizeListResponse(res, page, PAGE_SIZE);
      setBanners(data);
      setTotal(t);
    } catch (err) {
      console.error('Fetch banners failed:', err);
      setErrorMsg(err?.message || '배너 목록을 불러오지 못했습니다.');
      showToast('배너 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    adminApi.get('/admin/categories').then((res) => {
      if (!cancelled && res?.success && Array.isArray(res.data)) setCategories(res.data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const grouped = useMemo(() => {
    const order = [...PLACEMENTS.map((p) => p.value), 'unplaced'];
    const map = new Map();
    for (const b of banners) {
      const key = inferPlacement(b) || 'unplaced';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    }
    return order
      .filter((k) => map.has(k))
      .map((k) => ({ key: k, meta: PLACEMENT_MAP[k], items: map.get(k) }));
  }, [banners]);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ ...EMPTY_FORM, image_url: '/products/men/tshirts/classic-tshirt/1.svg', sort_order: banners.length + 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (b) => {
    setIsEditMode(true);
    setEditingId(b.id);
    setFormData(formFromBanner(b, banners.length + 1));
    setIsModalOpen(true);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      const isBetween = formData.placement === 'home_between_categories';
      const payload = {
        ...formData,
        title_en: formData.title_en || formData.title_ko,
        subtitle_en: formData.subtitle_en || formData.subtitle_ko || '',
        button_text_en: formData.button_text_en || formData.button_text_ko || '',
        anchor_category: isBetween ? formData.anchor_category : '',
        anchor_position: isBetween ? formData.anchor_position : 'after',
        overlay_opacity: Math.max(0, Math.min(100, Number(formData.overlay_opacity) || 0)),
      };
      if (isEditMode) {
        await adminApi.put(`/admin/content/banners/${editingId}`, payload);
        showToast('배너가 수정되었습니다.', 'success');
      } else {
        await adminApi.post('/admin/content/banners', payload);
        showToast('새 배너가 추가되었습니다.', 'success');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      showToast(err.message || '배너 저장 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.delete(`/admin/content/banners/${id}`);
      showToast('배너가 삭제되었습니다.', 'info');
      setDeleteId(null);
      fetchBanners();
    } catch (err) {
      showToast(err?.message || '삭제 실패', 'error');
    }
  };

  const renderCard = (b) => {
    const image = safeHttpUrl(b.image_url);
    const placement = PLACEMENT_MAP[inferPlacement(b)];
    return (
      <div key={b.id} className="adm-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'relative', height: '180px', backgroundColor: '#121213' }}>
          {image ? (
            <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
              텍스트 전용 배너
            </div>
          )}
          <span
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              backgroundColor: 'rgba(0,0,0,0.75)',
              color: '#fff',
              fontSize: '0.6875rem',
              padding: '3px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {b.type}
          </span>
          <span style={{ position: 'absolute', top: '12px', right: '12px' }}>
            <StatusPill status={b.is_active ? 'delivered' : 'neutral'} label={b.is_active ? '노출중 Live' : '숨김 Hidden'} />
          </span>
          <span
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '12px',
              backgroundColor: 'rgba(250,247,241,0.92)',
              color: '#171614',
              fontSize: '0.6875rem',
              padding: '3px 8px',
              borderRadius: '999px',
              fontWeight: 600,
            }}
          >
            {placement?.label || '배치 미지정'}
            {inferPlacement(b) === 'home_between_categories' && b.anchor_category
              ? ` · ${b.anchor_category} ${b.anchor_position === 'before' ? '앞' : '뒤'}`
              : ''}
          </span>
        </div>

        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>{b.title_ko}</h4>
            <p style={{ fontSize: '0.8125rem', color: '#71717a', margin: '2px 0 0' }}>{b.title_en}</p>
            {b.subtitle_ko ? (
              <p style={{ fontSize: '0.8125rem', color: '#52525b', marginTop: '6px', lineHeight: 1.4 }}>{b.subtitle_ko}</p>
            ) : null}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f0f0f2' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', maxWidth: '42%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              링크: {b.link_url || '없음'}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setPreviewBanner(b)}
                className="adm-btn"
                style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
              >
                <Eye size={13} aria-hidden />
                <span>미리보기</span>
              </button>
              <button
                type="button"
                onClick={() => openEditModal(b)}
                className="adm-btn"
                style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
              >
                <Edit2 size={13} aria-hidden />
                <span>수정</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(b.id)}
                className="adm-btn"
                style={{ padding: '6px 10px', fontSize: '0.8125rem', color: '#dc2626', borderColor: '#fca5a5' }}
              >
                <Trash2 size={13} aria-hidden />
                <span>삭제</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isBetween = formData.placement === 'home_between_categories';
  const previewDesktop = safeHttpUrl(previewBanner?.image_url);
  const previewMobile = safeHttpUrl(previewBanner?.mobile_image_url) || previewDesktop;

  return (
    <AdminLayout activePage="banners">
      <PageHeader
        ko="배너 매니저"
        en="Banner Manager"
        desc="홈 히어로, 카테고리 사이 프로모션, 메가 메뉴 이미지의 노출 위치와 디자인을 관리합니다."
        actions={(
          <button type="button" className="adm-btn adm-btn-primary" onClick={openAddModal}>
            <Plus size={16} aria-hidden />
            <span>새 배너 등록 New banner</span>
          </button>
        )}
      />

      <ErrorBanner message={errorMsg ? `배너 로드 실패: ${errorMsg}` : ''} onRetry={fetchBanners} />

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="adm-card" style={{ padding: 16, display: 'grid', gap: 10 }}>
              <div className="adm-skel" style={{ height: 140 }} />
              <div className="adm-skel" style={{ height: 14 }} />
              <div className="adm-skel" style={{ height: 10, width: '60%' }} />
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="adm-card">
          <Empty
            title="등록된 배너가 없습니다 No banners yet"
            desc="새 배너를 등록해 쇼핑몰 전면에 노출하세요."
            action={(
              <button type="button" className="adm-btn adm-btn-primary" onClick={openAddModal}>
                <Plus size={14} aria-hidden /> 새 배너 등록
              </button>
            )}
          />
        </div>
      ) : (
        <div>
          {grouped.map((group) => (
            <section key={group.key} style={{ marginBottom: 30 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '0 0 12px', paddingBottom: 8, borderBottom: '1px solid #ececef' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{group.meta?.label || '배치 미지정'}</h3>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>{group.meta?.desc || '노출 위치를 지정하지 않은 배너'}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#aaa' }}>{group.items.length}개</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {group.items.map(renderCard)}
              </div>
            </section>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={(p) => { setPage(p); }} />
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="배너 삭제"
        desc="이 배너를 삭제하시겠습니까? 쇼핑몰에서 즉시 제거됩니다."
        confirmLabel="삭제"
        onConfirm={() => handleDelete(deleteId)}
        onClose={() => setDeleteId(null)}
      />

      {/* Editor */}
      {isModalOpen && (
        <>
          <div className="adm-backdrop" onClick={() => setIsModalOpen(false)} />
          <div className="adm-modal" role="dialog" aria-modal="true" aria-label={isEditMode ? '배너 정보 수정' : '새 배너 등록'} style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h2>{isEditMode ? '배너 정보 수정' : '새 배너 등록'}</h2>
              <button type="button" className="adm-icon-btn" onClick={() => setIsModalOpen(false)} aria-label="닫기">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">배너 구분</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="hero">메인 히어로 배너</option>
                    <option value="promo">프로모션 배너</option>
                    <option value="announcement">상단 띠배너</option>
                    <option value="popup">팝업 배너</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">노출 위치 *</label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                    className="form-select"
                  >
                    {PLACEMENTS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isBetween ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', padding: '14px', border: '1px solid #ececef', background: '#fafafa' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">기준 카테고리</label>
                    <select
                      value={formData.anchor_category}
                      onChange={(e) => setFormData({ ...formData, anchor_category: e.target.value })}
                      className="form-select"
                    >
                      <option value="">선택 안 함 (카테고리 블록 뒤)</option>
                      {categories.map((c) => (
                        <option key={c.slug || c.id} value={c.slug}>{c.name_ko || c.slug}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">배치</label>
                    <select
                      value={formData.anchor_position}
                      onChange={(e) => setFormData({ ...formData, anchor_position: e.target.value })}
                      className="form-select"
                    >
                      <option value="after">카테고리 뒤</option>
                      <option value="before">카테고리 앞</option>
                    </select>
                  </div>
                </div>
              ) : null}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">배너 제목 *</label>
                <input
                  type="text"
                  required
                  value={formData.title_ko}
                  onChange={(e) => setFormData({ ...formData, title_ko: e.target.value, title_en: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">부제목 (선택)</label>
                <input
                  type="text"
                  value={formData.subtitle_ko}
                  onChange={(e) => setFormData({ ...formData, subtitle_ko: e.target.value, subtitle_en: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">데스크탑 이미지 URL</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveImageField('image_url');
                      setIsMediaPickerOpen(true);
                    }}
                    style={{ fontSize: '0.75rem', color: 'var(--accent-sunset)', fontWeight: 600 }}
                  >
                    미디어에서 선택
                  </button>
                </div>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">모바일 전용 이미지 URL (선택)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveImageField('mobile_image_url');
                      setIsMediaPickerOpen(true);
                    }}
                    style={{ fontSize: '0.75rem', color: 'var(--accent-sunset)', fontWeight: 600 }}
                  >
                    미디어에서 선택
                  </button>
                </div>
                <input
                  type="url"
                  value={formData.mobile_image_url}
                  onChange={(e) => setFormData({ ...formData, mobile_image_url: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">대체 텍스트 (KO)</label>
                  <input
                    type="text"
                    value={formData.alt_ko}
                    onChange={(e) => setFormData({ ...formData, alt_ko: e.target.value })}
                    placeholder="이미지 설명"
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">대체 텍스트 (EN)</label>
                  <input
                    type="text"
                    value={formData.alt_en}
                    onChange={(e) => setFormData({ ...formData, alt_en: e.target.value })}
                    placeholder="Image description"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">클릭 이동 링크 URL</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="/shop"
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">버튼 텍스트</label>
                  <input
                    type="text"
                    value={formData.button_text_ko}
                    onChange={(e) => setFormData({ ...formData, button_text_ko: e.target.value, button_text_en: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ padding: '14px', border: '1px solid #ececef', background: '#fafafa', display: 'grid', gap: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>디자인 / 접근성</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">테마</label>
                    <select
                      value={formData.theme}
                      onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                      className="form-select"
                    >
                      <option value="auto">자동 (이미지에 맞춤)</option>
                      <option value="dark">다크 오버레이</option>
                      <option value="light">라이트 오버레이</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">CTA 스타일</label>
                    <select
                      value={formData.cta_style}
                      onChange={(e) => setFormData({ ...formData, cta_style: e.target.value })}
                      className="form-select"
                    >
                      <option value="ghost">고스트 버튼</option>
                      <option value="solid">솔리드 버튼</option>
                      <option value="underline">밑줄 링크</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">오버레이 농도 — {formData.overlay_opacity}%</label>
                  <input
                    type="range"
                    min="0"
                    max="85"
                    step="5"
                    value={formData.overlay_opacity}
                    onChange={(e) => setFormData({ ...formData, overlay_opacity: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.open_in_new_tab}
                    onChange={(e) => setFormData({ ...formData, open_in_new_tab: e.target.checked })}
                  />
                  링크를 새 탭에서 열기
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.header_overlay}
                    onChange={(e) => setFormData({ ...formData, header_overlay: e.target.checked })}
                  />
                  히어로 위에 투명 헤더 사용 (예약)
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">노출 순서</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">시작일</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">종료일</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span style={{ fontSize: '0.875rem' }}>쇼핑몰에 즉시 노출 활성화 (Active)</span>
              </div>

              <div className="adm-modal-actions">
                <button type="button" className="adm-btn" onClick={() => setIsModalOpen(false)}>
                  취소 Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  저장하기 Save
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Preview */}
      {previewBanner ? (
        <>
          <div className="adm-backdrop" onClick={() => setPreviewBanner(null)} />
          <div className="adm-modal" role="dialog" aria-modal="true" aria-label="배너 미리보기" style={{ maxWidth: 1020 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0 }}>배너 미리보기</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#71717a' }}>
                  {PLACEMENT_MAP[inferPlacement(previewBanner)]?.label || '배치 미지정'}
                  {inferPlacement(previewBanner) === 'home_between_categories' && previewBanner.anchor_category
                    ? ` · ${previewBanner.anchor_category} ${previewBanner.anchor_position === 'before' ? '앞' : '뒤'}`
                    : ''}
                </p>
              </div>
              <button type="button" className="adm-icon-btn" onClick={() => setPreviewBanner(null)} aria-label="닫기">
                <X size={16} />
              </button>
            </div>

            <div className="bn-preview-grid">
              <div className="bn-preview-device">
                <span className="bn-preview-label"><Monitor size={13} aria-hidden /> Desktop</span>
                <div className={`bn-preview-frame bn-preview-frame--desktop${previewBanner.theme === 'light' ? ' is-light' : ''}`}>
                  {previewDesktop ? <img src={previewDesktop} alt="" /> : null}
                  <div className="bn-preview-copy">
                    <span>{previewBanner.subtitle_ko || 'COLLECTION'}</span>
                    <strong>{previewBanner.title_ko || '배너 제목'}</strong>
                    {previewBanner.button_text_ko ? <span className="bn-preview-cta">{previewBanner.button_text_ko}</span> : null}
                  </div>
                </div>
              </div>
              <div className="bn-preview-device">
                <span className="bn-preview-label"><Smartphone size={13} aria-hidden /> Mobile</span>
                <div className={`bn-preview-frame bn-preview-frame--mobile${previewBanner.theme === 'light' ? ' is-light' : ''}`}>
                  {previewMobile ? <img src={previewMobile} alt="" /> : null}
                  <div className="bn-preview-copy">
                    <span>{previewBanner.subtitle_ko || 'COLLECTION'}</span>
                    <strong>{previewBanner.title_ko || '배너 제목'}</strong>
                    {previewBanner.button_text_ko ? <span className="bn-preview-cta">{previewBanner.button_text_ko}</span> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="adm-modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="adm-btn" onClick={() => setPreviewBanner(null)}>닫기</button>
              <button
                type="button"
                className="adm-btn adm-btn-primary"
                onClick={() => {
                  const b = previewBanner;
                  setPreviewBanner(null);
                  openEditModal(b);
                }}
              >
                수정하기
              </button>
            </div>
          </div>
        </>
      ) : null}

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => setFormData({ ...formData, [activeImageField]: url })}
      />

      <style>{`
        .bn-preview-grid { display: grid; grid-template-columns: 1.6fr 0.9fr; gap: 20px; }
        @media (max-width: 720px) { .bn-preview-grid { grid-template-columns: 1fr; } }
        .bn-preview-device { display: flex; flex-direction: column; gap: 8px; }
        .bn-preview-label { display: inline-flex; align-items: center; gap: 6px; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #888; }
        .bn-preview-frame { position: relative; overflow: hidden; background: #171614; color: #fff; }
        .bn-preview-frame--desktop { aspect-ratio: 16 / 7; }
        .bn-preview-frame--mobile { aspect-ratio: 9 / 16; max-width: 240px; margin: 0 auto; width: 100%; }
        .bn-preview-frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .bn-preview-frame::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(23,22,20,.72), rgba(23,22,20,.18)); }
        .bn-preview-frame.is-light::after { background: linear-gradient(90deg, rgba(250,247,241,.82), rgba(250,247,241,.12)); }
        .bn-preview-frame.is-light { color: #171614; }
        .bn-preview-copy { position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px; padding: 20px; }
        .bn-preview-copy > span:first-child { font-size: 9px; letter-spacing: .18em; text-transform: uppercase; color: #C9B08B; }
        .bn-preview-copy strong { font-family: var(--font-serif, Georgia, serif); font-size: clamp(18px, 2.4vw, 30px); font-weight: 600; line-height: 1.1; }
        .bn-preview-cta { display: inline-flex; width: max-content; margin-top: 6px; padding: 7px 14px; border: 1px solid currentColor; font-size: 9px; letter-spacing: .16em; text-transform: uppercase; }
      `}</style>
    </AdminLayout>
  );
}

export default AdminBannersPage;
