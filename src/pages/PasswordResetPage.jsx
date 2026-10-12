import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Lock, Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

function friendlyResetError(err) {
  const code = String(err?.message || err || '').trim();
  if (code === 'PASSWORD_TOO_SHORT') return 'Password must be at least 8 characters.';
  if (code === 'RESET_TOKEN_INVALID') return 'This reset link is invalid or has expired. Please request a new one from /auth.';
  return code || 'Reset failed. Please try again.';
}

export function PasswordResetPage() {
  const { confirmPasswordReset, logout } = useAuth();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();
  const token = (() => {
    try { return new URLSearchParams(window.location.search).get('token') || ''; }
    catch { return ''; }
  })();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(token ? '' : 'Reset link is missing. Please request a new one from the login page.');
  const [done, setDone] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (password.length < 8) { setErrorMsg('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setErrorMsg('Passwords do not match.'); return; }
    setErrorMsg('');
    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      // The backend revokes ALL sessions on reset, so any logged-in state
      // (this browser included) is dead. Clear it now instead of leaving a
      // stale /account behind; logout() clears state even when its revoke
      // call 401s on the already-dead session.
      try { await logout(); } catch { /* state is already cleared */ }
      setDone(true);
      showToast('Password updated. Please sign in.', 'success');
      setTimeout(() => setLocation('/auth'), 2500);
    } catch (err) {
      setErrorMsg(friendlyResetError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 180px)', background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 50%, #EBE4D8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#fff', borderRadius: '20px', padding: '36px 32px', boxShadow: '0 20px 50px rgba(0,0,0,0.06)', border: '1px solid rgba(228,228,231,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <KeyRound size={20} color="var(--accent-sunset)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#18181b' }}>Set a new password</h2>
        </div>
        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', display: 'flex', gap: '10px', fontSize: '0.8125rem', color: '#991b1b' }}>
            <AlertCircle size={16} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
        {done ? (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', color: '#166534', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>Password updated — taking you to sign in…</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>New password (8+ characters)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="form-input" style={{ paddingLeft: '40px', borderRadius: '10px', height: '44px' }} />
              </div>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Confirm new password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '14px' }} />
                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className="form-input" style={{ paddingLeft: '40px', borderRadius: '10px', height: '44px' }} />
              </div>
            </div>
            <button type="submit" disabled={loading || !token} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '10px', fontWeight: 700, backgroundColor: 'var(--accent-sunset)', opacity: loading ? 0.7 : 1 }}>
              {loading ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Loader2 size={16} className="animate-spin" /> Updating…</span>) : 'Update password'}
            </button>
          </form>
        )}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: '#71717a' }}>
          <Link href="/auth" style={{ color: 'var(--accent-sunset)', fontWeight: 700 }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default PasswordResetPage;
