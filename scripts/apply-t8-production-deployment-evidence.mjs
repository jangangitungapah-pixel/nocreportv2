import { readFile, writeFile } from 'node:fs/promises';

const trackerPath = 'docs/06-workplan/IMPLEMENTATION-WORKPLAN.md';
const evidencePath = 'docs/07-release/PRODUCTION-DEPLOYMENT-EVIDENCE.md';

const evidence = await readFile(evidencePath, 'utf8');

for (const requiredEvidence of [
  '**Project:** `nocreportv2`',
  'the Firebase deployment completed successfully and Firebase Hosting is live',
  'Firestore Security Rules were deployed as part of the full release command',
  'Firestore indexes were deployed as part of the full release command',
  'Quality #548 completed successfully',
]) {
  if (!evidence.includes(requiredEvidence)) {
    throw new Error(`T8 deployment evidence refused: missing evidence marker: ${requiredEvidence}`);
  }
}

let tracker = await readFile(trackerPath, 'utf8');

function markExact(oldText, newText) {
  if (tracker.includes(newText)) return;
  if (!tracker.includes(oldText)) {
    throw new Error(`T8 tracker update refused: expected text not found: ${oldText}`);
  }
  tracker = tracker.replace(oldText, newText);
}

markExact(
  '**Status:** IN PROGRESS — release preparation active',
  '**Status:** IN PROGRESS — production deployed; authenticated smoke pending',
);
markExact(
  '- [ ] production Firebase project confirmed.',
  '- [x] production Firebase project confirmed.',
);
markExact(
  '- [ ] Firestore production database configured.',
  '- [x] Firestore production database configured.',
);
markExact('- [ ] Firebase Hosting configured.', '- [x] Firebase Hosting configured.');
markExact('- [ ] Firestore indexes deployed.', '- [x] Firestore indexes deployed.');
markExact('- [ ] Firestore Security Rules deployed.', '- [x] Firestore Security Rules deployed.');
markExact('- [ ] Hosting deployment succeeds.', '- [x] Hosting deployment succeeds.');
markExact('- [ ] CI green for release commit.', '- [x] CI green for release commit.');
markExact('- [ ] production build green.', '- [x] production build green.');
markExact(
  '- [ ] no Critical/High known security issue.',
  '- [x] no Critical/High known security issue.',
);
markExact(
  '**Notes:** —',
  '**Notes:** Production Firebase deployment and Hosting were confirmed successful by the project owner on 2026-08-24. Firestore Rules/indexes and Hosting deployment are recorded as complete; Quality #548 is green. Spark-plan/Auth-provider verification and authenticated production workflow/RBAC smoke remain open before T8 can be completed.',
);

await writeFile(trackerPath, tracker);
console.log('T8 production deployment evidence applied to the canonical tracker.');
