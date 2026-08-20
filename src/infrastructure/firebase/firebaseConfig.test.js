import { describe, expect, it } from 'vitest';

import {
  getFirebaseConfigStatus,
  readEmulatorConfig,
  readFirebaseConfig,
  shouldUseFirebaseEmulators,
} from './firebaseConfig.js';

describe('Firebase configuration contract', () => {
  const configuredEnv = {
    VITE_FIREBASE_API_KEY: 'api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'project.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'noc-report-dev',
    VITE_FIREBASE_APP_ID: 'app-id',
  };

  it('reports missing required client configuration without throwing', () => {
    expect(getFirebaseConfigStatus({})).toEqual({
      configured: false,
      missing: [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_APP_ID',
      ],
    });
  });

  it('normalizes a complete Firebase browser configuration', () => {
    expect(getFirebaseConfigStatus(configuredEnv)).toEqual({ configured: true, missing: [] });
    expect(readFirebaseConfig(configuredEnv)).toEqual({
      apiKey: 'api-key',
      authDomain: 'project.firebaseapp.com',
      projectId: 'noc-report-dev',
      appId: 'app-id',
    });
  });

  it('enables emulators only through the explicit environment flag', () => {
    expect(shouldUseFirebaseEmulators({ VITE_USE_FIREBASE_EMULATORS: 'true' })).toBe(true);
    expect(shouldUseFirebaseEmulators({ VITE_USE_FIREBASE_EMULATORS: 'false' })).toBe(false);
  });

  it('provides bounded emulator defaults', () => {
    expect(readEmulatorConfig({})).toEqual({
      firestoreHost: '127.0.0.1',
      firestorePort: 8080,
      authUrl: 'http://127.0.0.1:9099',
    });
  });
});
