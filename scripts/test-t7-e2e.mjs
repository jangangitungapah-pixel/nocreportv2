import { spawnSync } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const env = {
  ...process.env,
  VITE_FIREBASE_API_KEY: 'demo-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo-nocreport.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'demo-nocreport',
  VITE_FIREBASE_APP_ID: '1:123456789:web:t7-e2e',
  VITE_USE_FIREBASE_EMULATORS: 'true',
  VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1',
  VITE_FIRESTORE_EMULATOR_PORT: '8080',
  VITE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099',
};

const command = `${npx} playwright test --config playwright.config.js`;
const result = spawnSync(
  npx,
  [
    '--yes',
    'firebase-tools@15.27.0',
    'emulators:exec',
    '--project',
    'demo-nocreport',
    '--only',
    'auth,firestore',
    command,
  ],
  {
    env,
    stdio: 'inherit',
    shell: false,
  },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
