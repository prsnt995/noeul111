import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatKoreanPhone } from '../utils/formatters.js';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  KeyRound
} from 'lucide-react';

export function CustomerAuthPage() {
  const { isLoggedIn, loginWithGoogle, login, register, resetPassword } = useAuth();
  const { lang, t } = useLanguage();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();

  // Modes: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');

  // Loading States
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      setLocation('/account');
    }
  }, [isLoggedIn, setLocation]);

  // 1. Firebase Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      showToast(
        lang === 'ko'
          ? `환영합니다, ${user.name}님! 성공적으로 로그인되었습니다.`
          : `Welcome back, ${user.name}!`,
        'success'
      );
      setLocation('/account');
    } catch (err) {
      console.error('Google Auth Error:', err);
      setErrorMsg(err.message || '구글 로그인 중 오류가 발생했습니다.');
      showToast(err.message || '구글 로그인 실패', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 2. Standard Email/Password Sign-In
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg(lang === 'ko' ? '이메일과 비밀번호를 모두 입력해주세요.' : 'Please enter email and password.');
      return;
    }

    setErrorMsg('');
    setFormLoading(true);

    try {
      await login(email.trim(), password);
      showToast(
        lang === 'ko' ? '로그인되었습니다. 환영합니다!' : 'Signed in successfully. Welcome back!',
        'success'
      );
      setLocation('/account');
    } catch (err) {
      setErrorMsg(err.message || '로그인에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  // 3. Register New Account
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !name.trim()) {
      setErrorMsg(lang === 'ko' ? '이름, 이메일, 비밀번호는 필수 입력 항목입니다.' : 'Name, email and password are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg(lang === 'ko' ? '비밀번호는 6자리 이상이어야 합니다.' : 'Password must be at least 6 characters.');
      return;
    }

    setErrorMsg('');
    setFormLoading(true);

    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim(),
      });
      showToast(
        lang === 'ko'
          ? '회원가입이 완료되었습니다! 10% 웰컴 쿠폰이 즉시 지급되었습니다.'
          : 'Account created! 10% welcome coupon added.',
        'success'
      );
      setLocation('/account');
    } catch (err) {
      setErrorMsg(err.message || '회원가입 실패');
    } finally {
      setFormLoading(false);
    }
  };

  // 4. Password Reset
  const handleSendPasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast(lang === 'ko' ? '이메일 주소를 입력해주세요.' : 'Please enter your email.', 'error');
      return;
    }

    setFormLoading(true);
    try {
      await resetPassword(resetEmail.trim());
      setSuccessMsg(
        lang === 'ko'
          ? '비밀번호 재설정 이메일이 발송되었습니다. 수신함을 확인해주세요.'
          : 'Password reset link sent to your email.'
      );
      showToast(lang === 'ko' ? '재설정 메일이 발송되었습니다.' : 'Reset email sent.', 'success');
      setTimeout(() => {
        setResetModalOpen(false);
        setSuccessMsg('');
      }, 3000);
    } catch (err) {
      showToast(err.message || '이메일 발송 실패', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Quick Demo Filler
  const fillDemoAccount = () => {
    setEmail('customer@noeul.kr');
    setPassword('customer1234!');
    setErrorMsg('');
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 180px)',
        background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 50%, #EBE4D8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Top NOEUL Brand Logo & Tagline */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              marginBottom: '12px',
            }}
          >
            <span
              className="font-serif"
              style={{
                fontSize: '2.25rem',
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: '#18181b',
              }}
            >
              NOEUL
            </span>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-sunset)',
                display: 'inline-block',
              }}
            />
          </Link>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#18181b', letterSpacing: '-0.01em', marginBottom: '6px' }}>
            {mode === 'register' ? 'Create Your Account' : 'Welcome to NOEUL'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
            {mode === 'register'
              ? 'Join NOEUL for exclusive benefits & 10% welcome coupon'
              : 'Sign in to continue to your account'}
          </p>
        </div>

        {/* Premium Centered Login Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(228, 228, 231, 0.8)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Error Banner */}
          {errorMsg && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecdd3',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.8125rem',
                color: '#991b1b',
              }}
            >
              <AlertCircle size={16} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1, lineHeight: 1.4 }}>{errorMsg}</div>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#991b1b' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* 1. Large Professional "Continue with Google" Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || formLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px 20px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e4e4e7',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: '#18181b',
              cursor: googleLoading ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#d4d4d8';
              e.currentTarget.style.backgroundColor = '#fafafa';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e4e4e7';
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {googleLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" color="var(--accent-sunset)" />
                <span>Google 계정 인증 중...</span>
              </>
            ) : (
              <>
                {/* Official Google Color SVG Logo */}
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider "OR" */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '24px 0',
              color: '#a1a1aa',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e4e4e7' }} />
            <span style={{ padding: '0 14px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e4e4e7' }} />
          </div>

          {/* 2. Email & Password Form */}
          {mode === 'login' ? (
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3f3f46' }}>
                  {t('auth.email')}
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="form-input"
                    style={{ paddingLeft: '40px', borderRadius: '10px', height: '44px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3f3f46', marginBottom: 0 }}>
                    {t('auth.password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(true)}
                    style={{
                      fontSize: '0.78125rem',
                      color: 'var(--accent-sunset)',
                      fontWeight: 600,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: '40px', borderRadius: '10px', height: '44px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading || googleLoading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--accent-sunset)',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: formLoading ? 0.7 : 1,
                }}
              >
                {formLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3f3f46' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동 / John Doe"
                    className="form-input"
                    style={{ paddingLeft: '40px', borderRadius: '10px', height: '44px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3f3f46' }}>
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="form-input"
                    style={{ paddingLeft: '40px', borderRadius: '10px', height: '44px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3f3f46' }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6자 이상 입력"
                    className="form-input"
                    style={{ paddingLeft: '40px', borderRadius: '10px', height: '44px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3f3f46' }}>
                  Phone Number (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatKoreanPhone(e.target.value))}
                    placeholder="010-1234-5678"
                    className="form-input"
                    style={{ paddingLeft: '40px', borderRadius: '10px', height: '44px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading || googleLoading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--accent-sunset)',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {formLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle between Sign In and Register */}
          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f4f4f5' }}>
            {mode === 'login' ? (
              <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  style={{
                    color: 'var(--accent-sunset)',
                    fontWeight: 700,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Create account
                </button>
              </p>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  style={{
                    color: 'var(--accent-sunset)',
                    fontWeight: 700,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Demo Account Helper */}
          {mode === 'login' && (
            <div
              style={{
                marginTop: '16px',
                backgroundColor: '#fafafa',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#71717a' }}>Demo Account: customer@noeul.kr</span>
              <button
                type="button"
                onClick={fillDemoAccount}
                style={{ color: 'var(--accent-sunset)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Auto-fill
              </button>
            </div>
          )}
        </div>

        {/* Footer Admin Link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            href="/admin/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              color: '#71717a',
              textDecoration: 'none',
            }}
          >
            <Shield size={14} />
            <span>Store Manager / Admin Login</span>
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {resetModalOpen && (
        <div className="backdrop" onClick={() => setResetModalOpen(false)} style={{ zIndex: 120 }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="var(--accent-sunset)" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#18181b' }}>
                  Reset Your Password
                </h3>
              </div>
              <button onClick={() => setResetModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84375rem', color: '#71717a', marginBottom: '20px', lineHeight: 1.5 }}>
              Enter the email address associated with your NOEUL account, and we will send you a password reset link.
            </p>

            {successMsg ? (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', color: '#166534', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSendPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="btn-primary"
                    style={{ flex: 1, padding: '12px', backgroundColor: 'var(--accent-sunset)' }}
                  >
                    {formLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
