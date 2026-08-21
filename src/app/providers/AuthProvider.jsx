import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { hasCapability as roleHasCapability, isOperationalRole } from '../../entities/user/authorization.js';
import {
  createInfrastructureError,
  getAuthClient,
  getFirebaseConfigStatus,
  normalizeFirebaseError,
  watchUserProfile,
} from '../../infrastructure/firebase/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const firebaseConfigured = getFirebaseConfigStatus().configured;
  const localDevelopmentMode = !firebaseConfigured;
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
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = null;
      setLoading(true);
      setError(null);
      setUser(nextUser);
      setProfile(null);

      if (!nextUser) {
        setLoading(false);
        return;
      }

      unsubscribeProfile = watchUserProfile(nextUser.uid, {
        onProfile(nextProfile) {
          if (!nextProfile?.active) {
            setProfile(null);
            setError(
              createInfrastructureError(
                'ACCOUNT_DISABLED',
                'The authenticated account does not have an active application profile.',
              ),
            );
            setLoading(false);
            return;
          }

          if (!isOperationalRole(nextProfile.role)) {
            setProfile(null);
            setError(
              createInfrastructureError(
                'PERMISSION_DENIED',
                'The application profile does not contain an approved operational role.',
              ),
            );
            setLoading(false);
            return;
          }

          setProfile(nextProfile);
          setError(null);
          setLoading(false);
        },
        onError(profileError) {
          setProfile(null);
          setError(normalizeFirebaseError(profileError, 'PERMISSION_DENIED'));
          setLoading(false);
        },
      });
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, [firebaseConfigured]);

  const role = profile?.role ?? (localDevelopmentMode ? 'LOCAL_DEV' : null);

  const value = useMemo(
    () => ({
      firebaseConfigured,
      localDevelopmentMode,
      user,
      profile,
      loading,
      error,
      isAuthenticated: localDevelopmentMode || Boolean(user && profile?.active && isOperationalRole(role)),
      role,
      can(capability) {
        return roleHasCapability(role, capability, { localDevelopmentMode });
      },
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
        setProfile(null);
        setUser(null);
        setError(null);
        if (!firebaseConfigured) return;
        await firebaseSignOut(getAuthClient());
      },
    }),
    [error, firebaseConfigured, loading, localDevelopmentMode, profile, role, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
