import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { PageHeader } from '../../components/admin/ui/PageHeader.jsx';
import { ErrorBanner } from '../../components/admin/ui/Empty.jsx';
import { adminApi } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Save, Building, Truck, CreditCard, Layout } from 'lucide-react';

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('payment');
  const [settings, setSettings] = useState({
    payment_info: {
      bank_name: '우리은행 (Woori Bank)',
      account_holder: '박기성',
      account_number: '1002340390276',
      currency: 'KRW',
      payment_instructions_ko: '주문 접수 후 위 계좌로 주문 금액을 정확히 입금하신 후, 결제 영수증(이체 확인증 또는 모바일 뱅킹 스크린샷)을 업로드해주세요. 관리자 입금 확인 후 즉시 배송이 준비됩니다.',
      payment_instructions_en: 'Please transfer the exact order amount to the bank account above, then upload your transfer screenshot / receipt. Once verified by our team, your order will be prepared for delivery.'
    },
    business_info: {
      company_name: '주식회사 페리어스엔지',
      ceo: '박기성',
      business_number: '610-88-00182',
      ecommerce_number: '[수정 가능 / 확인 필요]',
      address: '경기도 파주시 송학2길 62-3, 1층(야당동)',
      cs_phone: '010-8361-5305',
      cs_email: 'noeulenterprises@gmail.com',
      bank_account: '우리은행 1002340390276 박기성'
    },
    shipping_policy: {
      threshold: 0,
      fee: 0
    },
    header_config: {
      announcement_enabled: true,
      announcement_ko: '2026 S/S 신규 가입 시 10% 웰컴 쿠폰 & 전 상품 무료배송',
      announcement_en: 'Spring 2026: Enjoy 10% off your first order & free shipping on all orders',
      announcement_bg: '#121213',
      announcement_color: '#ffffff'
    }
  });

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const { showToast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      setErrorMsg('');
      const res = await adminApi.get('/admin/content/settings');
      if (res.success && res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
          payment_info: { ...prev.payment_info, ...(res.data.payment_info || {}) },
          business_info: { ...prev.business_info, ...(res.data.business_info || {}) },
          shipping_policy: { ...prev.shipping_policy, ...(res.data.shipping_policy || {}) },
          header_config: { ...prev.header_config, ...(res.data.header_config || {}) },
        }));
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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await adminApi.put('/admin/content/settings', { settings });
      showToast('쇼핑몰 설정이 성공적으로 저장되었습니다.', 'success');
    } catch (err) {
      showToast('설정 저장 실패', 'error');
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
    { id: 'payment', ko: '무통장 입금 계좌', en: 'Bank Transfer', icon: CreditCard },
    { id: 'business', ko: '사업자 & 고객센터 연락처', en: 'Business', icon: Building },
    { id: 'shipping', ko: '배송비 규정', en: 'Shipping', icon: Truck },
    { id: 'general', ko: '헤더 띠배너 공지', en: 'Announcement', icon: Layout },
  ];

  return (
    <AdminLayout activePage="settings">
      <PageHeader
        ko="쇼핑몰 환경 & 결제 계좌 설정"
        en="Store Settings"
        desc="공식 입금 계좌, 사업자/고객센터 연락처, 배송 정책 및 공지 띠배너를 관리합니다."
      />

      <ErrorBanner message={errorMsg ? `설정 로드 실패: ${errorMsg}` : ''} onRetry={fetchSettings} />

      {/* Tab Navigation */}
      <div className="adm-card adm-filter-bar" role="tablist" aria-label="Settings sections">
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
              <span>{t.ko} ({t.en})</span>
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
                  공식 무통장 입금 계좌 설정 (Official Bank Account)
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '2px' }}>
                  결제 페이지 및 주문 완료 페이지에 고객에게 안내되는 공식 계좌 정보입니다.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">은행명 (Bank Name) *</label>
                  <input
                    type="text"
                    required
                    value={settings.payment_info?.bank_name || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment_info: { ...settings.payment_info, bank_name: e.target.value }
                    })}
                    placeholder="우리은행 (Woori Bank)"
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">예금주 (Account Holder) *</label>
                  <input
                    type="text"
                    required
                    value={settings.payment_info?.account_holder || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment_info: { ...settings.payment_info, account_holder: e.target.value }
                    })}
                    placeholder="박기삼"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">계좌번호 (Account Number) *</label>
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
                  <label className="form-label">화폐 단위 (Currency)</label>
                  <input
                    type="text"
                    value={settings.payment_info?.currency || 'KRW (₩)'}
                    readOnly
                    className="form-input"
                    style={{ backgroundColor: '#f4f4f5' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">입금 안내 문구 (한글)</label>
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">입금 안내 문구 (영문 - English Instructions)</label>
                <textarea
                  rows={2}
                  value={settings.payment_info?.payment_instructions_en || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    payment_info: { ...settings.payment_info, payment_instructions_en: e.target.value }
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
                  사업자 정보 및 고객센터 연락처 (Business Information)
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '2px' }}>
                  웹사이트 하단 푸터 및 고객센터 페이지에 표기되는 공식 정보입니다.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">법인/상호명 (Company Name) *</label>
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
                  <label className="form-label">대표자명 (CEO) *</label>
                  <input
                    type="text"
                    required
                    value={settings.business_info?.ceo || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, ceo: e.target.value }
                    })}
                    placeholder="박기삼"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">공식 비즈니스 / 고객센터 이메일 (Business Email) *</label>
                  <input
                    type="email"
                    required
                    value={settings.business_info?.cs_email || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, cs_email: e.target.value }
                    })}
                    placeholder="noeulenterprise@gmail.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">고객센터 대표전화 / 핸드폰 (Business Phone) *</label>
                  <input
                    type="text"
                    required
                    value={settings.business_info?.cs_phone || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_info: { ...settings.business_info, cs_phone: e.target.value }
                    })}
                    placeholder="010-1234-5678"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">사업장 소재지 주소 (Business Address) *</label>
                <input
                  type="text"
                  required
                  value={settings.business_info?.address || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    business_info: { ...settings.business_info, address: e.target.value }
                  })}
                  placeholder="서울특별시 강남구 압구정로 165 노을 빌딩 4층"
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
                  <label className="form-label">전국 무료배송 기준 금액 (KRW ₩) *</label>
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
                  <label className="form-label">기본 배송비 (KRW ₩) *</label>
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
                <label className="form-label">한글 띠배너 공지 문구</label>
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
                <label className="form-label">영문 띠배너 공지 문구 (English Announcement)</label>
                <input
                  type="text"
                  value={settings.header_config?.announcement_en || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    header_config: { ...settings.header_config, announcement_en: e.target.value }
                  })}
                  className="form-input"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="adm-btn adm-btn-primary"
            style={{
              padding: '14px 28px',
              alignSelf: 'flex-start',
              fontSize: '0.9375rem',
              fontWeight: 700,
            }}
          >
            <Save size={16} aria-hidden />
            <span>설정 저장하기 Save settings</span>
          </button>
        </form>
    </AdminLayout>
  );
}
