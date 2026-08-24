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
  '**Current Active Phase:** `T7 — Hardening, Security Validation & Full QA`',
  '**Current Active Phase:** `T8 — Firebase Deployment & MVP Release`',
  'active phase',
);
source = replaceRequired(
  source,
  '**Next Implementation Phase:** `T8 — Firebase Deployment & MVP Release`',
  '**Next Implementation Phase:** `— (T8 is the final planned MVP phase)`',
  'next phase',
);
source = replaceRequired(
  source,
  '- [ ] **T7 — Hardening, Security Validation & Full QA**',
  '- [x] **T7 — Hardening, Security Validation & Full QA**',
  'T7 master checklist',
);

source = updateSection(
  source,
  '# 13. T7 — Hardening, Security Validation & Full QA',
  '# 14. T8 — Firebase Deployment & MVP Release',
  (section) => {
    let next = section.replace(
      '**Status:** IN PROGRESS — automated hardening active; manual QA still required',
      '**Status:** COMPLETE',
    );
    next = next.replaceAll('- [ ]', '- [x]');
    next = next.replace('**Completed:** —', '**Completed:** 2026-08-24');
    next = next.replace(
      '**Commit / PR:** —',
      `**Commit / PR:** \`${commitReference}\` / PR #1 Quality #525`,
    );
    next = next.replace(
      /\*\*Notes:\*\*.*?(?=\n\n---)/s,
      '**Notes:** T7 is complete. Quality #525 validated formatting, lint, unit/component tests, Firebase Emulator integration, Firestore Security Rules, repository/security hygiene, production build, dev-server smoke, real-browser Cut Point QA, full Playwright lifecycle/RBAC/keyboard/accessibility/responsive coverage, and the Locate → Leaflet popup race fix. The project owner explicitly accepted the remaining manual visual/responsive QA on 2026-08-24, including contrast, Generator mobile usability, Running Ticket mobile usability, Cut Point map mobile usability, and desktop information density.',
    );
    return next;
  },
);

source = updateSection(
  source,
  '# 14. T8 — Firebase Deployment & MVP Release',
  '# 15. Phase Dependency Graph',
  (section) => {
    let next = section.replace('**Status:** NOT STARTED', '**Status:** IN PROGRESS — release preparation active');
    next = next.replace('- [ ] current Firebase quotas/pricing rechecked before release.', '- [x] current Firebase quotas/pricing rechecked before release.');
    next = next.replace('- [ ] no Cloud Storage dependency created.', '- [x] no Cloud Storage dependency created.');
    next = next.replace('- [ ] no Blaze-only production dependency accidentally introduced.', '- [x] no Blaze-only production dependency accidentally introduced.');
    next = next.replace('- [ ] production environment values configured safely.', '- [x] production environment values configured safely.');
    next = next.replace('- [ ] SPA Hosting rewrite configured.', '- [x] SPA Hosting rewrite configured.');
    next = next.replace('- [ ] README setup instructions updated.', '- [x] README setup instructions updated.');
    next = next.replace('- [ ] local development instructions updated.', '- [x] local development instructions updated.');
    next = next.replace('- [ ] Firebase emulator instructions updated.', '- [x] Firebase emulator instructions updated.');
    next = next.replace('- [ ] deployment instructions documented.', '- [x] deployment instructions documented.');
    next = next.replace('- [ ] known limitations documented.', '- [x] known limitations documented.');
    return next;
  },
);

await writeFile(workplanPath, source);
