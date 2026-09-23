import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Cookie, ArrowLeft, Check, Lock, Settings } from 'lucide-react';

export function CookiePolicyPage() {
  const { lang } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', padding: '60px 0 100px' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Navigation Back Link */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-sunset, #e05638)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            <span>홈으로 돌아가기</span>
          </Link>
        </div>

        {/* Page Header */}
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Cookie size={28} color="var(--accent-sunset, #e05638)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-sunset, #e05638)' }}>
              NOEUL COOKIE POLICY
            </span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
            쿠키정책
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            주식회사 페리어스엔지가 운영하는 NOEUL 웹사이트(https://noeul.me)에서 사용하는 쿠키 및 유사 추적 기술에 대한 설명과 관리 방법에 대한 안내입니다.
          </p>
        </div>

        {/* Policy Body */}
        <div style={{ fontSize: '0.9375rem', lineHeight: 1.85, color: 'var(--text-secondary)' }}>
          
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              1. 쿠키(Cookie)란 무엇인가요?
            </h2>
            <p>
              쿠키는 웹사이트를 방문할 때 이용자의 브라우저에 저장되는 소규모 텍스트 파일입니다. 쿠키는 웹사이트가 이용자의 설정 및 장바구니 정보 등을 기억하여 보다 빠르고 편리한 웹 경험을 제공하는 데 사용됩니다.
            </p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              2. NOEUL에서 사용하는 쿠키의 종류
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '20px', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="var(--accent-sunset, #e05638)" />
                  <span>가. 필수 쿠키 (Essential Cookies)</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  웹사이트의 기본 기능(로그인 세션 유지, 보안 결제, 장바구니 상품 정보 저장)을 위해 필수적으로 요구되는 쿠키입니다. 이 쿠키가 없으면 정상적인 쇼핑몰 이용이 불가능할 수 있습니다.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '20px', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={16} color="var(--accent-sunset, #e05638)" />
                  <span>나. 기능성 및 설정 쿠키 (Functional Cookies)</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  이용자가 선택한 언어 설정(한글/영문)이나 화면 표시 기본값을 기억하여 다시 방문했을 때 최적의 맞춤 환경을 제공합니다.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '20px', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} color="var(--accent-sunset, #e05638)" />
                  <span>다. 성능 및 분석 쿠키 (Analytics Cookies)</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  웹사이트 방문자 수, 인기 상품 페이지, 접속 경로 등 익명화된 통계 데이터를 수집하여 웹사이트 성능과 사용자 경험을 개선하는 데 활용됩니다.
                </p>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              3. 쿠키 설정 관리 및 거부 방법
            </h2>
            <p style={{ marginBottom: '12px' }}>
              이용자는 웹 브라우저의 옵션을 변경하여 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다.
            </p>
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '20px', border: '1px solid var(--border-light)' }}>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                <li><strong>Chrome:</strong> 웹 브라우저 우측 상단 설정 &gt; 개인정보 보호 및 보안 &gt; 쿠키 및 기타 사이트 데이터</li>
                <li><strong>Safari:</strong> 환경설정 &gt; 개인정보 보호 탭 &gt; 쿠키 및 웹사이트 데이터 관리</li>
                <li><strong>Edge:</strong> 설정 &gt; 쿠키 및 사이트 권한 &gt; 쿠키 및 사이트 데이터 관리 및 삭제</li>
              </ul>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              ※ 단, 쿠키 저장을 거부하실 경우 장바구니 상품 유지나 로그인 상태 유지 등 일부 서비스 이용에 어려움이 발생할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              4. 문의처
            </h2>
            <p>
              쿠키 정책 관련 궁금한 점은 <strong>noeulenterprises@gmail.com</strong> 또는 고객센터(<strong>01083615305</strong>)로 문의해주시기 바랍니다.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

export default CookiePolicyPage;
