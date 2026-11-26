import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { PageHeader } from '../../components/admin/ui/PageHeader.jsx';
import { ErrorBanner } from '../../components/admin/ui/Empty.jsx';
import { adminApi } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Save, Building, Truck, CreditCard, Layout } from 'lucide-react';

function normalizeAboutStory(value, fallback) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return String(value.ko || value.en || value.text || '').trim();
  }
  if (typeof fallback === 'string') return fallback;
  if (fallback && typeof fallback === 'object') return String(fallback.ko || fallback.en || '').trim();
  return '';
}

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('payment');
  const [settings, setSettings] = useState({
    payment_info: { bank_name: '', account_holder: '', account_number: '', currency: 'KRW', payment_instructions_ko: '' },
    business_info: { company_name: '', ceo: '', business_number: '', ecommerce_number: '', address: '', cs_phone: '', cs_email: '' },
    shipping_policy: { threshold: 0, fee: 0, socks_fee: 3000, socks_free_pairs: 3 },
    header_config: { announcement_enabled: false, announcement_ko: '', announcement_bg: '#121213', announcement_color: '#ffffff' },
    about_story: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [initialSettings, setInitialSettings] = useState(null);
  const { showToast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const res = await adminApi.get('/admin/content/settings');
      if (res.success && res.data) {
        setSettings((prev) => {
          const next = {
            ...prev,
            ...res.data,
            payment_info: { ...prev.payment_info, ...(res.data.payment_info || {}) },
            business_info: { ...prev.business_info, ...(res.data.business_info || {}) },
            shipping_policy: { ...prev.shipping_policy, ...(res.data.shipping_policy || {}) },
            header_config: { ...prev.header_config, ...(res.data.header_config || {}) },
            about_story: normalizeAboutStory(res.data.about_story, prev.about_story),
          };
          setInitialSettings(JSON.parse(JSON.stringify(next)));
          return next;
        });
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
      setErrorMsg(err?.message || '설정을 불러오지 못했습니다.');
      showToast('설정을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const dirty = initialSettings ? JSON.stringify(settings) !== JSON.stringify(initialSettings) : false;

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    // Validate shipping policy.
    const sp = settings.shipping_policy || {};
    for (const k of ['threshold', 'fee', 'socks_fee', 'socks_free_pairs']) {
      const v = Number(sp[k]);
      if (!Number.isFinite(v) || v < 0) {
        showToast(`배송 정책 값이 올바르지 않습니다: ${k}`, 'error');
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        ...settings,
        payment_info: { ...settings.payment_info },
        header_config: { ...settings.header_config },
      };
      await adminApi.put('/admin/content/settings', { settings: payload });
      setInitialSettings(JSON.parse(JSON.stringify(settings)));
      showToast('쇼핑몰 설정이 성공적으로 저장되었습니다.', 'success');
    } catch (err) {
      showToast(err?.message || err?.code || '설정 저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout activePage="settings">
        <div style={{ display: 'grid', gap: 10, maxWidth: 840 }}>
          <div className="adm-skel" style={{ height: 28, width: 280 }} />
          {[0, 1, 2, 3].map((i) => (<div key={i} className="adm-skel" style={{ height: 56 }} />))}
          <p style={{ textAlign: 'center', color: '#71717a', fontSize: '0.875rem' }}>설정 로딩 중… Loading settings…</p>
        </div>
      </AdminLayout>
    );
  }

  const tabs = [
    { id: 'payment', ko: '무통장 입금 계좌', icon: CreditCard },
    { id: 'business', ko: '사업자 & 고객센터 연락처', icon: Building },
    { id: 'shipping', ko: '배송비 규정', icon: Truck },
    { id: 'general', ko: '헤더 띠배너 공지', icon: Layout },
  ];

  return (
    <AdminLayout activePage="settings">
      <PageHeader
        ko="쇼핑몰 환경 & 결제 계좌 설정"
        desc="공식 입금 계좌, 사업자/고객센터 연락처, 배송 정책 및 공지 띠배너를 관리합니다."
      />

      <ErrorBanner message={errorMsg ? `설정 로드 실패: ${errorMsg}` : ''} onRetry={fetchSettings} />

      {/* Tab Navigation */}
      <div className="adm-card adm-filter-bar" role="tablist" aria-label="설정 메뉴">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(t.id)}
              className={`adm-btn${active ? ' adm-btn-primary' : ''}`}
            >
              <Icon size={16} aria-hidden />
              <span>{t.ko}</span>
            </button>
          );
        })}
      </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px' }}>
          {/* 1. Bank Transfer & Payment Tab */}
          {activeTab === 'payment' && (
            <div className="adm-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ borderBottom: '1px solid #f0f0f2', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#18181b' }}>
                  공식 무통장 입금 계좌 설정
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '2px' }}>
                  결제 페이지 및 주문 완료 페이지에 고객에게 안내되는 공식 계좌 정보입니다.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">은행명 *</label>
                  <input
                    type="text"
                    required
                    value={settings.payment_info?.bank_name || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment_info: { ...settings.payment_info, bank_name: e.target.value }
                    })}
                    placeholder="우리은행"
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">예금주 *</label>
                  <input
                    type="text"
                    required
                    value={settings.payment_info?.account_holder || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment_info: { ...settings.payment_info, account_holder: e.target.value }
                    })}
                    placeholder="박기성"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">계좌번호 *</label>
                  <input
                    type="text"
                    required
                    value={settings.payment_info?.account_number || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment_info: { ...settings.payment_info, account_number: e.target.value }
                    })}
                    placeholder="1002340390276"
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">화폐 단위</label>
                  <input
                    type="text"
                    value={settings.payment_info?.currency || 'KRW (원)'}
                    readOnly
                    className="form-input"
                    style={{ backgroundColor: '#f4f4f5' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">입금 안내 문구</label>
                <textarea
                  rows={3}
                  value={settings.payment_info?.payment_instructions_ko || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    payment_info: { ...settings.payment_info, payment_instructions_ko: e.target.value }
                  })}
                  className="form-textarea"
                />
              </div>
            </div>
          )}

          {/* 2. Business & Legal Contact Tab */}
          {activeTab === 'business' && (
            <div className="adm-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ borderBottom: '1px solid #f0f0f2', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#18181b' }}>
                  사업자 정보 및 고객센터 연락처
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '2px' }}>
                  웹사이트 하단 푸터 및 고객센터 페이지에 표기되는 공식 정보입니다.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">법인/상호명 *</label>
                  <input
                    type="text"
                    required
                    value={settings.business_info?.company_name || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, company_name: e.target.value }
                    })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">대표자명 *</label>
                  <input
                    type="text"
                    required
                    value={settings.business_info?.ceo || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, ceo: e.target.value }
                    })}
                    placeholder="박기성"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">공식 비즈니스 / 고객센터 이메일 *</label>
                  <input
                    type="email"
                    required
                    value={settings.business_info?.cs_email || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, cs_email: e.target.value }
                    })}
                    placeholder="noeulenterprises@gmail.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">고객센터 대표전화 / 연락처 *</label>
                  <input
                    type="text"
                    required
                    value={settings.business_info?.cs_phone || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, cs_phone: e.target.value }
                    })}
                    placeholder="010-8361-5305"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">사업장 소재지 주소 *</label>
                <input
                  type="text"
                  required
                  value={settings.business_info?.address || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    business_info: { ...settings.business_info, address: e.target.value }
                  })}
                  placeholder="경기도 파주시 송학2길 62-3, 1층(야당동)"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
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

                <div className="form-group" style={{ marginBottom: 0 }}>
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
            </div>
          )}

          {/* 3. Shipping Tab */}
          {activeTab === 'shipping' && (
            <div className="adm-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ borderBottom: '1px solid #f0f0f2', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#18181b' }}>
                  배송비 및 무료배송 기준 정책
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">전국 무료배송 기준 금액 (원) *</label>
                  <input
                    type="number"
                    value={settings.shipping_policy?.threshold ?? 0}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_policy: { ...settings.shipping_policy, threshold: Number(e.target.value) }
                    })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">기본 배송비 (원) *</label>
                  <input
                    type="number"
                    value={settings.shipping_policy?.fee ?? 0}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_policy: { ...settings.shipping_policy, fee: Number(e.target.value) }
                    })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">양말 배송비 (1~2kelas, 원)</label>
                  <input
                    type="number"
                    value={settings.shipping_policy?.socks_fee ?? 3000}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_policy: { ...settings.shipping_policy, socks_fee: Number(e.target.value) }
                    })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">양말 무료배송 기준 (kelas)</label>
                  <input
                    type="number"
                    value={settings.shipping_policy?.socks_free_pairs ?? 3}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_policy: { ...settings.shipping_policy, socks_free_pairs: Number(e.target.value) }
                    })}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Header & Announcements Tab */}
          {activeTab === 'general' && (
            <div className="adm-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#18181b' }}>상단 헤더 & 공지 띠배너 제어</h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
                <input
                  type="checkbox"
                  checked={settings.header_config?.announcement_enabled !== false}
                  onChange={(e) => setSettings({
                    ...settings,
                    header_config: { ...settings.header_config, announcement_enabled: e.target.checked }
                  })}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>상단 띠배너 공지사항 노출 활성화</span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">띠배너 공지 문구</label>
                <input
                  type="text"
                  value={settings.header_config?.announcement_ko || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    header_config: { ...settings.header_config, announcement_ko: e.target.value }
                  })}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">About 스토리 문구 (선택)</label>
                <textarea
                  rows={4}
                  value={settings.about_story || ''}
                  onChange={(e) => setSettings({ ...settings, about_story: e.target.value })}
                  className="form-textarea"
                />
              </div>
            </div>
          )}
          <button
            type="submit"
            className="adm-btn adm-btn-primary"
            disabled={saving}
            style={{
              padding: '14px 28px',
              alignSelf: 'flex-start',
              fontSize: '0.9375rem',
              fontWeight: 700,
              opacity: saving ? 0.6 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            <Save size={16} aria-hidden />
            <span>{saving ? '저장 중…' : '설정 저장하기'}</span>
          </button>
        </form>
    </AdminLayout>
  );
}
