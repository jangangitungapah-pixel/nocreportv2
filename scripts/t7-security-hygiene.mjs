import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
  '.firebase',
]);
const TEXT_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.html',
  '.css',
  '.rules',
  '.md',
  '.yml',
  '.yaml',
]);
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs']);
const UI_SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.css']);
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
    pattern: /["']type["']\s*:\s*["']service_account["']/,
    message: 'Google service-account credential documents must never be committed',
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
const LEGACY_UI_PATTERNS = [
  {
    pattern: /\bUiIcon\b/,
    message: 'legacy UiIcon is forbidden; use the canonical AppIcon adapter',
  },
  {
    pattern: /\bspatial-panel-elevated\b/,
    message: 'obsolete elevated/hero panel treatment is forbidden on production UI surfaces',
  },
  {
    pattern: /hover:-translate-y/,
    message: 'routine hover translate movement conflicts with stable dense-workstation geometry',
  },
  {
    pattern: /<select(?:\s|>)/i,
    message: 'visible native select controls are forbidden; use the canonical product selector layer',
  },
  {
    pattern: /!important/,
    message: 'legacy CSS !important overrides are forbidden in production UI source',
  },
  {
    pattern: /path:\s*['"]\/generator\/:ticketId['"]/,
    message: 'compatibility /generator/:ticketId route must not be reintroduced',
  },
  {
    pattern: /function\s+TicketRoutePage\b/,
    message: 'legacy TicketRoutePage permission delegator must not be reintroduced',
  },
];

const violations = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      files.push(...(await walk(absolute)));
    } else {
      files.push(absolute);
    }
  }

  return files;
}

function repositoryPath(absolute) {
  return relative(ROOT, absolute).replaceAll('\\', '/');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const allFiles = await walk(ROOT);
const textFileContents = new Map();

for (const absolute of allFiles) {
  const path = repositoryPath(absolute);
  if (
    FORBIDDEN_FILE_PATTERNS.some((pattern) => pattern.test(path) || pattern.test(basename(path)))
  ) {
    violations.push(`${path}: credential-like or obsolete backup file name is not allowed`);
    continue;
  }

  if (!TEXT_EXTENSIONS.has(extname(path))) continue;
  const content = await readFile(absolute, 'utf8');
  textFileContents.set(path, content);

  for (const rule of FORBIDDEN_CONTENT) {
    if (rule.pattern.test(content)) violations.push(`${path}: ${rule.message}`);
  }

  if (path.startsWith('src/')) {
    for (const rule of PRODUCTION_DEBUG_PATTERNS) {
      if (rule.pattern.test(content)) violations.push(`${path}: ${rule.message}`);
    }

    if (UI_SOURCE_EXTENSIONS.has(extname(path)) && !/\.test\.[cm]?[jt]sx?$/.test(path)) {
      for (const rule of LEGACY_UI_PATTERNS) {
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

const packageJson = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
const productionSource = [...textFileContents.entries()]
  .filter(([path]) => path.startsWith('src/') && SOURCE_EXTENSIONS.has(extname(path)))
  .map(([, content]) => content)
  .join('\n');

for (const dependency of Object.keys(packageJson.dependencies ?? {})) {
  const dependencyPattern = new RegExp(`['"]${escapeRegExp(dependency)}(?:/[^'"]*)?['"]`);
  if (!dependencyPattern.test(productionSource)) {
    violations.push(
      `${dependency}: production dependency is declared but not referenced by application source`,
    );
  }
}

const fixturePaths = allFiles
  .map(repositoryPath)
  .filter(
    (path) =>
      /(^|\/)(?:fixtures?|test-data)\//i.test(path) ||
      (/^(?:tests?|e2e)\//.test(path) && /\.(?:png|jpe?g|webp|gif|txt|json)$/i.test(path)),
  );
const testAndQaSource = [...textFileContents.entries()]
  .filter(
    ([path]) =>
      /(?:\.test\.[cm]?[jt]sx?$|\.spec\.[cm]?[jt]sx?$)/.test(path) ||
      path.startsWith('e2e/') ||
      /scripts\/(?:test|t6|t7|record)-/.test(path),
  )
  .map(([, content]) => content)
  .join('\n');

for (const fixturePath of fixturePaths) {
  const fixtureName = basename(fixturePath);
  if (!testAndQaSource.includes(fixturePath) && !testAndQaSource.includes(fixtureName)) {
    violations.push(
      `${fixturePath}: committed test fixture/test-data file has no test or QA reference`,
    );
  }
}

if (violations.length) {
  console.error('T7 security and repository hygiene gate failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  `T7 security and repository hygiene gate passed (${Object.keys(packageJson.dependencies ?? {}).length} production dependencies referenced; ${fixturePaths.length} committed fixture/test-data files accounted for; legacy UI guard clean).`,
);
