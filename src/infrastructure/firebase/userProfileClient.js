import { doc, onSnapshot, setDoc } from 'firebase/firestore';

import { normalizeFirebaseError } from './firebaseErrors.js';
import { getFirestoreClient } from './firestoreClient.js';

export const BOOTSTRAP_ADMIN_UID = 'gEmUAqisGwU78iVSk3jIEH49uF13';

export function isBootstrapAdminUid(uid) {
  return uid === BOOTSTRAP_ADMIN_UID;
}

export async function ensureBootstrapAdminProfile(uid) {
  if (!isBootstrapAdminUid(uid)) {
    throw new Error('Bootstrap admin provisioning is not allowed for this Firebase uid.');
  }

  await setDoc(doc(getFirestoreClient(), 'users', uid), {
    active: true,
    role: 'ADMIN',
  });
}

export function watchUserProfile(uid, { onProfile, onError }) {
  if (!uid) {
    throw new Error('watchUserProfile requires a Firebase uid.');
  }

  const profileRef = doc(getFirestoreClient(), 'users', uid);
  return onSnapshot(
    profileRef,
    (snapshot) => {
      onProfile(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    },
    (error) => {
      onError(normalizeFirebaseError(error, 'PERMISSION_DENIED'));
    },
  );
}
