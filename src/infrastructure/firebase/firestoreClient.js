import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

import { getFirebaseApp } from './firebaseApp.js';
import { readEmulatorConfig, shouldUseFirebaseEmulators } from './firebaseConfig.js';

let firestoreClient = null;
let firestoreEmulatorConnected = false;

export function getFirestoreClient() {
  if (!firestoreClient) {
    firestoreClient = getFirestore(getFirebaseApp());
  }

  if (shouldUseFirebaseEmulators() && !firestoreEmulatorConnected) {
    const emulator = readEmulatorConfig();
    connectFirestoreEmulator(
      firestoreClient,
      emulator.firestoreHost,
      emulator.firestorePort,
    );
    firestoreEmulatorConnected = true;
  }

  return firestoreClient;
}

export function resetFirestoreClientForTests() {
  firestoreClient = null;
  firestoreEmulatorConnected = false;
}
