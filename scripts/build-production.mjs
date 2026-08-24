import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

function parseEnv(source) {
  const values = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return values;
}

const publicEnvironment = parseEnv(await readFile('.env.example', 'utf8'));

if (publicEnvironment.VITE_FIREBASE_PROJECT_ID !== 'nocreportv2') {
  throw new Error('Production build refused: VITE_FIREBASE_PROJECT_ID must be nocreportv2.');
}

if (publicEnvironment.VITE_USE_FIREBASE_EMULATORS !== 'false') {
  throw new Error('Production build refused: Firebase emulators must be disabled.');
}

for (const key of [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]) {
  if (!publicEnvironment[key]) {
    throw new Error(`Production build refused: ${key} is missing from .env.example.`);
  }
}

// Do not spawn `npm.cmd` on Windows. Node 24 can reject direct .cmd execution
// through child_process.spawn() with EINVAL unless a shell is involved. Running
// Vite's JavaScript CLI with the current Node executable is shell-free and works
// consistently on Windows, macOS, and Linux.
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const child = spawn(process.execPath, [viteCli, 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ...publicEnvironment,
    VITE_USE_FIREBASE_EMULATORS: 'false',
  },
});

child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Production build terminated by signal ${signal}.`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
