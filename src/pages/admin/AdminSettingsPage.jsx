import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { api } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Settings, Save, Building, Truck, Globe, Shield, CreditCard, Layout, Phone, Mail, MapPin } from 'lucide-react';

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('payment');
  const [settings, setSettings] = useState({
    payment_info: {
      bank_name: '우리은행 (Woori Bank)',
      account_holder: '박기삼',
      account_number: '1002340390276',
      currency: 'KRW',
      payment_instructions_ko: '주문 접수 후 위 계좌로 주문 금액을 정확히 입금하신 후, 결제 영수증(이체 확인증 또는 모바일 뱅킹 스크린샷)을 업로드해주세요. 관리자 입금 확인 후 즉시 배송이 준비됩니다.',
      payment_instructions_en: 'Please transfer the exact order amount to the bank account above, then upload your transfer screenshot / receipt. Once verified by our team, your order will be prepared for delivery.'
    },
    business_info: {
      company_name: '(주)노을패션코리아 (NOEUL Fashion Korea)',
      ceo: '박기삼',
      business_number: '120-88-94821',
      ecommerce_number: '제 2026-서울강남-04821호',
      address: '서울특별시 강남구 압구정로 165 노을 빌딩 4층',
      cs_phone: '010-1234-5678',
      cs_email: 'noeulenterprise@gmail.com',
      bank_account: '우리은행 1002340390276 박기삼'
    },
    shipping_policy: {
      threshold: 70000,
      fee: 3000
    },
    header_config: {
      announcement_enabled: true,
      announcement_ko: '2026 S/S 신규 가입 시 10% 웰컴 쿠폰 & ₩70,000 이상 무료배송',
      announcement_en: 'Spring 2026: Enjoy 10% off your first order & complimentary shipping over ₩70,000',
      announcement_bg: '#121213',
      announcement_color: '#ffffff'
    }
  });

  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/content/settings');
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
      await api.put('/admin/content/settings', { settings });
      showToast('쇼핑몰 설정이 성공적으로 저장되었습니다.', 'success');
    } catch (err) {
      showToast('설정 저장 실패', 'error');
    }
  };

  if (loading) {
    return (
      <AdminLayout activePage="settings">
        <div style={{ textAlign: 'center', padding: '80px', color: '#888' }}>설정 로딩 중...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePage="settings">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>쇼핑몰 환경 & 결제 계좌 설정 (Store Settings)</h1>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              공식 입금 계좌, 사업자/고객센터 연락처, 배송 정책 및 공지 띠배너를 관리합니다.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', borderBottom: '1px solid #e4e4e7', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('payment')}
            className={activeTab === 'payment' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 18px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <CreditCard size={16} />
            <span>무통장 입금 계좌 (Bank Transfer)</span>
          </button>

          <button
            onClick={() => setActiveTab('business')}
            className={activeTab === 'business' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 18px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Building size={16} />
            <span>사업자 & 고객센터 연락처</span>
          </button>

          <button
            onClick={() => setActiveTab('shipping')}
            className={activeTab === 'shipping' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 18px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Truck size={16} />
            <span>배송비 규정</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={activeTab === 'general' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 18px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Layout size={16} />
            <span>헤더 띠배너 공지</span>
          </button>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px' }}>
          {/* 1. Bank Transfer & Payment Tab */}
          {activeTab === 'payment' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                    value={settings.shipping_policy?.threshold || 70000}
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
          )}

          {/* 4. Header & Announcements Tab */}
          {activeTab === 'general' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
            className="btn-primary"
            style={{
              backgroundColor: 'var(--accent-sunset)',
              padding: '14px 28px',
              alignSelf: 'flex-start',
              fontSize: '0.9375rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Save size={16} />
            <span>설정 저장하기</span>
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
