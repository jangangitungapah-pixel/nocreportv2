import { connectAuthEmulator, getAuth } from 'firebase/auth';

import { getFirebaseApp } from './firebaseApp.js';
import { readEmulatorConfig, shouldUseFirebaseEmulators } from './firebaseConfig.js';

let authClient = null;
let authEmulatorConnected = false;

export function getAuthClient() {
  if (!authClient) {
    authClient = getAuth(getFirebaseApp());
  }

  if (shouldUseFirebaseEmulators() && !authEmulatorConnected) {
    const emulator = readEmulatorConfig();
    connectAuthEmulator(authClient, emulator.authUrl, { disableWarnings: true });
    authEmulatorConnected = true;
  }

  return authClient;
}

export function resetAuthClientForTests() {
  authClient = null;
  authEmulatorConnected = false;
}
