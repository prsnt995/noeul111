import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Shield, Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';

export function AdminLoginPage() {
  const { isAdmin, adminLogin } = useAuth();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setLocation('/admin');
    }
  }, [isAdmin, setLocation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(email, password);
      showToast('관리자 인증에 성공했습니다.', 'success');
      setLocation('/admin');
    } catch (err) {
      showToast(err.message || '관리자 로그인 실패', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@noeul.kr');
    setPassword('admin1234!');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0c0c0e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#f4f4f5',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#18181b',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          border: '1px solid #27272a',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: 'rgba(184, 77, 52, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              border: '1px solid rgba(184, 77, 52, 0.3)',
            }}
          >
            <Shield size={28} color="var(--accent-sunset)" />
          </div>
          <h1 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '0.08em' }}>
            NOEUL ADMIN
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', marginTop: '6px' }}>
            관리자 전용 보안 로그인 포털
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#d4d4d8', marginBottom: '8px' }}>
              관리자 이메일
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#71717a" style={{ position: 'absolute', top: '14px', left: '12px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@noeul.kr"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.9375rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#d4d4d8', marginBottom: '8px' }}>
              비밀번호
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#71717a" style={{ position: 'absolute', top: '14px', left: '12px' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.9375rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'var(--accent-sunset)',
              color: '#ffffff',
              padding: '14px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.9375rem',
              marginTop: '8px',
              transition: 'background 0.15s',
              cursor: 'pointer',
            }}
          >
            <span>{loading ? '인증 확인 중...' : '관리자 대시보드 로그인'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Fill Helper */}
        <div
          style={{
            marginTop: '28px',
            padding: '16px',
            backgroundColor: '#27272a',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            fontSize: '0.8125rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#a1a1aa', fontWeight: 600 }}>Demo Admin</span>
            <button
              type="button"
              onClick={handleFillDemo}
              style={{ color: 'var(--accent-sunset)', fontWeight: 600, textDecoration: 'underline' }}
            >
              Fill Credentials
            </button>
          </div>
          <p style={{ color: '#71717a', marginTop: '6px', fontFamily: 'monospace', fontSize: '0.75rem' }}>
            admin@noeul.kr / admin1234!
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/" style={{ fontSize: '0.8125rem', color: '#71717a', textDecoration: 'underline' }}>
            ← 고객 쇼핑몰로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
