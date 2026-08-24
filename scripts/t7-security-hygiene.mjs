import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_ROOTS = ['src', 'scripts'];
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.css', '.rules']);
const FORBIDDEN_FILE_PATTERNS = [
  /(^|\/)(service[-_.]?account|serviceAccount).*\.json$/i,
  /\.(pem|p12|pfx|key)$/i,
  /(?:\.bak|\.backup|\.orig|\.rej|~)$/i,
];
const FORBIDDEN_CONTENT = [
  {
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    message: 'private key material must never be committed',
  },
  {
    pattern: /["']private_key["']\s*:/,
    message: 'service-account private_key material must never be committed',
  },
  {
    pattern: /(?:from\s+|import\s*\()['"]firebase\/storage['"]|getStorage\s*\(/,
    message: 'Firebase Storage is outside the Spark-only, no-photo-storage architecture',
  },
  {
    pattern: /dangerouslySetInnerHTML\s*=/,
    message: 'dangerouslySetInnerHTML requires an explicit security review before use',
  },
];
const PRODUCTION_DEBUG_PATTERNS = [
  {
    pattern: /\bconsole\.(?:log|debug)\s*\(/,
    message: 'debug console output is not allowed in production source',
  },
  {
    pattern: /\bdebugger\s*;/,
    message: 'debugger statements are not allowed in production source',
  },
];

const violations = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }

  return files;
}

for (const scanRoot of SCAN_ROOTS) {
  const files = await walk(join(ROOT, scanRoot));
  for (const absolute of files) {
    const path = relative(ROOT, absolute).replaceAll('\\', '/');
    if (FORBIDDEN_FILE_PATTERNS.some((pattern) => pattern.test(path) || pattern.test(basename(path)))) {
      violations.push(`${path}: credential-like or obsolete backup file name is not allowed`);
      continue;
    }

    if (!TEXT_EXTENSIONS.has(extname(path))) continue;
    const content = await readFile(absolute, 'utf8');
    for (const rule of FORBIDDEN_CONTENT) {
      if (rule.pattern.test(content)) violations.push(`${path}: ${rule.message}`);
    }

    if (path.startsWith('src/')) {
      for (const rule of PRODUCTION_DEBUG_PATTERNS) {
        if (rule.pattern.test(content)) violations.push(`${path}: ${rule.message}`);
      }
    }
  }
}

for (const path of ['.env', '.env.local', '.env.production', '.env.development']) {
  try {
    await readFile(join(ROOT, path), 'utf8');
    violations.push(`${path}: real environment files must not be committed`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

if (violations.length) {
  console.error('T7 security hygiene gate failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('T7 security and repository hygiene gate passed.');
