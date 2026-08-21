import { getApps, initializeApp } from 'firebase/app';

import { getFirebaseConfigStatus, readFirebaseConfig } from './firebaseConfig.js';
import { createInfrastructureError } from './firebaseErrors.js';

let firebaseApp = null;

export function getFirebaseApp() {
  if (firebaseApp) {
    return firebaseApp;
  }

  const status = getFirebaseConfigStatus();
  if (!status.configured) {
    throw createInfrastructureError(
      'FIREBASE_NOT_CONFIGURED',
      `Firebase configuration is incomplete: ${status.missing.join(', ')}`,
      { details: { missing: status.missing } },
    );
  }

  firebaseApp = getApps()[0] ?? initializeApp(readFirebaseConfig());
  return firebaseApp;
}

export function resetFirebaseAppForTests() {
  firebaseApp = null;
}
