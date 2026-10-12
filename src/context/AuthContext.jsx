import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setCsrfToken } from '../utils/api.js';

const AuthContext = createContext(null);

const STAFF_ROLES = ['super_admin', 'admin'];

// Pure role check (unit-tested): only allowlisted staff roles grant admin UI.
// Never truthy-check role — /me returns 'customer' for non-staff.
export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/me').then(({ user: next, csrf }) => { setUser(next); setAdminUser(next && isStaffRole(next.role) ? next : null); setCsrfToken(csrf); }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const loginWithGoogle = async () => { window.location.assign('/api/v1/auth/google/start'); return null; };
  const adminLogin = async () => { window.location.assign('/api/v1/auth/google/start'); return null; };
  const logout = async () => { try { await api.post('/auth/logout', {}); } finally { setUser(null); setAdminUser(null); } };
  const updateProfile = async data => { const result = await api.patch('/me', data); setUser(result.user); return result.user; };
  const applySession = result => {
    const next = result?.user || null;
    setUser(next);
    setAdminUser(next && isStaffRole(next.role) ? next : null);
    if (result?.csrf) setCsrfToken(result.csrf);
    return next;
  };
  const login = async (email, password) => {
    const result = await api.post('/auth/login', { email, password });
    return applySession(result);
  };
  const register = async data => {
    const result = await api.post('/auth/register', data);
    return applySession(result);
  };
  // Forgot-password: request always succeeds (anti-enumeration); the inbox
  // decides. Confirm exchanges the single-use token for a new password.
  const resetPassword = async email => { await api.post('/auth/request-password-reset', { email }); return true; };
  const confirmPasswordReset = async (token, newPassword) => { await api.post('/auth/reset-password', { token, newPassword }); return true; };
  return <AuthContext.Provider value={{ user, adminUser, loading, isLoggedIn: !!user, isAdmin: !!adminUser?.role, loginWithGoogle, adminLogin, logout, adminLogout: logout, updateProfile, login, register, resetPassword, confirmPasswordReset }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used within AuthProvider'); return value; }
