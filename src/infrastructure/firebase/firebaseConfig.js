const REQUIRED_FIREBASE_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

export function getFirebaseConfigStatus(env = import.meta.env) {
  const missing = REQUIRED_FIREBASE_KEYS.filter((key) => !String(env?.[key] ?? '').trim());
  return {
    configured: missing.length === 0,
    missing,
  };
}

export function readFirebaseConfig(env = import.meta.env) {
  return {
    apiKey: String(env?.VITE_FIREBASE_API_KEY ?? '').trim(),
    authDomain: String(env?.VITE_FIREBASE_AUTH_DOMAIN ?? '').trim(),
    projectId: String(env?.VITE_FIREBASE_PROJECT_ID ?? '').trim(),
    appId: String(env?.VITE_FIREBASE_APP_ID ?? '').trim(),
  };
}

export function shouldUseFirebaseEmulators(env = import.meta.env) {
  return String(env?.VITE_USE_FIREBASE_EMULATORS ?? '').toLowerCase() === 'true';
}

export function readEmulatorConfig(env = import.meta.env) {
  const firestorePort = Number(env?.VITE_FIRESTORE_EMULATOR_PORT ?? 8080);

  return {
    firestoreHost: String(env?.VITE_FIRESTORE_EMULATOR_HOST ?? '127.0.0.1'),
    firestorePort: Number.isInteger(firestorePort) ? firestorePort : 8080,
    authUrl: String(env?.VITE_AUTH_EMULATOR_URL ?? 'http://127.0.0.1:9099'),
  };
}
