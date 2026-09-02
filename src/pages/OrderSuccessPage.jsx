import React, { useState, useEffect, useRef } from 'react';
import { useRoute, Link } from 'wouter';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  CheckCircle,
  Building,
  Upload,
  Copy,
  Clock,
  ShieldCheck,
  Check,
  FileText,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Truck
} from 'lucide-react';

export function OrderSuccessPage() {
  const [, params] = useRoute('/order-success/:orderNumber');
  const { lang, t, formatKRW } = useLanguage();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const [paymentSettings, setPaymentSettings] = useState({
    bank_name: '우리은행 (Woori Bank)',
    account_holder: '박기삼',
    account_number: '1002340390276',
    currency: 'KRW',
    payment_instructions_ko: '위 계좌로 주문 금액을 정확히 입금하신 후, 모바일 뱅킹 이체 내역 스크린샷 또는 영수증을 업로드해주세요.',
    payment_instructions_en: 'Please transfer the exact order amount to the bank account above and upload your transfer screenshot / receipt.'
  });

  const loadOrder = async () => {
    if (!params?.orderNumber) return;
    try {
      const [orderRes, settingsRes] = await Promise.all([
        fetch(`/api/orders/${params.orderNumber}`).then((r) => r.json()),
        fetch('/api/content/settings').then((r) => r.json()),
      ]);

      if (orderRes.success && orderRes.data) {
        setOrder(orderRes.data);
      }
      if (settingsRes.success && settingsRes.data?.payment_info) {
        setPaymentSettings(settingsRes.data.payment_info);
      }
    } catch (err) {
      console.error('Failed to load order:', err);
      showToast('주문 정보를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [params?.orderNumber]);

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(paymentSettings.account_number);
    setCopied(true);
    showToast(lang === 'ko' ? '계좌번호가 복사되었습니다.' : 'Account number copied.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('sender_name', order?.payment_sender_name || order?.customer_name || '');

    try {
      const response = await fetch(`/api/orders/${params.orderNumber}/payment-receipt`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.data) {
        setOrder(data.data);
        showToast('결제 영수증이 등록되었습니다. 관리자가 입금 내역을 확인합니다.', 'success');
      } else {
        showToast(data.message || '영수증 업로드 실패', 'error');
      }
    } catch (err) {
      console.error('Receipt upload error:', err);
      showToast('영수증 업로드 중 오류가 발생했습니다.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>
        <Loader2 size={32} className="animate-spin" color="var(--accent-sunset)" style={{ margin: '0 auto 12px' }} />
        <p>{lang === 'ko' ? '주문 내역을 불러오는 중입니다...' : 'Loading order details...'}</p>
      </div>
    );
  }

  // Determine payment status badge
  const isPaid = order?.payment_status === 'paid';
  const isUnderReview = order?.payment_status === 'under_review';
  const isPending = !isPaid && !isUnderReview;

  return (
    <div style={{ padding: '40px 0 100px', backgroundColor: '#fafafa', minHeight: '85vh' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleReceiptUpload}
          accept="image/*, application/pdf"
          style={{ display: 'none' }}
        />

        {/* Top Header Message */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: isPaid ? '#dcfce7' : '#fef9c3',
              color: isPaid ? '#16a34a' : '#ca8a04',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            {isPaid ? <CheckCircle size={36} /> : <Clock size={36} />}
          </div>

          <h1 className="font-serif" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '6px', color: '#18181b' }}>
            {isPaid ? '입금 확인 및 주문 완료' : '주문 접수 완료 (입금 확인 대기)'}
          </h1>
          <p style={{ color: '#71717a', fontSize: '0.9375rem' }}>
            주문번호: <strong style={{ fontFamily: 'monospace', color: '#18181b' }}>{order?.order_number}</strong>
          </p>
        </div>

        {/* Payment Flow Visual Timeline */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px 24px',
            border: '1px solid #e4e4e7',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '14px' }}>
            주문 및 결제 진행 단계 (Payment & Order Flow)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
            {/* Step 1: Order Created */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, marginBottom: '6px' }}>
                ✓
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#18181b' }}>1. 주문 접수</span>
              <span style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 600 }}>완료</span>
            </div>

            {/* Step 2: Upload Proof */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: order?.payment_receipt_url ? '#16a34a' : '#ca8a04', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, marginBottom: '6px' }}>
                {order?.payment_receipt_url ? '✓' : '2'}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#18181b' }}>2. 영수증 제출</span>
              <span style={{ fontSize: '0.6875rem', color: order?.payment_receipt_url ? '#16a34a' : '#ca8a04', fontWeight: 600 }}>
                {order?.payment_receipt_url ? '등록 완료' : '제출 필요'}
              </span>
            </div>

            {/* Step 3: Admin Review */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: isPaid ? '#16a34a' : (isUnderReview ? '#ca8a04' : '#e4e4e7'), color: (isPaid || isUnderReview) ? '#fff' : '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, marginBottom: '6px' }}>
                {isPaid ? '✓' : '3'}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#18181b' }}>3. 관리자 확인</span>
              <span style={{ fontSize: '0.6875rem', color: isPaid ? '#16a34a' : (isUnderReview ? '#ca8a04' : '#71717a'), fontWeight: 600 }}>
                {isPaid ? '승인 완료' : (isUnderReview ? '검수 진행중' : '대기')}
              </span>
            </div>

            {/* Step 4: Confirmed & Shipping */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: isPaid ? '#16a34a' : '#e4e4e7', color: isPaid ? '#fff' : '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, marginBottom: '6px' }}>
                {isPaid ? '✓' : '4'}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#18181b' }}>4. 배송 준비</span>
              <span style={{ fontSize: '0.6875rem', color: isPaid ? '#16a34a' : '#71717a', fontWeight: 600 }}>
                {isPaid ? '발송 준비중' : '대기'}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Transfer Details Box */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '28px',
            border: '2px solid #FEE500',
            boxShadow: '0 4px 16px rgba(254, 229, 0, 0.25)',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={20} color="#18181b" />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#18181b' }}>
                입금 계좌 정보 (Bank Transfer Info)
              </h3>
            </div>

            <span
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: isPaid ? '#dcfce7' : (isUnderReview ? '#fef9c3' : '#fee2e2'),
                color: isPaid ? '#166534' : (isUnderReview ? '#854d0e' : '#991b1b'),
                fontWeight: 800,
              }}
            >
              {isPaid ? '입금 확인 완료 (PAID)' : (isUnderReview ? '입금 확인 검수중 (UNDER REVIEW)' : '입금 대기중 (PENDING)')}
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#fefce8',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #fef08a',
              display: 'grid',
              gridTemplateColumns: '110px 1fr',
              rowGap: '12px',
              fontSize: '0.9375rem',
              marginBottom: '16px',
            }}
          >
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

            <span style={{ color: '#854d0e', fontWeight: 600 }}>입금해야할 금액:</span>
            <strong style={{ fontSize: '1.375rem', color: 'var(--accent-sunset)', fontWeight: 900 }}>
              {formatKRW(order?.total_amount || 0)}
            </strong>

            <span style={{ color: '#854d0e', fontWeight: 600 }}>입금자명:</span>
            <span style={{ color: '#18181b', fontWeight: 700 }}>
              {order?.payment_sender_name || order?.customer_name}
            </span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: '#71717a', lineHeight: 1.5 }}>
            • {lang === 'ko' ? paymentSettings.payment_instructions_ko : paymentSettings.payment_instructions_en}
          </p>
        </div>

        {/* Payment Screenshot Upload Section */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '28px',
            border: '1px solid #e4e4e7',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ImageIcon size={20} color="var(--accent-sunset)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#18181b' }}>
              이체 영수증 / 스크린샷 업로드 (Upload Payment Proof)
            </h3>
          </div>

          {order?.payment_receipt_url ? (
            /* Uploaded Screenshot State */
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <a
                href={order.payment_receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ width: '100px', height: '120px', borderRadius: '6px', overflow: 'hidden', display: 'block', backgroundColor: '#eee', flexShrink: 0 }}
              >
                <img src={order.payment_receipt_url} alt="Receipt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </a>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '0.875rem', marginBottom: '4px' }}>
                  <CheckCircle size={16} />
                  <span>영수증이 성공적으로 등록되었습니다.</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#71717a', marginBottom: '12px' }}>
                  등록일시: {order.receipt_uploaded_at || '방금 전'}
                </p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Upload size={13} />
                  <span>다른 사진으로 재업로드</span>
                </button>
              </div>
            </div>
          ) : (
            /* Upload Call-to-action */
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--accent-sunset)',
                borderRadius: '8px',
                padding: '32px 20px',
                textAlign: 'center',
                backgroundColor: '#fff1f2',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              {uploading ? (
                <>
                  <Loader2 size={32} className="animate-spin" color="var(--accent-sunset)" />
                  <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-sunset)' }}>
                    영수증을 서버로 업로드하는 중입니다...
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      color: 'var(--accent-sunset)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Upload size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#18181b', marginBottom: '4px' }}>
                      이체 완료 스크린샷 파일 업로드하기
                    </h4>
                    <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>
                      클릭하여 모바일 뱅킹 송금 확인증 또는 영수증 사진을 선택해주세요 (JPG, PNG, PDF 지원)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ backgroundColor: 'var(--accent-sunset)', padding: '10px 20px', fontSize: '0.875rem', marginTop: '6px' }}
                  >
                    파일 선택 및 업로드
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Order Items & Delivery Summary */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '28px',
            border: '1px solid #e4e4e7',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '32px',
          }}
        >
          {/* Purchased Items */}
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: '#18181b' }}>
            주문 상품 내역 ({order?.items?.length || 0}개)
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {order?.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <img
                  src={item.image_url}
                  alt={item.product_name_ko}
                  style={{ width: '48px', height: '60px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#eee' }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#18181b' }}>
                    {lang === 'ko' ? item.product_name_ko : item.product_name_en}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#71717a' }}>
                    {item.size} / {item.color} • {item.quantity}개
                  </p>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#18181b' }}>
                  {formatKRW(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Delivery Address */}
          <div style={{ borderTop: '1px solid #f0f0f2', paddingTop: '16px', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>
              배송지 주소 (Delivery Address)
            </span>
            <p style={{ fontSize: '0.875rem', color: '#18181b', marginTop: '4px', lineHeight: 1.5 }}>
              <strong>{order?.customer_name}</strong> ({order?.customer_phone})<br />
              [{order?.postal_code}] {order?.address} {order?.detail_address}
            </p>
          </div>

          {/* Total Amount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e4e4e7', paddingTop: '16px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>총 결제금액</span>
            <span style={{ fontSize: '1.375rem', fontWeight: 900, color: 'var(--accent-sunset)' }}>
              {formatKRW(order?.total_amount || 0)}
            </span>
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/account" className="btn-secondary" style={{ flex: 1, padding: '14px', textAlign: 'center', fontSize: '0.9375rem' }}>
            내 주문 내역 확인하기
          </Link>
          <Link href="/shop" className="btn-primary" style={{ flex: 1, padding: '14px', textAlign: 'center', fontSize: '0.9375rem', backgroundColor: 'var(--accent-sunset)' }}>
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </div>
  );
}
