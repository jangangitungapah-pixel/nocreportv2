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
  '**Current Active Phase:** `T4 — Local OCR & Coordinate Extraction`',
  '**Current Active Phase:** `T5 — Firebase Integration & Operational Data Features`',
  'active phase',
);
source = replaceRequired(
  source,
  '**Next Implementation Phase:** `T5 — Firebase Integration & Operational Data Features`',
  '**Next Implementation Phase:** `T6 — Cut Point Tracker`',
  'next phase',
);
source = replaceRequired(
  source,
  '- [ ] **T4 — Local OCR & Coordinate Extraction**',
  '- [x] **T4 — Local OCR & Coordinate Extraction**',
  'T4 master checklist',
);

source = updateSection(
  source,
  '# 10. T4 — Local OCR & Coordinate Extraction',
  '# 11. T5 — Firebase Integration & Operational Data Features',
  (section) => {
    let next = section.replace('**Status:** NOT STARTED', '**Status:** COMPLETE');
    next = next.replaceAll('- [ ]', '- [x]');
    next = next.replace('**Completed:** —', '**Completed:** 2026-08-21');
    next = next.replace('**Commit / PR:** —', `**Commit / PR:** \`${commitReference}\``);
    next = next.replace(
      '**Notes:** —',
      '**Notes:** Browser-local Cut Point OCR completed with image type/size validation, local preview, lazy Tesseract.js worker execution, temporary in-memory preprocessing, DD/DMS/DDM candidate parsing, ambiguity review, explicit operator verification, editable coordinate fields, OCR-source metadata, and regression tests. No image upload, base64 persistence, Cloud Storage, or Firestore image write is introduced.',
    );
    return next;
  },
);

await writeFile(workplanPath, source);
