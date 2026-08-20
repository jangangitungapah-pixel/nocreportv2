import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import {
  getAuthClient,
  getFirebaseConfigStatus,
  getFirestoreClient,
  normalizeFirebaseError,
} from '../../infrastructure/firebase/index.js';

const AuthContext = createContext(null);

async function loadUserProfile(uid) {
  const snapshot = await getDoc(doc(getFirestoreClient(), 'users', uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export function AuthProvider({ children }) {
  const firebaseConfigured = getFirebaseConfigStatus().configured;
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return undefined;
    }

    const auth = getAuthClient();
    return onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setError(null);
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setProfile(await loadUserProfile(nextUser.uid));
      } catch (profileError) {
        setProfile(null);
        setError(normalizeFirebaseError(profileError, 'PERMISSION_DENIED'));
      } finally {
        setLoading(false);
      }
    });
  }, [firebaseConfigured]);

  const value = useMemo(
    () => ({
      firebaseConfigured,
      localDevelopmentMode: !firebaseConfigured,
      user,
      profile,
      loading,
      error,
      isAuthenticated: !firebaseConfigured || Boolean(user && profile?.active),
      role: profile?.role ?? (!firebaseConfigured ? 'LOCAL_DEV' : null),
      async signIn(email, password) {
        if (!firebaseConfigured) return null;
        try {
          setError(null);
          return await signInWithEmailAndPassword(getAuthClient(), email, password);
        } catch (signInError) {
          const normalized = normalizeFirebaseError(signInError, 'AUTH_FAILED');
          setError(normalized);
          throw normalized;
        }
      },
      async signOut() {
        if (!firebaseConfigured) return;
        await firebaseSignOut(getAuthClient());
      },
    }),
    [error, firebaseConfigured, loading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
