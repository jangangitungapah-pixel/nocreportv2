import { spawnSync } from 'node:child_process';

const npxExecutable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npxExecutable,
  [
    '--yes',
    'firebase-tools@15.27.0',
    'emulators:exec',
    '--project',
    'demo-nocreport',
    '--only',
    'auth,firestore',
    'node scripts/run-firebase-emulator-vitest.mjs',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: process.env.CI ?? 'true',
    },
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
