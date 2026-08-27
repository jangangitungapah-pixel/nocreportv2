import { readFileSync, writeFileSync } from 'node:fs';

const trackerPath = 'docs/08-post-mvp/TEMPLATE-GENERATOR-VISUAL-OVERHAUL-TRACKER.md';

function replaceRequired(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) {
    throw new Error(`Unable to record ${label}: expected tracker text was not found.`);
  }
  return source.replace(search, replacement);
}

let tracker = readFileSync(trackerPath, 'utf8');
tracker = replaceRequired(
  tracker,
  '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 COMPLETE · GUX-4 COMPLETE · GUX-5 COMPLETE · GUX-6 COMPLETE · GUX-7 IN PROGRESS',
  '**Status:** GUX-0 COMPLETE · GUX-1 COMPLETE · GUX-2 COMPLETE · GUX-3 COMPLETE · GUX-4 COMPLETE · GUX-5 COMPLETE · GUX-6 COMPLETE · GUX-7 IN PROGRESS — AUTOMATED GATES COMPLETE · HUMAN ACCEPTANCE REQUIRED',
  'GUX-7 automated status',
);

const before = `## GUX-7 — Integrated release readiness

- [ ] Prettier + committed-format verifier.
- [ ] ESLint.
- [ ] all unit/component tests.
- [ ] Firebase Emulator repository tests.
- [ ] Firestore Security Rules matrix.
- [ ] dependency/security hygiene.
- [ ] release preflight.
- [ ] generic production build.
- [ ] Firebase-configured production build.
- [ ] responsive/touch browser matrix.
- [ ] Admin lifecycle E2E.
- [ ] Operator/Viewer RBAC E2E.
- [ ] Generator import/draft/revision/keyboard E2E.
- [ ] Light/Dark axe + overflow.
- [ ] human desktop/mobile visual acceptance.
- [ ] PR ready only after explicit acceptance.

`;

const after = `## GUX-7 — Integrated release readiness

- [x] Prettier + committed-format verifier.
- [x] ESLint.
- [x] all unit/component tests.
- [x] Firebase Emulator repository tests.
- [x] Firestore Security Rules matrix.
- [x] dependency/security hygiene.
- [x] release preflight.
- [x] generic production build.
- [x] Firebase-configured production build.
- [x] responsive/touch browser matrix.
- [x] Admin lifecycle E2E.
- [x] Operator/Viewer RBAC E2E.
- [x] Generator import/draft/revision/keyboard E2E.
- [x] Light/Dark axe + overflow.
- [ ] human desktop/mobile visual acceptance.
- [ ] PR ready only after explicit acceptance.

### GUX-7 automated evidence

The integrated release-readiness gate passed repository formatting plus a committed-diff verifier, ESLint, the full unit/component suite, Firebase Emulator repository and Firestore Security Rules matrices, dependency/security hygiene, release preflight, generic and Firebase-configured production builds, dev-server smoke, the canonical T6 viewport/touch browser gate, and the complete authenticated Playwright suite. Runtime Outlook \`.msg\` coverage used the pinned upstream fixture commit and included import replacement decisions, draft recovery, revision history and Generator keyboard Save. Admin lifecycle, Operator/Viewer RBAC, responsive overflow, Light/Dark, serious/critical axe, focus, touch and reduced-motion coverage all remained green. Human desktop/mobile visual acceptance and explicit permission to mark PR #8 ready remain intentionally open.

`;

tracker = replaceRequired(tracker, before, after, 'GUX-7 automated checklist');
writeFileSync(trackerPath, tracker);
console.log('Recorded GUX-7 automated evidence without claiming human visual acceptance.');
