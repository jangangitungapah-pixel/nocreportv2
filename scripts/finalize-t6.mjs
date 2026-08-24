import { readFile, writeFile } from 'node:fs/promises';

const workplanPath = 'docs/06-workplan/IMPLEMENTATION-WORKPLAN.md';

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    if (source.includes(replacement)) return source;
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
  '**Current Active Phase:** `T6 — Cut Point Tracker`',
  '**Current Active Phase:** `T7 — Hardening, Security Validation & Full QA`',
  'active phase',
);
source = replaceRequired(
  source,
  '**Next Implementation Phase:** `T7 — Hardening, Security Validation & Full QA`',
  '**Next Implementation Phase:** `T8 — Firebase Deployment & MVP Release`',
  'next phase',
);
source = replaceRequired(
  source,
  '- [ ] **T6 — Cut Point Tracker**',
  '- [x] **T6 — Cut Point Tracker**',
  'T6 master checklist',
);

source = updateSection(
  source,
  '# 12. T6 — Cut Point Tracker',
  '# 13. T7 — Hardening, Security Validation & Full QA',
  (section) => {
    let next = section.replace('**Status:** IN PROGRESS', '**Status:** COMPLETE');
    next = next.replaceAll('- [ ]', '- [x]');
    next = next.replace('**Completed:** —', '**Completed:** 2026-08-21');
    next = next.replace(
      '**Commit / PR:** —',
      `**Commit / PR:** \`${commitReference}\` / PR #1 Quality #505`,
    );
    next = next.replace(
      /\*\*Notes:\*\*.*?(?=\n\n---)/s,
      '**Notes:** Cut Point Tracker implementation is complete. Automated Chrome QA validates 360×800, 390×844, 412×915, and 1280×900 viewports with no page-level horizontal overflow, desktop map dominance, OpenStreetMap attribution, and real touch interaction through marker popup and Open Ticket. Manual mobile and desktop visual map QA were explicitly accepted by the project owner on 2026-08-21 for the current release state.',
    );
    return next;
  },
);

await writeFile(workplanPath, source);
