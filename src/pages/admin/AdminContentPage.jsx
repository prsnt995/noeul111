import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Image as ImageIcon, Plus, Edit2, Trash2, X, Save, Building, Truck, RefreshCw, FileText } from 'lucide-react';

export function AdminContentPage() {
  const [activeTab, setActiveTab] = useState('banners'); // 'banners' | 'policies' | 'business'
  const [banners, setBanners] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Banner Modal
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    type: 'hero',
    title_ko: '',
    title_en: '',
    subtitle_ko: '',
    subtitle_en: '',
    image_url: '',
    link_url: '/shop',
    button_text_ko: '쇼핑하기',
    button_text_en: 'Shop Now',
    sort_order: 1,
    is_active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [banRes, setRes] = await Promise.all([
        api.get('/admin/content/banners'),
        api.get('/admin/content/settings'),
      ]);
      if (banRes.success) setBanners(banRes.data);
      if (setRes.success) setSettings(setRes.data);
    } catch (err) {
      console.error('Fetch content failed:', err);
      showToast('컨텐츠 정보를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddBanner = () => {
    setEditingBannerId(null);
    setBannerForm({
      type: 'hero',
      title_ko: '',
      title_en: '',
      subtitle_ko: '',
      subtitle_en: '',
      image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
      link_url: '/shop',
      button_text_ko: '신규 컬렉션 쇼핑하기',
      button_text_en: 'Shop Now',
      sort_order: banners.length + 1,
      is_active: true,
    });
    setIsBannerModalOpen(true);
  };

  const openEditBanner = (b) => {
    setEditingBannerId(b.id);
    setBannerForm({
      type: b.type,
      title_ko: b.title_ko,
      title_en: b.title_en,
      subtitle_ko: b.subtitle_ko || '',
      subtitle_en: b.subtitle_en || '',
      image_url: b.image_url || '',
      link_url: b.link_url || '',
      button_text_ko: b.button_text_ko || '',
      button_text_en: b.button_text_en || '',
      sort_order: b.sort_order || 1,
      is_active: Boolean(b.is_active),
    });
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      if (editingBannerId) {
        await api.put(`/admin/content/banners/${editingBannerId}`, bannerForm);
        showToast('배너가 수정되었습니다.', 'success');
      } else {
        await api.post('/admin/content/banners', bannerForm);
        showToast('새 배너가 추가되었습니다.', 'success');
      }
      setIsBannerModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || '배너 저장 실패', 'error');
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('배너를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/admin/content/banners/${id}`);
      showToast('배너가 삭제되었습니다.', 'info');
      fetchData();
    } catch (err) {
      showToast('배너 삭제 실패', 'error');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/content/settings', { settings });
      showToast('사이트 설정이 안전하게 저장되었습니다.', 'success');
    } catch (err) {
      showToast('설정 저장 실패', 'error');
    }
  };

  return (
    <AdminLayout activePage="content">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>웹사이트 배너 & 컨텐츠 관리</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              홈페이지 히어로 배너, 프로모션 안내, 브랜드 스토리 및 배송/반품 정책 관리
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid #e4e4e7', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('banners')}
            className={activeTab === 'banners' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 18px', fontSize: '0.875rem' }}
          >
            <ImageIcon size={16} />
            <span>배너 관리 (Hero & Promo)</span>
          </button>

          <button
            onClick={() => setActiveTab('policies')}
            className={activeTab === 'policies' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 18px', fontSize: '0.875rem' }}
          >
            <FileText size={16} />
            <span>브랜드 스토리 & 배송/반품 정책</span>
          </button>

          <button
            onClick={() => setActiveTab('business')}
            className={activeTab === 'business' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 18px', fontSize: '0.875rem' }}
          >
            <Building size={16} />
            <span>사업자 & 고객센터 정보</span>
          </button>
        </div>

        {/* 1. BANNERS TAB */}
        {activeTab === 'banners' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>등록된 배너 목록 ({banners.length})</h3>
              <button
                onClick={openAddBanner}
                className="btn-primary"
                style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 18px', fontSize: '0.8125rem' }}
              >
                <Plus size={15} />
                <span>새 배너 추가</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {banners.map((b) => (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #e4e4e7',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ position: 'relative', height: '180px', backgroundColor: '#222' }}>
                    {b.image_url ? (
                      <img src={b.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: b.is_active ? '#dcfce7' : '#fee2e2',
                        color: b.is_active ? '#166534' : '#991b1b',
                        fontSize: '0.6875rem',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                      }}
                    >
                      {b.is_active ? '노출중' : '숨김'}
                    </span>
                  </div>

                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{b.title_ko}</h4>
                      <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>{b.title_en}</p>
                      {b.subtitle_ko && (
                        <p style={{ fontSize: '0.8125rem', color: '#52525b', marginTop: '6px', lineHeight: 1.4 }}>
                          {b.subtitle_ko}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f0f0f2' }}>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>
                        링크: {b.link_url || '없음'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditBanner(b)}
                          style={{ padding: '6px 10px', backgroundColor: '#f4f4f5', borderRadius: '4px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit2 size={13} />
                          <span>수정</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(b.id)}
                          style={{ padding: '6px 10px', backgroundColor: '#fee2e2', borderRadius: '4px', fontSize: '0.8125rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={13} />
                          <span>삭제</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. POLICIES & BRAND STORY TAB */}
        {activeTab === 'policies' && (
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
            {/* About Story */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', border: '1px solid #e4e4e7' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>
                브랜드 스토리 (Brand Story & Philosophy)
              </h3>

              <div className="form-group">
                <label className="form-label">한글 브랜드 스토리 제목</label>
                <input
                  type="text"
                  value={settings.about_story?.title_ko || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    about_story: { ...settings.about_story, title_ko: e.target.value }
                  })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">한글 브랜드 스토리 본문</label>
                <textarea
                  rows={4}
                  value={settings.about_story?.content_ko || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    about_story: { ...settings.about_story, content_ko: e.target.value }
                  })}
                  className="form-textarea"
                />
              </div>
            </div>

            {/* Shipping Policy */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', border: '1px solid #e4e4e7' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>
                배송 및 교환/반품 정책 설정
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">무료배송 기준 금액 (KRW ₩)</label>
                  <input
                    type="number"
                    value={settings.shipping_policy?.threshold || 70000}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_policy: { ...settings.shipping_policy, threshold: Number(e.target.value) }
                    })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">기본 배송비 (KRW ₩)</label>
                  <input
                    type="number"
                    value={settings.shipping_policy?.fee || 3000}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_policy: { ...settings.shipping_policy, fee: Number(e.target.value) }
                    })}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)', padding: '14px', alignSelf: 'flex-start' }}>
              <Save size={16} />
              <span>설정 저장하기</span>
            </button>
          </form>
        )}

        {/* 3. BUSINESS & CS INFO TAB */}
        {activeTab === 'business' && (
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', border: '1px solid #e4e4e7' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '20px' }}>
                법정 전자상거래 사업자 정보 & 고객센터
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">상호명 (Company Name)</label>
                  <input
                    type="text"
                    value={settings.business_info?.company_name || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, company_name: e.target.value }
                    })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">대표자명 (CEO)</label>
                  <input
                    type="text"
                    value={settings.business_info?.ceo || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, ceo: e.target.value }
                    })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">사업자등록번호</label>
                  <input
                    type="text"
                    value={settings.business_info?.business_number || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, business_number: e.target.value }
                    })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">통신판매업신고번호</label>
                  <input
                    type="text"
                    value={settings.business_info?.ecommerce_number || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, ecommerce_number: e.target.value }
                    })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">고객센터 대표전화</label>
                  <input
                    type="text"
                    value={settings.business_info?.cs_phone || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, cs_phone: e.target.value }
                    })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">고객센터 이메일</label>
                  <input
                    type="email"
                    value={settings.business_info?.cs_email || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, cs_email: e.target.value }
                    })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">무통장 입금 계좌번호 (은행명 및 계좌)</label>
                <input
                  type="text"
                  value={settings.business_info?.bank_account || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    business_info: { ...settings.business_info, bank_account: e.target.value }
                  })}
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-sunset)', padding: '14px', alignSelf: 'flex-start' }}>
              <Save size={16} />
              <span>사업자 정보 저장</span>
            </button>
          </form>
        )}

        {/* Banner Create / Edit Modal */}
        {isBannerModalOpen && (
          <div className="backdrop" onClick={() => setIsBannerModalOpen(false)} style={{ zIndex: 100 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '600px',
                margin: '50px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {editingBannerId ? '배너 수정' : '새 배너 추가'}
                </h3>
                <button onClick={() => setIsBannerModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveBanner} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">배너 구분 (Type)</label>
                  <select
                    value={bannerForm.type}
                    onChange={(e) => setBannerForm({ ...bannerForm, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="hero">메인 히어로 배너 (Hero)</option>
                    <option value="promo">중간 프로모션 배너 (Promo)</option>
                    <option value="announcement">상단 띠배너 (Announcement)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">한글 제목 *</label>
                    <input
                      type="text"
                      required
                      value={bannerForm.title_ko}
                      onChange={(e) => setBannerForm({ ...bannerForm, title_ko: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">영문 제목 *</label>
                    <input
                      type="text"
                      required
                      value={bannerForm.title_en}
                      onChange={(e) => setBannerForm({ ...bannerForm, title_en: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">이미지 URL</label>
                  <input
                    type="url"
                    value={bannerForm.image_url}
                    onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">클릭 이동 URL</label>
                    <input
                      type="text"
                      value={bannerForm.link_url}
                      onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                      placeholder="/shop"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">버튼 텍스트 (한글)</label>
                    <input
                      type="text"
                      value={bannerForm.button_text_ko}
                      onChange={(e) => setBannerForm({ ...bannerForm, button_text_ko: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    checked={bannerForm.is_active}
                    onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                  />
                  <span style={{ fontSize: '0.875rem' }}>쇼핑몰에 즉시 노출 (Active)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
                  <button type="button" onClick={() => setIsBannerModalOpen(false)} className="btn-secondary">
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
