import { doc, onSnapshot } from 'firebase/firestore';

import { normalizeFirebaseError } from './firebaseErrors.js';
import { getFirestoreClient } from './firestoreClient.js';

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
