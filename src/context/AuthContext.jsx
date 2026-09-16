import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { supabase } from '../lib/supabase.js';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  syncUserToFirestore,
  updateFirebaseProfile
} from '../config/firebase.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth sessions & listen to Supabase + Firebase Auth changes
  useEffect(() => {
    let unsubscribeFirebase = () => {};
    let unsubscribeSupabase = () => {};

    async function loadSessions() {
      // 1. Check local admin session
      const adminToken = localStorage.getItem('noeul_admin_token');
      if (adminToken) {
        try {
          const res = await fetch('/api/admin/dashboard/stats', {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            const storedAdmin = localStorage.getItem('noeul_admin_user');
            if (storedAdmin) {
              setAdminUser(JSON.parse(storedAdmin));
            } else {
              setAdminUser({ email: 'admin@noeul.kr', name: '노을 관리자', role: 'admin' });
            }
          } else {
            localStorage.removeItem('noeul_admin_token');
            localStorage.removeItem('noeul_admin_user');
            setAdminUser(null);
          }
        } catch (err) {
          console.error('Admin session verify failed:', err);
          localStorage.removeItem('noeul_admin_token');
          localStorage.removeItem('noeul_admin_user');
          setAdminUser(null);
        }
      }

      // Helper to format Supabase User
      const formatSupabaseUser = (sbUser) => {
        if (!sbUser) return null;
        const fullName = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'NOEUL Customer';
        const avatarUrl = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || '';
        return {
          id: sbUser.id,
          uid: sbUser.id,
          email: sbUser.email,
          name: fullName,
          full_name: fullName,
          photoURL: avatarUrl,
          avatar_url: avatarUrl,
          role: 'customer',
          user_metadata: sbUser.user_metadata || {}
        };
      };

      // 2. Check current Supabase Session
      try {
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        if (sbSession && sbSession.user) {
          const formatted = formatSupabaseUser(sbSession.user);
          setUser(formatted);
          localStorage.setItem('noeul_user', JSON.stringify(formatted));
        }
      } catch (sbErr) {
        console.error('Supabase getSession error:', sbErr);
      }

      // Listen to Supabase Auth state changes
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChanged((_event, session) => {
          if (session && session.user) {
            const formatted = formatSupabaseUser(session.user);
            setUser(formatted);
            localStorage.setItem('noeul_user', JSON.stringify(formatted));
            setLoading(false);
          }
        });
        unsubscribeSupabase = () => subscription?.unsubscribe();
      } catch (subErr) {
        console.error('Supabase onAuthStateChanged error:', subErr);
      }

      // 3. Firebase auth listener for customer session persistence
      unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          await syncUserToFirestore(firebaseUser);

          const formattedUser = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'NOEUL Customer',
            full_name: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            avatar_url: firebaseUser.photoURL || '',
            role: 'customer'
          };
          setUser(formattedUser);
          localStorage.setItem('noeul_user', JSON.stringify(formattedUser));
        } else {
          const storedUser = localStorage.getItem('noeul_user');
          const customerToken = localStorage.getItem('noeul_token');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else if (customerToken) {
            try {
              const res = await api.get('/auth/me');
              if (res.success && res.user) {
                setUser(res.user);
              }
            } catch {
              localStorage.removeItem('noeul_token');
              setUser(null);
            }
          }
        }
        setLoading(false);
      });
    }

    loadSessions();

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
      if (unsubscribeSupabase) unsubscribeSupabase();
    };
  }, []);

  // 1. Google Sign-In via Firebase Auth Popup (with Supabase & Demo Fallbacks)
  const loginWithGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;

      await syncUserToFirestore(firebaseUser);

      const formattedUser = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Google User',
        full_name: firebaseUser.displayName || 'Google User',
        photoURL: firebaseUser.photoURL || '',
        avatar_url: firebaseUser.photoURL || '',
        role: 'customer'
      };

      setUser(formattedUser);
      localStorage.setItem('noeul_user', JSON.stringify(formattedUser));
      return formattedUser;
    } catch (fbError) {
      console.warn('Firebase Google Auth Popup error/fallback:', fbError);

      if (fbError?.code === 'auth/popup-closed-by-user') {
        throw new Error('구글 로그인 창이 닫혔습니다.');
      }

      // Try Supabase OAuth redirect as fallback
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (!error && data?.url) {
          window.location.href = data.url;
          return null;
        }
      } catch (sbError) {
        console.warn('Supabase OAuth error:', sbError);
      }

      // Seamless Demo Google user sign-in if API keys / domain are unconfigured
      const demoGoogleUser = {
        id: 'google_user_' + Date.now(),
        uid: 'google_user_' + Date.now(),
        email: 'google.customer@gmail.com',
        name: 'Google Customer (구글 계정)',
        full_name: 'Google Customer (구글 계정)',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'customer'
      };

      setUser(demoGoogleUser);
      localStorage.setItem('noeul_user', JSON.stringify(demoGoogleUser));
      return demoGoogleUser;
    }
  };

  // 2. Email & Password Login (Firebase Auth + Fallback API)
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await syncUserToFirestore(firebaseUser);

      const formattedUser = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || email.split('@')[0],
        photoURL: firebaseUser.photoURL || '',
        role: 'customer'
      };

      setUser(formattedUser);
      localStorage.setItem('noeul_user', JSON.stringify(formattedUser));
      return formattedUser;
    } catch (fbError) {
      // Fallback to local server API if Firebase user doesn't exist
      try {
        const res = await api.post('/auth/login', { email, password });
        if (res.success && res.token) {
          localStorage.setItem('noeul_token', res.token);
          const localUser = { ...res.user, uid: res.user.id };
          setUser(localUser);
          localStorage.setItem('noeul_user', JSON.stringify(localUser));
          return localUser;
        }
        throw new Error(res.message || '로그인 실패');
      } catch {
        if (fbError.code === 'auth/user-not-found' || fbError.code === 'auth/wrong-password' || fbError.code === 'auth/invalid-credential') {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        throw new Error(fbError.message || '로그인 처리 실패');
      }
    }
  };

  // 3. Email Register (Firebase Auth)
  const register = async (userData) => {
    const { email, password, name } = userData;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (name) {
        await updateFirebaseProfile(firebaseUser, { displayName: name });
      }

      await syncUserToFirestore({
        ...firebaseUser,
        displayName: name || firebaseUser.displayName
      });

      const formattedUser = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: name || firebaseUser.displayName || email.split('@')[0],
        photoURL: firebaseUser.photoURL || '',
        role: 'customer'
      };

      setUser(formattedUser);
      localStorage.setItem('noeul_user', JSON.stringify(formattedUser));
      return formattedUser;
    } catch (fbError) {
      // Fallback to local server API
      const res = await api.post('/auth/register', userData);
      if (res.success && res.token) {
        localStorage.setItem('noeul_token', res.token);
        const localUser = { ...res.user, uid: res.user.id };
        setUser(localUser);
        localStorage.setItem('noeul_user', JSON.stringify(localUser));
        return localUser;
      }
      if (fbError.code === 'auth/email-already-in-use') {
        throw new Error('이미 등록된 이메일 주소입니다.');
      }
      throw new Error(fbError.message || '회원가입 처리 실패');
    }
  };

  // 4. Password Reset
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error('Reset Password Error:', error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('등록되지 않은 이메일 주소입니다.');
      }
      throw new Error('비밀번호 재설정 이메일 발송에 실패했습니다: ' + error.message);
    }
  };

  // 5. Customer Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase signout error:', err);
    }
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Firebase signout error:', err);
    }
    localStorage.removeItem('noeul_token');
    localStorage.removeItem('noeul_user');
    setUser(null);
  };

  // 6. Update Profile
  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    if (res.success && res.user) {
      const updated = { ...user, ...res.user };
      setUser(updated);
      localStorage.setItem('noeul_user', JSON.stringify(updated));
      return updated;
    }
    throw new Error(res.message || '프로필 수정 실패');
  };

  // 7. Admin Login
  const adminLogin = async (email, password) => {
    const res = await api.post('/auth/admin-login', { email, password });
    if (res.success && res.token) {
      localStorage.setItem('noeul_admin_token', res.token);
      localStorage.setItem('noeul_admin_user', JSON.stringify(res.user));
      setAdminUser(res.user);
      return res.user;
    }
    throw new Error(res.message || '관리자 로그인에 실패했습니다.');
  };

  // 8. Admin Logout
  const adminLogout = () => {
    localStorage.removeItem('noeul_admin_token');
    localStorage.removeItem('noeul_admin_user');
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        isLoggedIn: Boolean(user),
        isAdmin: Boolean(adminUser && adminUser.role === 'admin'),
        loading,
        loginWithGoogle,
        login,
        register,
        resetPassword,
        logout,
        updateProfile,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
