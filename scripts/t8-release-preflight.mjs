import { readFile } from 'node:fs/promises';

const EXPECTED_PROJECT = 'nocreportv2';

function fail(message) {
  throw new Error(`T8 release preflight failed: ${message}`);
}

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

const [firebaseRcSource, firebaseJsonSource, envSource, packageSource] = await Promise.all([
  readFile('.firebaserc', 'utf8'),
  readFile('firebase.json', 'utf8'),
  readFile('.env.example', 'utf8'),
  readFile('package.json', 'utf8'),
]);

const firebaseRc = JSON.parse(firebaseRcSource);
const firebaseJson = JSON.parse(firebaseJsonSource);
const env = parseEnv(envSource);
const packageJson = JSON.parse(packageSource);

if (firebaseRc.projects?.default !== EXPECTED_PROJECT) {
  fail(`.firebaserc default project must be ${EXPECTED_PROJECT}.`);
}

if (env.VITE_FIREBASE_PROJECT_ID !== EXPECTED_PROJECT) {
  fail(`VITE_FIREBASE_PROJECT_ID must be ${EXPECTED_PROJECT}.`);
}

for (const key of [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]) {
  if (!env[key]) fail(`${key} is missing from the public production environment contract.`);
}

if (env.VITE_USE_FIREBASE_EMULATORS !== 'false') {
  fail('VITE_USE_FIREBASE_EMULATORS must be false for the production environment contract.');
}

if (firebaseJson.storage || firebaseJson.functions) {
  fail('Cloud Storage/Functions must not be present in the Spark-compatible Firebase config.');
}

if (packageSource.includes('cloud-run') || packageSource.includes('@google-cloud/run')) {
  fail('Cloud Run dependencies are not allowed in the Spark-compatible MVP release path.');
}

if (firebaseJson.firestore?.rules !== 'firestore.rules') {
  fail('firebase.json must deploy firestore.rules.');
}

if (firebaseJson.firestore?.indexes !== 'firestore.indexes.json') {
  fail('firebase.json must deploy firestore.indexes.json.');
}

if (firebaseJson.hosting?.public !== 'dist') {
  fail('Firebase Hosting public directory must be dist.');
}

const spaRewrite = firebaseJson.hosting?.rewrites?.some(
  (rewrite) => rewrite.source === '**' && rewrite.destination === '/index.html',
);
if (!spaRewrite) fail('Firebase Hosting SPA rewrite to /index.html is missing.');

for (const scriptName of [
  'build:production',
  'firebase:deploy:hosting',
  'firebase:deploy:release',
]) {
  if (!packageJson.scripts?.[scriptName]) fail(`package.json script ${scriptName} is missing.`);
}

console.log(
  `T8 release preflight passed for Firebase project ${EXPECTED_PROJECT}: public production config present, emulators disabled, Firestore rules/indexes configured, SPA Hosting rewrite present, and no Storage/Functions/Cloud Run release dependency detected.`,
);
