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
  const googleOnly = () => { throw new Error('NOEUL uses Google sign-in only.'); };
  return <AuthContext.Provider value={{ user, adminUser, loading, isLoggedIn: !!user, isAdmin: !!adminUser?.role, loginWithGoogle, adminLogin, logout, adminLogout: logout, updateProfile, login: googleOnly, register: googleOnly, resetPassword: googleOnly }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used within AuthProvider'); return value; }
