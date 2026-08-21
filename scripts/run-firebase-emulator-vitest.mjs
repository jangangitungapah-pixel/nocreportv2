import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const vitestEntry = resolve('node_modules/vitest/vitest.mjs');
const testEnvironment = {
  ...process.env,
  VITE_FIREBASE_EMULATOR_TESTS: 'true',
  VITE_USE_FIREBASE_EMULATORS: 'true',
  VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1',
  VITE_FIRESTORE_EMULATOR_PORT: '8080',
  VITE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099',
  VITE_FIREBASE_API_KEY: 'demo-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo-nocreport.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'demo-nocreport',
  VITE_FIREBASE_APP_ID: '1:123456789:web:demo-nocreport',
};

const emulatorTestFiles = [
  'src/infrastructure/firebase/firestoreTicketRepository.emulator.test.js',
  'src/infrastructure/firebase/firestoreSecurityRules.emulator.test.js',
];

for (const testFile of emulatorTestFiles) {
  const result = spawnSync(process.execPath, [vitestEntry, 'run', testFile], {
    stdio: 'inherit',
    env: testEnvironment,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}
