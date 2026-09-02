import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || "AIzaSyDummyKey_NOEUL_KoreanMall_2026",
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || "noeul-fashion-korea.firebaseapp.com",
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || "noeul-fashion-korea",
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || "noeul-fashion-korea.appspot.com",
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || "1002340390276",
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || "1:1002340390276:web:noeulkorea2026"
};

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Saves or updates user document in Firestore under `users/{uid}`
 * Requirement details:
 * - uid, name, email, photoURL, createdAt, lastLogin
 */
export async function syncUserToFirestore(firebaseUser) {
  if (!firebaseUser || !firebaseUser.uid) return;

  const userRef = doc(db, 'users', firebaseUser.uid);

  try {
    const docSnap = await getDoc(userRef);

    const userData = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.name || 'NOEUL Customer',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || '',
      lastLogin: serverTimestamp()
    };

    if (docSnap.exists()) {
      // User exists -> update lastLogin
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
        name: userData.name,
        photoURL: userData.photoURL
      });
    } else {
      // New user -> create user document with createdAt
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.warn('Firestore user sync fallback (network/offline):', error);
  }
}

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateFirebaseProfile
};
