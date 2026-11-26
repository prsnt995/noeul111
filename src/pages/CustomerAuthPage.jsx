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

const FRIENDLY_AUTH_ERRORS = {
  GOOGLE_ACCOUNT_USE_GOOGLE: 'This email uses Google login — please Continue with Google above.',
  ADMIN_USE_GOOGLE: 'Staff accounts must use Continue with Google above.',
  ACCOUNT_EXISTS_USE_GOOGLE: 'This email is already registered with Google — please Sign In, or use Continue with Google.',
  ACCOUNT_EXISTS_USE_PASSWORD: 'This email is registered with email + password — please Sign In below.',
  ACCOUNT_EXISTS: 'This email is already registered. Please sign in.',
  INVALID_CREDENTIALS: 'Email or password is incorrect. Please try again.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  NAME_REQUIRED: 'Please enter your name.',
  OTP_INVALID: 'The verification code is incorrect. Please try again.',
  OTP_EXPIRED: 'The verification code has expired. Please request a new one.',
  OTP_TOO_MANY_ATTEMPTS: 'Too many incorrect attempts. Please request a new code.',
  OTP_COOLDOWN: 'Please wait before requesting another code.',
  OTP_SEND_LIMIT: 'Too many codes requested. Please try again later.',
  EMAIL_SEND_FAILED: 'We could not send the verification email. Please try again.',
  PENDING_EMAIL_SIGNUP: 'This email has a pending verification. Verify it or cancel to use Google.',
  GOOGLE_EMAIL_REQUIRED: 'Google did not return an email address.',
  GOOGLE_EMAIL_UNVERIFIED: 'Your Google email is not verified.',
  ACCOUNT_DISABLED: 'This account is disabled.',
  CHECK_EMAIL_UNAVAILABLE: 'Could not check the email. Please try again.',
};

function friendlyAuthError(err) {
  const code = String(err?.message || err || '').trim();
  if (FRIENDLY_AUTH_ERRORS[code]) return FRIENDLY_AUTH_ERRORS[code];
  return code || 'Something went wrong. Please try again.';
}

export function CustomerAuthPage() {
  const { isLoggedIn, loginWithGoogle, login, register, verifyRegister, checkEmail, resendRegisterOtp, cancelRegister, resetPassword } = useAuth();
  const { t } = useLanguage();
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

  // OTP signup step
  const [registerStep, setRegisterStep] = useState('form'); // 'form' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // {available, method}

  useEffect(() => {
    if (isLoggedIn) {
      setLocation('/account');
    }
  }, [isLoggedIn, setLocation]);

  // OTP resend countdown
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get('error');
      if (code && FRIENDLY_AUTH_ERRORS[code]) {
        setErrorMsg(FRIENDLY_AUTH_ERRORS[code]);
        window.history.replaceState(null, '', '/auth');
      }
    } catch { /* non-browser / malformed URL — ignore */ }
  }, []);

  // 1. Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        showToast(
          `환영합니다, ${user.name || user.full_name || '고객'}님! Google 로그인 완료.`,
          'success'
        );
        setLocation('/account');
      }
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
      setErrorMsg('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setErrorMsg('');
    setFormLoading(true);

    try {
      await login(email.trim(), password);
      showToast('로그인되었습니다. 환영합니다!', 'success');
      setLocation('/account');
    } catch (err) {
      setErrorMsg(friendlyAuthError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !name.trim()) {
      setErrorMsg('이름, 이메일, 비밀번호는 필수 입력 항목입니다.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('비밀번호는 8자리 이상이어야 합니다.');
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
      setOtpEmail(email.trim());
      setOtpCode('');
      setOtpCountdown(60);
      setRegisterStep('otp');
    } catch (err) {
      setErrorMsg(friendlyAuthError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('6자리 인증번호를 입력해주세요.');
      return;
    }
    setErrorMsg('');
    setFormLoading(true);
    try {
      await verifyRegister(otpEmail, otpCode.trim());
      showToast('회원가입이 완료되었습니다.', 'success');
      setLocation('/account');
    } catch (err) {
      setErrorMsg(friendlyAuthError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    setErrorMsg('');
    setFormLoading(true);
    try {
      await resendRegisterOtp(otpEmail);
      setOtpCountdown(60);
      showToast('인증번호가 재발송되었습니다.', 'success');
    } catch (err) {
      setErrorMsg(friendlyAuthError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelOtp = async () => {
    try { await cancelRegister(otpEmail, otpCode); } catch { /* best effort */ }
    setRegisterStep('form');
    setOtpCode('');
    setErrorMsg('');
  };

  const handleEmailBlur = async () => {
    const v = email.trim();
    if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return;
    setCheckingEmail(true);
    try {
      const result = await checkEmail(v);
      setEmailStatus(result || null);
    } catch (err) {
      setEmailStatus(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  // 4. Password Reset
  const handleSendPasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('이메일 주소를 입력해주세요.', 'error');
      return;
    }

    setFormLoading(true);
    try {
      await resetPassword(resetEmail.trim());
      setSuccessMsg('비밀번호 재설정 이메일이 발송되었습니다. 수신함을 확인해주세요.');
      showToast('재설정 메일이 발송되었습니다.', 'success');
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
              ? 'Join NOEUL for exclusive member benefits'
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
            <>
              {registerStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#18181b', marginBottom: '6px' }}>이메일 인증</p>
                  <p style={{ fontSize: '0.8125rem', color: '#71717a', lineHeight: 1.5 }}>
                    <strong>{otpEmail}</strong> 로 6자리 인증번호를 보냈습니다.
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3f3f46' }}>
                    인증번호 (6자리)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="form-input"
                      style={{ paddingLeft: '40px', borderRadius: '10px', height: '44px', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading || googleLoading || otpCode.length !== 6}
                  className="btn-primary"
                  style={{
                    width: '100%', padding: '14px', borderRadius: '10px', fontSize: '0.9375rem', fontWeight: 700,
                    backgroundColor: 'var(--accent-sunset)', marginTop: '8px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px', opacity: formLoading ? 0.7 : 1,
                  }}
                >
                  {formLoading ? (<><Loader2 size={16} className="animate-spin" /><span>인증 중...</span></>) : (<> <span>인증하고 가입 완료</span> <ArrowRight size={16} /> </>)}
                </button>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={formLoading || otpCountdown > 0}
                    style={{ background: 'none', border: 'none', cursor: otpCountdown > 0 ? 'not-allowed' : 'pointer', fontSize: '0.8125rem', color: 'var(--accent-sunset)', fontWeight: 600, opacity: otpCountdown > 0 ? 0.5 : 1 }}
                  >
                    {otpCountdown > 0 ? `재발송 (${otpCountdown}s)` : '인증번호 재발송'}
                  </button>
                  <span style={{ color: '#d4d4d8' }}>|</span>
                  <button
                    type="button"
                    onClick={handleCancelOtp}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: '#71717a', fontWeight: 600 }}
                  >
                    이메일 변경
                  </button>
                </div>
              </form>
              )}
              {registerStep !== 'otp' && (
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
                    onBlur={handleEmailBlur}
                    placeholder="name@example.com"
                    className="form-input"
                    style={{ paddingLeft: '40px', borderRadius: '10px', height: '44px' }}
                  />
                </div>
              </div>

              {checkingEmail ? (
                <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: '0' }}>이메일 확인 중...</p>
              ) : emailStatus && !emailStatus.available ? (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '10px 12px', fontSize: '0.8125rem', color: '#991b1b' }}>
                  {emailStatus.method === 'google' ? (
                    <>
                      이 이메일은 Google 계정으로 가입되어 있습니다.{' '}
                      <button type="button" onClick={handleGoogleSignIn} style={{ background: 'none', border: 'none', color: 'var(--accent-sunset)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                        Continue with Google
                      </button>
                    </>
                  ) : emailStatus.method === 'password' ? (
                    <>이 이메일은 이미 가입되어 있습니다.{' '}<button type="button" onClick={() => { setMode('login'); setEmail(email.trim()); setErrorMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-sunset)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>로그인하기</button></>
                  ) : emailStatus.method === 'pending' ? (
                    <>이미 인증번호가 발송되었습니다.{' '}<button type="button" onClick={() => { setOtpEmail(email.trim()); setRegisterStep('otp'); setOtpCountdown(0); }} style={{ background: 'none', border: 'none', color: 'var(--accent-sunset)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>인증 계속하기</button></>
                  ) : (
                    '이미 가입된 이메일입니다.'
                  )}
                </div>
              ) : null}

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
                    placeholder="8자 이상 입력"
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
            </>
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
                    setRegisterStep('form');
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
                    setRegisterStep('form');
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
              <br />
              <span style={{ fontSize: '0.78125rem' }}>Google로 가입하셨다면 재설정 없이 위의 Continue with Google 버튼을 이용해주세요.</span>
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
