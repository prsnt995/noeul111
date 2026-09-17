import React, { useState } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../utils/api.js';
import { Headphones, Phone, Mail, Clock, MessageSquare, Send, ArrowLeft, ChevronDown } from 'lucide-react';

function KakaoIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.765c0 2.766 1.84 5.195 4.62 6.643-.2.74-.73 2.68-.84 3.09-.13.5.18.49.38.36.16-.1 2.53-1.72 3.56-2.42.75.11 1.51.17 2.28.17 5.523 0 10-3.477 10-7.765C22 6.477 17.523 3 12 3z" />
    </svg>
  );
}

export function ContactPage() {
  const { lang } = useLanguage();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'shipping',
    message: '',
  });

  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const faqs = [
    {
      q: '배송 기간은 얼마나 걸리나요?',
      a: '평일 오후 2시 이전 결제 완료 건은 당일 출고되며, 일반 배송은 출고 후 평균 1~3일(주말/공휴일 제외) 소요됩니다.'
    },
    {
      q: '무료배송 기준은 어떻게 되나요?',
      a: '실결제 금액 70,000원 이상 구매 시 전국 무료배송 혜택이 적용됩니다. 70,000원 미만 시 기본 배송비 3,000원이 부과됩니다.'
    },
    {
      q: '교환 및 반품은 어떻게 신청하나요?',
      a: '상품 수령 후 7일 이내에 마이페이지 또는 고객센터(01083615305 / noeulenterprises@gmail.com)로 접수해주시면 담당자가 교환/반품 안내를 도와드립니다.'
    },
    {
      q: '무통장 입금 계좌는 어디서 확인하나요?',
      a: '주문 결제 시 안내되는 공식 예금 계좌 (우리은행 1002340390276 박기성)로 주문 금액을 정확히 입금하신 후 이체 영수증을 확인해주시면 빠른 처리가 진행됩니다.'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast('성함, 이메일, 문의 내용을 입력해주세요.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/inquiries', formData);
      if (res.success) {
        showToast('1:1 문의가 접수되었습니다. (noeulenterprises@gmail.com으로 발송되었습니다)', 'success');
        setFormData({ name: '', email: '', phone: '', category: 'shipping', message: '' });
      } else {
        showToast(res.message || '문의 접수 중 오류가 발생했습니다.', 'error');
      }
    } catch (err) {
      console.error('Submit inquiry error:', err);
      // Fallback mailto trigger
      const mailtoUrl = `mailto:noeulenterprises@gmail.com?subject=${encodeURIComponent(`[NOEUL 문의] ${formData.name}님`)}&body=${encodeURIComponent(`성함: ${formData.name}\n이메일: ${formData.email}\n연락처: ${formData.phone}\n\n문의 내용:\n${formData.message}`)}`;
      window.location.href = mailtoUrl;
      showToast('문의 메일 프로그램이 연결되었습니다.', 'info');
      setFormData({ name: '', email: '', phone: '', category: 'shipping', message: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-primary, #0b0b0c)', color: 'var(--text-primary, #f4f4f5)', minHeight: '100vh', padding: '60px 0 100px' }}>
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Back link */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-sunset, #e05638)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>

        {/* Page Header */}
        <div style={{ borderBottom: '1px solid var(--border-color, #232328)', paddingBottom: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Headphones size={28} color="var(--accent-sunset, #e05638)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-sunset, #e05638)' }}>
              NOEUL CUSTOMER SERVICE
            </span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>
            고객센터 (Customer Service)
          </h1>
          <p style={{ color: '#8e8e93', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            궁금하신 점이나 상품 및 배송 관련 문의사항이 있으시면 언제든지 편하게 문의해 주세요.
          </p>
        </div>

        {/* 3 Channel Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '48px' }}>
          
          {/* Card 1: Phone */}
          <div style={{ backgroundColor: '#141416', border: '1px solid #232328', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#232328', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={20} color="var(--accent-sunset, #e05638)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>전화 상담</h3>
                <span style={{ fontSize: '0.75rem', color: '#8e8e93' }}>대표 고객센터</span>
              </div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
              010-8361-5305
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#8e8e93', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} />
              <span>평일 09:00 - 17:00 (월~금)</span>
            </div>
          </div>

          {/* Card 2: Email */}
          <div style={{ backgroundColor: '#141416', border: '1px solid #232328', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#232328', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} color="var(--accent-sunset, #e05638)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>이메일 문의</h3>
                <span style={{ fontSize: '0.75rem', color: '#8e8e93' }}>공식 비즈니스</span>
              </div>
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--accent-sunset, #e05638)', wordBreak: 'break-all' }}>
              noeulenterprises@gmail.com
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#8e8e93' }}>
              24시간 상시 접수 (순차 답변)
            </div>
          </div>

          {/* Card 3: KakaoTalk */}
          <div style={{ backgroundColor: '#141416', border: '1px solid #232328', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#fee500', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000' }}>
                <KakaoIcon size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>카카오톡 채널</h3>
                <span style={{ fontSize: '0.75rem', color: '#8e8e93' }}>실시간 메신저</span>
              </div>
            </div>
            <a
              href="https://open.kakao.com/o/prsnt.2415"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#fee500',
                color: '#000000',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 700,
                textDecoration: 'none',
                marginTop: 'auto',
              }}
            >
              <KakaoIcon size={16} />
              <span>카카오톡 1:1 상담 시작</span>
            </a>
          </div>

        </div>

        {/* 1:1 Message Form + FAQ Section Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }} className="cs-grid">
          
          {/* 1:1 Inquiry Form */}
          <div style={{ backgroundColor: '#121214', border: '1px solid #232328', borderRadius: '16px', padding: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={20} color="var(--accent-sunset, #e05638)" />
              <span>1:1 온라인 고객 문의</span>
            </h2>
            <p style={{ color: '#8e8e93', fontSize: '0.875rem', marginBottom: '24px' }}>
              문의사항을 남겨주시면 확인 후 이메일 또는 연락처로 신속히 안내해 드리겠습니다.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#d1d1d6', marginBottom: '6px' }}>
                  이름 (성함) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#1a1a1e', border: '1px solid #2c2c34', color: '#ffffff', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#d1d1d6', marginBottom: '6px' }}>
                  이메일 주소 *
                </label>
                <input
                  type="email"
                  required
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#1a1a1e', border: '1px solid #2c2c34', color: '#ffffff', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#d1d1d6', marginBottom: '6px' }}>
                  연락처 (선택)
                </label>
                <input
                  type="text"
                  placeholder="010-0000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#1a1a1e', border: '1px solid #2c2c34', color: '#ffffff', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#d1d1d6', marginBottom: '6px' }}>
                  문의 유형
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#1a1a1e', border: '1px solid #2c2c34', color: '#ffffff', fontSize: '0.875rem' }}
                >
                  <option value="shipping">배송 문의</option>
                  <option value="return">교환 및 반품 문의</option>
                  <option value="product">상품 관련 문의</option>
                  <option value="payment">결제 및 입금 문의</option>
                  <option value="other">기타 일반 문의</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#d1d1d6', marginBottom: '6px' }}>
                  문의 내용 *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="문의 내용을 자세히 기재해 주세요."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#1a1a1e', border: '1px solid #2c2c34', color: '#ffffff', fontSize: '0.875rem', lineHeight: 1.6 }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: 'var(--accent-sunset, #e05638)',
                  color: '#ffffff',
                  padding: '14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  transition: 'opacity 0.2s ease',
                }}
              >
                <Send size={16} />
                <span>{submitting ? '문의 접수 중...' : '문의하기 접수'}</span>
              </button>
            </form>
          </div>

          {/* FAQ Accordions */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '20px' }}>
              자주 묻는 질문 (FAQ)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#121214',
                      border: '1px solid #232328',
                      borderRadius: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={16}
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                      />
                    </button>

                    {isOpen && (
                      <div style={{ padding: '0 20px 18px', fontSize: '0.84375rem', lineHeight: 1.7, color: '#a1a1a6', borderTop: '1px solid #1a1a1e', paddingTop: '12px' }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default ContactPage;
