import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { api } from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function AuthCallbackPage() {
  const [, setLocation] = useLocation();
  const { showToast } = useToast();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cookie-session landing: the backend OAuth callback sets the session
    // cookie and lands on /account directly. If anything routes here,
    // verify the canonical session instead of any provider SDK state.
    async function handleAuthCallback() {
      try {
        const { user } = await api.get('/me');
        if (user) {
          showToast(`환영합니다, ${user.name || user.email}님! Google 로그인 완료.`, 'success');
          setTimeout(() => {
            setLocation('/account');
          }, 600);
        } else {
          throw new Error('로그인 세션을 확인하지 못했습니다.');
        }
      } catch (err) {
        console.error('OAuth Callback Error:', err);
        setError(err.message || '로그인 처리 중 오류가 발생했습니다.');
        showToast(err.message || '로그인 오류', 'error');
        setTimeout(() => {
          setLocation('/auth');
        }, 2500);
      }
    }

    handleAuthCallback();
  }, [setLocation, showToast]);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        backgroundColor: '#faf8f5',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        {error ? (
          <div>
            <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#18181b', marginBottom: '8px' }}>
              인증 처리 안내
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#71717a', lineHeight: 1.5 }}>
              {error}
            </p>
          </div>
        ) : (
          <div>
            <Loader2
              size={48}
              className="animate-spin"
              style={{ margin: '0 auto 20px', color: 'var(--accent-sunset)' }}
            />
            <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#18181b', marginBottom: '8px' }}>
              NOEUL Google Login
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
              Google 계정 인증을 완료하고 있습니다...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
