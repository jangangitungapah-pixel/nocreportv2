import { readFile, writeFile } from 'node:fs/promises';

const workplanPath = 'docs/06-workplan/IMPLEMENTATION-WORKPLAN.md';
const architecturePath = 'docs/02-architecture/TECHNICAL-ARCHITECTURE-TDD.md';

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    if (source.includes(replacement)) {
      return source;
    }

    throw new Error(`Unable to update ${label}: expected text was not found.`);
  }

  return source.replace(search, replacement);
}

function updateSection(source, startHeading, endHeading, transform) {
  const start = source.indexOf(startHeading);
  const end = source.indexOf(endHeading, start + startHeading.length);

  if (start === -1 || end === -1) {
    throw new Error(`Unable to locate tracker section ${startHeading}.`);
  }

  const before = source.slice(0, start);
  const section = source.slice(start, end);
  const after = source.slice(end);

  return `${before}${transform(section)}${after}`;
}

async function updateArchitectureBaseline() {
  let source = await readFile(architecturePath, 'utf8');

  source = replaceRequired(
    source,
    '| Routing | React Router 8.x in client SPA/declarative mode |',
    '| Routing | React Router 7.x stable in client SPA/declarative mode |',
    'React Router baseline',
  );

  source = replaceRequired(
    source,
    '**Version:** 0.1',
    '**Version:** 0.2',
    'architecture document version',
  );

  await writeFile(architecturePath, source);
}

async function updateWorkplan() {
  let source = await readFile(workplanPath, 'utf8');
  const foundationCommit = process.env.GITHUB_SHA ?? 'feature/t0-repository-foundation';

  source = replaceRequired(
    source,
    '`docs/05-security/SECURITY-ACCESS-CONTROL-PRD.md` once created',
    '`docs/05-security/SECURITY-ACCESS-CONTROL-PRD.md`',
    'security PRD reference',
  );
  source = replaceRequired(
    source,
    '**Overall status:** DOCUMENTATION BASELINE IN PROGRESS',
    '**Overall status:** IMPLEMENTATION IN PROGRESS',
    'overall project status',
  );
  source = replaceRequired(
    source,
    '**Current Active Phase:** `D0 — Documentation Baseline Completion`',
    '**Current Active Phase:** `T1 — Domain Foundation`',
    'active phase',
  );
  source = replaceRequired(
    source,
    '**Next Implementation Phase:** `T0 — Repository Foundation`',
    '**Next Implementation Phase:** `T2 — UI Shell & Design System Foundation`',
    'next phase',
  );
  source = replaceRequired(
    source,
    '- [ ] Security & Access Control PRD',
    '- [x] Security & Access Control PRD',
    'security PRD checklist',
  );
  source = replaceRequired(
    source,
    'D0 remains incomplete until the Security & Access Control PRD is finished and cross-document conflicts have been reviewed.',
    'D0 is complete. Cross-document review resolved the React Router baseline to the current stable 7.x line and confirmed the Spark-only/no-photo-storage architecture.',
    'D0 status note',
  );
  source = replaceRequired(
    source,
    '- [ ] **D0 — Documentation Baseline Completion**',
    '- [x] **D0 — Documentation Baseline Completion**',
    'D0 master checklist',
  );
  source = replaceRequired(
    source,
    '- [ ] **T0 — Repository Foundation**',
    '- [x] **T0 — Repository Foundation**',
    'T0 master checklist',
  );

  source = updateSection(
    source,
    '# 5. D0 — Documentation Baseline Completion',
    '# 6. T0 — Repository Foundation',
    (section) => {
      let next = section.replace('**Status:** IN PROGRESS', '**Status:** COMPLETE');
      next = next.replaceAll('- [ ]', '- [x]');
      next = next.replace('**Completed:** —', '**Completed:** 2026-08-21');
      next = next.replace(
        '**Commit / PR:** —',
        '**Commit / PR:** `6543b9cd92d8f43a8521c107ab970868b4878e4f` + T0 foundation branch',
      );
      next = next.replace(
        '**Notes:** Security & Access Control PRD remains pending.',
        '**Notes:** Security PRD completed. Cross-review confirmed Spark-compatible MVP, no Cloud Storage dependency, browser-local Cut Point photos, coordinate-only persistence, and corrected React Router baseline to stable 7.x.',
      );
      return next;
    },
  );

  source = updateSection(
    source,
    '# 6. T0 — Repository Foundation',
    '# 7. T1 — Domain Foundation',
    (section) => {
      let next = section.replace('**Status:** NOT STARTED', '**Status:** COMPLETE');
      next = next.replaceAll('- [ ]', '- [x]');
      next = next.replace('**Completed:** —', '**Completed:** 2026-08-21');
      next = next.replace('**Commit / PR:** —', `**Commit / PR:** \`${foundationCommit}\``);
      next = next.replace(
        '**Notes:** —',
        '**Notes:** React/Vite foundation, pinned runtime/dependencies, Tailwind, ESLint, Prettier, Vitest/RTL, environment contract, vertical source directories, generated package lock, dev-server smoke check, and GitHub Actions quality gate completed.',
      );
      return next;
    },
  );

  source = replaceRequired(
    source,
    '**Version:** 0.1',
    '**Version:** 0.2',
    'workplan document version',
  );

  await writeFile(workplanPath, source);
}

await updateArchitectureBaseline();
await updateWorkplan();
