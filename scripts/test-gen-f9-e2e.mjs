import { spawnSync } from 'node:child_process';
import process from 'node:process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const expectedPath = process.env.GEN_F9_MSG_EXPECTED;

if (!expectedPath) {
  throw new Error('GEN_F9_MSG_EXPECTED must point to runtime fixture metadata for GEN-F9 E2E.');
}

const env = {
  ...process.env,
  GEN_F9_MSG_EXPECTED: expectedPath,
  VITE_FIREBASE_API_KEY: 'demo-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo-nocreport.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'demo-nocreport',
  VITE_FIREBASE_APP_ID: '1:123456789:web:f9-e2e',
  VITE_USE_FIREBASE_EMULATORS: 'true',
  VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1',
  VITE_FIRESTORE_EMULATOR_PORT: '8080',
  VITE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099',
};

const playwrightCommand = `${npx} playwright test e2e/gen-f9-generator.spec.js --config playwright.config.js`;
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
    playwrightCommand,
  ],
  {
    env,
    stdio: 'inherit',
    shell: false,
  },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
