import { readFile, writeFile } from 'node:fs/promises';

const trackerPath = 'docs/06-workplan/IMPLEMENTATION-WORKPLAN.md';

function replaceRequired(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) {
    throw new Error(`Unable to record ${label}: expected tracker text was not found.`);
  }
  return source.replace(search, replacement);
}

function updateSection(source, startHeading, endHeading, transform) {
  const start = source.indexOf(startHeading);
  const end = source.indexOf(endHeading, start + startHeading.length);
  if (start === -1 || end === -1) throw new Error(`Unable to locate ${startHeading}.`);
  return `${source.slice(0, start)}${transform(source.slice(start, end))}${source.slice(end)}`;
}

let tracker = await readFile(trackerPath, 'utf8');
tracker = updateSection(
  tracker,
  '# 13. T7 — Hardening, Security Validation & Full QA',
  '# 14. T8 — Firebase Deployment & MVP Release',
  (section) => {
    let next = section.replace(
      '**Status:** NOT STARTED',
      '**Status:** IN PROGRESS — automated hardening active; manual QA still required',
    );

    const completedItems = [
      'Firebase Authentication production flow.',
      'Admin role behavior.',
      'Operator role behavior.',
      'Viewer role behavior.',
      'protected routes.',
      'permission-aware UI actions.',
      'rules match Security PRD.',
      'unauthenticated access denied.',
      'Viewer write attempts denied.',
      'Operator allowed mutations verified.',
      'Admin-only mutations verified.',
      'rules validate important field invariants where practical.',
      'rules tests run with Firebase Emulator.',
      'no service-account key in repository.',
      'no secret in Vite client environment beyond public Firebase client config.',
      'no hidden reliance on UI-only authorization.',
      'error messages do not leak unnecessary internal details.',
      'photo/OCR pipeline remains local.',
      'Login.',
      'create Draft Ticket.',
      'populate incident details.',
      'mark Running.',
      'append progress.',
      'reload and confirm persistence.',
      'OCR fixture coordinate flow.',
      'manual coordinate correction.',
      'Copy Report.',
      'Running Ticket search/open.',
      'Cut Point marker/open Ticket.',
      'Resolve Ticket.',
      'permission restrictions by role.',
      'automated axe checks on primary routes.',
      'keyboard-only primary workflow QA.',
      'focus management for dialogs/sheets.',
      'accessible form errors.',
      'no status conveyed by color alone.',
      '~360px mobile.',
      '~390/412px mobile.',
      '~768px tablet.',
      '~1024px small desktop/tablet landscape.',
      '>=1280px desktop.',
      'no unintended horizontal page overflow.',
      'save failure retains form data.',
      'network error has recovery path.',
      'stale revision does not silently overwrite newer Ticket.',
      'duplicate progress timestamps remain deterministic.',
      'cross-midnight incidents render correctly.',
      'invalid coordinates never become markers.',
      'empty Impact List never renders.',
      'OCR failure does not block manual coordinate input.',
      'Dashboard initial bundle does not eagerly include OCR worker.',
      'Cut Point map can be route-lazy-loaded.',
      'large historical ticket data is paginated.',
      'excessive Firestore listeners removed.',
      'Firestore reads/writes reviewed.',
      'no obsolete backup files.',
      'no dead test fixtures without purpose.',
      'no debug logging left in production path.',
      'no unused major dependency.',
      'documentation matches final implementation.',
      'lint passes.',
      'format check passes.',
      'unit tests pass.',
      'component tests pass.',
      'integration tests pass.',
      'security rules tests pass.',
      'Playwright E2E passes.',
      'production build passes.',
      'accessibility QA passes.',
    ];

    for (const item of completedItems) {
      next = replaceRequired(next, `- [ ] ${item}`, `- [x] ${item}`, `T7 item: ${item}`);
    }

    const notes =
      '**Notes:** Automated T7 hardening is green through the latest validated PR Quality run: Firebase Auth/RBAC, Firestore Security Rules role matrix, normalized public Firebase errors, save/network recovery that preserves operator input and allows retry, dependency/fixture repository hygiene, bounded Firestore access with only the lifecycle-managed authenticated profile listener, full Playwright MVP workflow, keyboard/dialog focus checks, accessible form-error associations, readable status labels, axe serious/critical checks, responsive overflow coverage at 360/390/412/768/1024/1280 px, and README documentation aligned with the implemented MVP. Manual/subjective items such as visual contrast review, route usability, desktop information density, and manual responsive acceptance remain intentionally open until a human visual pass is recorded.';

    next = next.replace(/\*\*Notes:\*\*.*?(?=\n\n---)/s, notes);
    return next;
  },
);

await writeFile(trackerPath, tracker, 'utf8');
console.log('Recorded T7 automated QA evidence without claiming manual QA completion.');
