import { readFile, writeFile } from 'node:fs/promises';

const workplanPath = 'docs/06-workplan/IMPLEMENTATION-WORKPLAN.md';

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

  return `${source.slice(0, start)}${transform(source.slice(start, end))}${source.slice(end)}`;
}

let source = await readFile(workplanPath, 'utf8');
const commitReference = process.env.GITHUB_SHA ?? 'feature/t0-repository-foundation';

source = replaceRequired(
  source,
  '**Current Active Phase:** `T2 — UI Shell & Design System Foundation`',
  '**Current Active Phase:** `T3 — Template Generator Core`',
  'active phase',
);
source = replaceRequired(
  source,
  '**Next Implementation Phase:** `T3 — Template Generator Core`',
  '**Next Implementation Phase:** `T4 — Local OCR & Coordinate Extraction`',
  'next phase',
);
source = replaceRequired(
  source,
  '- [ ] **T2 — UI Shell & Design System Foundation**',
  '- [x] **T2 — UI Shell & Design System Foundation**',
  'T2 master checklist',
);

source = updateSection(
  source,
  '# 8. T2 — UI Shell & Design System Foundation',
  '# 9. T3 — Template Generator Core',
  (section) => {
    let next = section.replace('**Status:** NOT STARTED', '**Status:** COMPLETE');
    next = next.replaceAll('- [ ]', '- [x]');
    next = next.replace('**Completed:** —', '**Completed:** 2026-08-21');
    next = next.replace('**Commit / PR:** —', `**Commit / PR:** \`${commitReference}\``);
    next = next.replace(
      '**Notes:** —',
      '**Notes:** Responsive operations shell, complete route map, protected-route boundary, persistent semantic light/dark theme, desktop sidebar, mobile top/bottom navigation, shared accessible UI primitives, feedback/dialog foundations, responsive overflow protection, and component tests completed.',
    );
    return next;
  },
);

await writeFile(workplanPath, source);
