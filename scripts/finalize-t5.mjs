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
  '**Current Active Phase:** `T5 — Firebase Integration & Operational Data Features`',
  '**Current Active Phase:** `T6 — Cut Point Tracker`',
  'active phase',
);
source = replaceRequired(
  source,
  '**Next Implementation Phase:** `T6 — Cut Point Tracker`',
  '**Next Implementation Phase:** `T7 — Hardening, Security Validation & Full QA`',
  'next phase',
);
source = replaceRequired(
  source,
  '- [ ] **T5 — Firebase Integration & Operational Data Features**',
  '- [x] **T5 — Firebase Integration & Operational Data Features**',
  'T5 master checklist',
);

source = updateSection(
  source,
  '# 11. T5 — Firebase Integration & Operational Data Features',
  '# 12. T6 — Cut Point Tracker',
  (section) => {
    let next = section;
    if (!next.includes('**Status:** COMPLETE')) {
      next = next.replace('**Status:** IN PROGRESS', '**Status:** COMPLETE');
      next = next.replace('**Status:** NOT STARTED', '**Status:** COMPLETE');
    }
    next = next.replaceAll('- [ ]', '- [x]');
    next = next.replace('**Completed:** —', '**Completed:** 2026-08-21');
    next = next.replace('**Commit / PR:** —', `**Commit / PR:** \`${commitReference}\``);
    next = next.replace(
      '**Notes:** —',
      '**Notes:** Firebase Auth/Firestore adapters, bounded operational queries, optimistic revision guards, transactional progress and coordinate persistence, audit events, operational Dashboard/Running Ticket integration, archive/restore contracts, indexes, and a Firebase Auth + Firestore Emulator integration gate are validated. Emulator tests use a demo project ID and never target production Firebase. Spark suitability review confirms no unbounded operational reads, no Cloud Storage, no Cloud Functions, and no per-keystroke persistence.',
    );
    return next;
  },
);

await writeFile(workplanPath, source);
