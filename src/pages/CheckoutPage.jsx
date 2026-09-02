import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../utils/api.js';
import { formatKoreanPhone } from '../utils/formatters.js';
import {
  CreditCard,
  Building,
  ShieldCheck,
  CheckCircle2,
  Search,
  Copy,
  ArrowRight,
  ArrowLeft,
  Info,
  MapPin,
  User,
  Phone,
  Check
} from 'lucide-react';

export function CheckoutPage() {
  const { items, subtotal, shippingFee, totalAmount, clearCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { lang, t, formatKRW } = useLanguage();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();

  // Settings from API
  const [paymentSettings, setPaymentSettings] = useState({
    bank_name: '우리은행 (Woori Bank)',
    account_holder: '박기삼',
    account_number: '1002340390276',
    currency: 'KRW',
    payment_instructions_ko: '주문 접수 후 위 계좌로 주문 금액을 정확히 입금하신 후, 결제 영수증(이체 확인증 또는 모바일 뱅킹 스크린샷)을 업로드해주세요. 관리자 입금 확인 후 즉시 배송이 준비됩니다.',
    payment_instructions_en: 'Please transfer the exact order amount to the bank account above, then upload your transfer screenshot / receipt. Once verified by our team, your order will be prepared for delivery.'
  });

  // Step state: 1 = Address Confirmation, 2 = Payment & Bank Transfer
  const [checkoutStep, setCheckoutStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    postal_code: user?.postal_code || '',
    address: user?.address || '',
    detail_address: user?.detail_address || '',
    shipping_memo: '',
    custom_memo: '',
    payment_method: 'bank_transfer',
    payment_sender_name: user?.name || '',
  });

  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setLocation('/cart');
    }
  }, [items, setLocation]);

  useEffect(() => {
    // Fetch live payment & business settings
    api.get('/content/settings')
      .then((res) => {
        if (res.success && res.data?.payment_info) {
          setPaymentSettings(res.data.payment_info);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.name || '',
        customer_email: prev.customer_email || user.email || '',
        customer_phone: prev.customer_phone || user.phone || '',
        postal_code: prev.postal_code || user.postal_code || '',
        address: prev.address || user.address || '',
        detail_address: prev.detail_address || user.detail_address || '',
        payment_sender_name: prev.payment_sender_name || user.name || '',
      }));
    }
  }, [user]);

  // Simulated Korean Address Finder Modal helper
  const handleSimulateAddressFind = () => {
    const addresses = [
      { postal: '06001', road: '서울특별시 강남구 압구정로 165' },
      { postal: '04038', road: '서울특별시 마포구 양화로 160' },
      { postal: '04781', road: '서울특별시 성동구 성수이로 88' },
      { postal: '06532', road: '서울특별시 서초구 신반포로 176' },
      { postal: '03052', road: '서울특별시 종로구 삼청로 50' },
    ];
    const picked = addresses[Math.floor(Math.random() * addresses.length)];
    setFormData((prev) => ({
      ...prev,
      postal_code: picked.postal,
      address: picked.road,
    }));
    showToast(lang === 'ko' ? '주소가 입력되었습니다. 상세주소를 확인해주세요.' : 'Address auto-filled. Please check detailed address.', 'info');
  };

  const handlePhoneChange = (e) => {
    const formatted = formatKoreanPhone(e.target.value);
    setFormData((prev) => ({ ...prev, customer_phone: formatted }));
  };

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(paymentSettings.account_number);
    setCopied(true);
    showToast(lang === 'ko' ? '계좌번호가 복사되었습니다.' : 'Account number copied.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Step 1 Validation -> Proceed to Payment Step
  const handleProceedToPayment = (e) => {
    e.preventDefault();

    if (!formData.customer_name.trim()) {
      showToast(lang === 'ko' ? '받는 분 성함을 입력해주세요.' : 'Please enter recipient name.', 'error');
      return;
    }
    if (!formData.customer_phone.trim()) {
      showToast(lang === 'ko' ? '연락처를 입력해주세요.' : 'Please enter phone number.', 'error');
      return;
    }
    if (!formData.postal_code.trim() || !formData.address.trim()) {
      showToast(lang === 'ko' ? '배송지 주소(우편번호 및 도로명 주소)를 입력해주세요.' : 'Please enter delivery address.', 'error');
      return;
    }

    if (!formData.payment_sender_name) {
      setFormData((prev) => ({ ...prev, payment_sender_name: prev.customer_name }));
    }

    setAddressConfirmed(true);
    setCheckoutStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(lang === 'ko' ? '배송지가 확인되었습니다. 입금 계좌 안내를 확인해주세요.' : 'Address confirmed. Please review bank details.', 'info');
  };

  // Final Step: Submit Order
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!agreed) {
      showToast(lang === 'ko' ? '주문 약관에 동의해주세요.' : 'Please agree to terms.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const finalMemo = formData.shipping_memo === 'custom' ? formData.custom_memo : formData.shipping_memo;

      const orderPayload = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        postal_code: formData.postal_code,
        address: formData.address,
        detail_address: formData.detail_address,
        shipping_memo: finalMemo,
        payment_method: 'bank_transfer',
        payment_sender_name: formData.payment_sender_name || formData.customer_name,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          size: i.size,
          color: lang === 'ko' ? i.color_ko : i.color_en,
        })),
      };

      const res = await api.post('/orders', orderPayload);

      if (res.success && res.order) {
        clearCart();
        showToast(lang === 'ko' ? '주문이 성공적으로 접수되었습니다!' : 'Order placed successfully!', 'success');
        setLocation(`/order-success/${res.order.order_number}`);
      } else {
        throw new Error(res.message || '주문 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('Order checkout error:', err);
      showToast(err.message || '주문 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '40px 0 90px', backgroundColor: '#fafafa', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '1100px' }}>
        {/* Step Progress Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="font-serif" style={{ fontSize: '2.25rem', fontWeight: 600, marginBottom: '16px', color: '#18181b' }}>
            {t('checkout.title')}
          </h1>

          {/* Breadcrumb Steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', fontWeight: 600 }}>
            <span style={{ color: '#71717a' }}>1. 장바구니 (Cart)</span>
            <span style={{ color: '#a1a1aa' }}>→</span>
            <span
              style={{
                color: checkoutStep === 1 ? 'var(--accent-sunset)' : '#18181b',
                backgroundColor: checkoutStep === 1 ? '#fff1f2' : '#ffffff',
                padding: '4px 12px',
                borderRadius: '16px',
                border: checkoutStep === 1 ? '1px solid var(--accent-sunset)' : '1px solid #e4e4e7',
              }}
            >
              2. 배송지 확인 (Confirm Address)
            </span>
            <span style={{ color: '#a1a1aa' }}>→</span>
            <span
              style={{
                color: checkoutStep === 2 ? 'var(--accent-sunset)' : '#71717a',
                backgroundColor: checkoutStep === 2 ? '#fff1f2' : '#ffffff',
                padding: '4px 12px',
                borderRadius: '16px',
                border: checkoutStep === 2 ? '1px solid var(--accent-sunset)' : '1px solid #e4e4e7',
              }}
            >
              3. 무통장 입금 (Bank Transfer)
            </span>
            <span style={{ color: '#a1a1aa' }}>→</span>
            <span style={{ color: '#a1a1aa' }}>4. 입금증 등록 (Upload Proof)</span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '36px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Flow step 1 or step 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* STEP 1: Delivery Address Form */}
            {checkoutStep === 1 ? (
              <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 1. Customer & Recipient Information */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <User size={18} color="var(--accent-sunset)" />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#18181b' }}>
                      {t('checkout.customer_info')} (주문자 및 수령인)
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{t('checkout.recipient_name')} *</label>
                      <input
                        type="text"
                        required
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value, payment_sender_name: formData.payment_sender_name || e.target.value })}
                        placeholder={lang === 'ko' ? '받는 분 성함' : 'Recipient Name'}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{t('checkout.recipient_phone')} *</label>
                      <input
                        type="tel"
                        required
                        value={formData.customer_phone}
                        onChange={handlePhoneChange}
                        placeholder="010-1234-5678"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '16px', marginBottom: 0 }}>
                    <label className="form-label">이메일 (주문 확인서 수신용)</label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      placeholder="user@example.com"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 2. Delivery Address */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', border: '1px solid #e4e4e7', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={18} color="var(--accent-sunset)" />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#18181b' }}>
                        {t('checkout.shipping_info')} (배송지 주소)
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateAddressFind}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8125rem',
                        color: 'var(--accent-sunset)',
                        backgroundColor: '#fff1f2',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Search size={13} />
                      <span>{t('checkout.find_address')}</span>
                    </button>
                  </div>

                  {/* Postal Code */}
                  <div className="form-group">
                    <label className="form-label">{t('checkout.postal_code')} *</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="우편번호 5자리 (예: 06001)"
                      className="form-input"
                      style={{ maxWidth: '180px' }}
                    />
                  </div>

                  {/* Road Name Address */}
                  <div className="form-group">
                    <label className="form-label">{t('checkout.address')} *</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder={lang === 'ko' ? '기본 주소 (도로명 또는 지번)' : 'Street Address'}
                      className="form-input"
                    />
                  </div>

                  {/* Detailed Address */}
                  <div className="form-group">
                    <label className="form-label">{t('checkout.detail_address')}</label>
                    <input
                      type="text"
                      value={formData.detail_address}
                      onChange={(e) => setFormData({ ...formData, detail_address: e.target.value })}
                      placeholder={lang === 'ko' ? '상세주소 (동/호수, 층수 등)' : 'Apartment, suite, unit, etc.'}
                      className="form-input"
                    />
                  </div>

                  {/* Shipping Memo */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{t('checkout.shipping_memo')}</label>
                    <select
                      value={formData.shipping_memo}
                      onChange={(e) => setFormData({ ...formData, shipping_memo: e.target.value })}
                      className="form-select"
                    >
                      <option value="">배송 시 요청사항을 선택해주세요.</option>
                      <option value="부재 시 문 앞에 놓아주세요.">부재 시 문 앞에 놓아주세요.</option>
                      <option value="배송 전 미리 연락 바랍니다.">배송 전 미리 연락 바랍니다.</option>
                      <option value="경비실에 맡겨주세요.">경비실에 맡겨주세요.</option>
                      <option value="택배함에 넣어주세요.">택배함에 넣어주세요.</option>
                      <option value="custom">직접 입력 (Custom Note)</option>
                    </select>

                    {formData.shipping_memo === 'custom' && (
                      <input
                        type="text"
                        value={formData.custom_memo}
                        onChange={(e) => setFormData({ ...formData, custom_memo: e.target.value })}
                        placeholder="요청사항을 직접 입력해주세요."
                        className="form-input"
                        style={{ marginTop: '10px' }}
                      />
                    )}
                  </div>
                </div>

                {/* Step 1 CTA Button */}
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    backgroundColor: 'var(--accent-sunset)',
                    padding: '16px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                  }}
                >
                  <span>배송지 확인 및 결제 계좌 안내로 이동</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              /* STEP 2: Payment & Bank Transfer Details View */
              <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Address Confirmation Summary Card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '0.875rem', marginBottom: '4px' }}>
                      <CheckCircle2 size={16} color="#16a34a" />
                      <span>배송지 확인 완료 (Delivery Address Confirmed)</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#18181b', fontWeight: 600 }}>
                      {formData.customer_name} ({formData.customer_phone})
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: '#71717a' }}>
                      [{formData.postal_code}] {formData.address} {formData.detail_address}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    style={{ fontSize: '0.8125rem', color: 'var(--accent-sunset)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    수정하기
                  </button>
                </div>

                {/* Bank Transfer Box */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '28px',
                    border: '2px solid #FEE500',
                    boxShadow: '0 4px 16px rgba(254, 229, 0, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEE500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building size={16} color="#18181b" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#18181b' }}>
                        무통장 입금 계좌 안내 (Bank Transfer)
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
                        아래 공식 입금 계좌로 정확한 금액을 이체해주세요.
                      </span>
                    </div>
                  </div>

                  {/* Account Details Box */}
                  <div
                    style={{
                      backgroundColor: '#fefce8',
                      borderRadius: '8px',
                      padding: '20px',
                      border: '1px solid #fef08a',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', rowGap: '12px', fontSize: '0.9375rem' }}>
                      <span style={{ color: '#854d0e', fontWeight: 600 }}>은행명:</span>
                      <strong style={{ color: '#18181b' }}>{paymentSettings.bank_name || '우리은행 (Woori Bank)'}</strong>

                      <span style={{ color: '#854d0e', fontWeight: 600 }}>예금주:</span>
                      <strong style={{ color: '#18181b', fontSize: '1.0625rem' }}>
                        {paymentSettings.account_holder || '박기삼'}
                      </strong>

                      <span style={{ color: '#854d0e', fontWeight: 600 }}>계좌번호:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '1.25rem', fontFamily: 'monospace', letterSpacing: '0.05em', color: '#18181b' }}>
                          {paymentSettings.account_number || '1002340390276'}
                        </strong>
                        <button
                          type="button"
                          onClick={handleCopyAccountNumber}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #d97706',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#b45309',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copied ? '복사됨!' : '계좌복사'}</span>
                        </button>
                      </div>

                      <span style={{ color: '#854d0e', fontWeight: 600 }}>입금금액:</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--accent-sunset)', fontWeight: 900 }}>
                        {formatKRW(totalAmount)}
                      </strong>
                    </div>
                  </div>

                  {/* Depositor Name Input */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">
                      입금자명 (실제 송금하시는 분 성함) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.payment_sender_name}
                      onChange={(e) => setFormData({ ...formData, payment_sender_name: e.target.value })}
                      placeholder="예: 박기삼 (주문자명과 다른 경우 정확히 입력)"
                      className="form-input"
                    />
                    <span style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px', display: 'block' }}>
                      ※ 주문자 성함과 입금자 성함이 다를 경우 반드시 실입금자명을 입력해주세요.
                    </span>
                  </div>

                  {/* Instructions */}
                  <div style={{ backgroundColor: '#fafafa', borderRadius: '6px', padding: '14px', border: '1px solid #e4e4e7', fontSize: '0.8125rem', color: '#52525b', lineHeight: 1.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>
                      <Info size={15} color="var(--accent-sunset)" />
                      <span>결제 진행 안내</span>
                    </div>
                    <p>{lang === 'ko' ? paymentSettings.payment_instructions_ko : paymentSettings.payment_instructions_en}</p>
                    <p style={{ marginTop: '4px', color: '#b45309', fontWeight: 600 }}>
                      • 다음 페이지에서 이체 완료 영수증(스크린샷)을 즉시 업로드하실 수 있습니다.
                    </p>
                  </div>
                </div>

                {/* Terms and Submit */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e4e4e7' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span>주문 상품 정보 및 결제 조건에 모두 동의합니다.</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    className="btn-secondary"
                    style={{ padding: '16px 20px', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={16} />
                    <span>이전 단계</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--accent-sunset)',
                      padding: '16px',
                      fontSize: '1.0625rem',
                      fontWeight: 800,
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    <span>
                      {submitting ? '주문 생성 중...' : `주문 접수 완료 및 영수증 업로드 (${formatKRW(totalAmount)})`}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '28px',
              border: '1px solid #e4e4e7',
              boxShadow: 'var(--shadow-sm)',
              position: 'sticky',
              top: '80px',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '18px', color: '#18181b' }}>
              {t('checkout.order_summary')} ({items.length}개 품목)
            </h3>

            {/* Items Mini List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '260px', overflowY: 'auto' }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img
                    src={item.image_url}
                    alt={item.name_ko}
                    style={{ width: '44px', height: '56px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#eee' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#18181b', lineHeight: 1.3 }}>
                      {lang === 'ko' ? item.name_ko : item.name_en}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#71717a' }}>
                      {item.size} / {lang === 'ko' ? item.color_ko : item.color_en} • {item.quantity}개
                    </p>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#18181b' }}>
                    {formatKRW(item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid #f0f0f2', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#52525b' }}>
                <span>상품 금액</span>
                <span>{formatKRW(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#52525b' }}>
                <span>배송비</span>
                <span>{shippingFee === 0 ? '무료배송' : formatKRW(shippingFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 900, paddingTop: '12px', borderTop: '1px dashed #e4e4e7' }}>
                <span>총 결제금액</span>
                <span style={{ color: 'var(--accent-sunset)' }}>{formatKRW(totalAmount)}</span>
              </div>
            </div>

            {/* Security Guarantee Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#71717a', backgroundColor: '#fafafa', padding: '10px 12px', borderRadius: '6px' }}>
              <ShieldCheck size={16} color="#16a34a" />
              <span>안전한 1:1 무통장 입금 및 영수증 확인 시스템</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
