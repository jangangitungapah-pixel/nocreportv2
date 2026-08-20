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
  '**Current Active Phase:** `T3 — Template Generator Core`',
  '**Current Active Phase:** `T4 — Local OCR & Coordinate Extraction`',
  'active phase',
);
source = replaceRequired(
  source,
  '**Next Implementation Phase:** `T4 — Local OCR & Coordinate Extraction`',
  '**Next Implementation Phase:** `T5 — Firebase Integration & Operational Data Features`',
  'next phase',
);
source = replaceRequired(
  source,
  '- [ ] **T3 — Template Generator Core**',
  '- [x] **T3 — Template Generator Core**',
  'T3 master checklist',
);

source = updateSection(
  source,
  '# 9. T3 — Template Generator Core',
  '# 10. T4 — Local OCR & Coordinate Extraction',
  (section) => {
    let next = section.replace('**Status:** NOT STARTED', '**Status:** COMPLETE');
    next = next.replaceAll('- [ ]', '- [x]');
    next = next.replace('**Completed:** —', '**Completed:** 2026-08-21');
    next = next.replace('**Commit / PR:** —', `**Commit / PR:** \`${commitReference}\``);
    next = next.replace(
      '**Notes:** —',
      '**Notes:** Local Generator workflow completed with React Hook Form, optional Impact List editing/reorder, incident fields, manual coordinate validation, editable multi-day Progress Timeline, lifecycle validation, unsaved-navigation protection, local-session Save state, canonical live report preview, Clipboard copy feedback, and integration tests. No Firebase writes or OCR are introduced in this phase.',
    );
    return next;
  },
);

await writeFile(workplanPath, source);
