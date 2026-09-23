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
        <strong>Cookie Consent</strong> — We use cookies to improve your experience. By continuing to shop, you agree to our{' '}
        <a href="/privacy" style={{ color: '#e05638' }}>Privacy Policy</a>.
      </div>
      <button onClick={accept} style={{ background: '#e05638', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
        Accept All
      </button>
    </div>
  );
}
