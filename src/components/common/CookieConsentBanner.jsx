import React, { useState, useEffect } from 'react';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const dismissed = localStorage.getItem('cookie-consent-dismissed');
    if (!dismissed) setVisible(true);
  }, []);
  const accept = () => { localStorage.setItem('cookie-consent-dismissed', 'true'); setVisible(false); };
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a1a1e', color: '#f4f4f5', padding: '16px 24px', zIndex: 9999, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
        <strong>쿠키·저장소 안내</strong> — 로그인 유지와 장바구니 저장에 쿠키 및 브라우저 저장소를 사용합니다.{' '}
        <a href="/cookies" style={{ color: '#e05638' }}>자세히 보기</a>.
      </div>
      <button onClick={accept} style={{ background: '#e05638', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
        확인
      </button>
    </div>
  );
}
