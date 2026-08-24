import { readFile, writeFile } from 'node:fs/promises';

const workplanPath = 'docs/06-workplan/IMPLEMENTATION-WORKPLAN.md';
const evidencePath = 'docs/07-release/AUTHENTICATED-PRODUCTION-SMOKE-EVIDENCE.md';
const productionUrl = 'https://nocreportv2.web.app';

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

let evidence;
try {
  evidence = await readFile(evidencePath, 'utf8');
} catch (error) {
  if (error?.code === 'ENOENT') {
    throw new Error(
      `T8 finalization refused: ${evidencePath} does not exist. Complete authenticated production smoke first.`,
      { cause: error },
    );
  }
  throw error;
}

for (const marker of [
  '**Project:** `nocreportv2`',
  `**Production URL:** \`${productionUrl}\``,
  '**Result:** PASS',
  '- [x] Admin production lifecycle accepted.',
  '- [x] deployed-browser OCR and coordinate persistence accepted.',
  '- [x] Running Tickets and Cut Point Tracker accepted.',
  '- [x] Resolve lifecycle accepted.',
  '- [x] production RBAC allow/deny behavior accepted.',
  '- [x] no Critical/High production blocker observed.',
  '- [x] Spark plan/account billing state confirmed.',
  '- [x] required Firebase Authentication provider confirmed.',
]) {
  if (!evidence.includes(marker)) {
    throw new Error(`T8 finalization refused: missing authenticated-smoke evidence marker: ${marker}`);
  }
}

const dateMatch = evidence.match(/\*\*Date:\*\* (\d{4}-\d{2}-\d{2})/);
if (!dateMatch) {
  throw new Error('T8 finalization refused: evidence must contain **Date:** YYYY-MM-DD.');
}

const releaseDate = dateMatch[1];
const commitReference = process.env.GITHUB_SHA ?? 'feature/t0-repository-foundation';
let source = await readFile(workplanPath, 'utf8');

source = replaceRequired(
  source,
  '**Overall status:** IMPLEMENTATION IN PROGRESS',
  '**Overall status:** MVP RELEASED',
  'overall project status',
);
source = replaceRequired(
  source,
  '**Current Active Phase:** `T8 — Firebase Deployment & MVP Release`',
  '**Current Active Phase:** `— MVP COMPLETE`',
  'active phase',
);
source = replaceRequired(
  source,
  '- [ ] **T8 — Firebase Deployment & MVP Release**',
  '- [x] **T8 — Firebase Deployment & MVP Release**',
  'T8 master checklist',
);

source = updateSection(
  source,
  '# 14. T8 — Firebase Deployment & MVP Release',
  '# 15. Phase Dependency Graph',
  (section) => {
    let next = section.replace(
      /\*\*Status:\*\* IN PROGRESS[^\n]*/,
      '**Status:** COMPLETE',
    );
    next = next.replaceAll('- [ ]', '- [x]');
    next = next.replace('**Completed:** —', `**Completed:** ${releaseDate}`);
    next = next.replace(
      '**Commit / PR:** —',
      `**Commit / PR:** \`${commitReference}\` / PR #1`,
    );
    next = next.replace('**Production URL:** —', `**Production URL:** \`${productionUrl}\``);
    next = next.replace(
      /\*\*Notes:\*\*.*?(?=\n\n---)/s,
      '**Notes:** T8 complete. Firebase Hosting, Firestore Security Rules, and indexes were deployed to project `nocreportv2`; the public Hosting/SPA smoke passed on 2026-08-24; authenticated production acceptance subsequently validated login, Dashboard/Firestore access, Ticket create/save, Running, Progress persistence, deployed-browser OCR, verified coordinate persistence, Running Tickets, Cut Point Tracker, Copy Report, Resolve, and the production Viewer/Operator/Admin authorization matrix. No Critical/High production blocker remained at release acceptance.',
    );
    return next;
  },
);

await writeFile(workplanPath, source);
console.log(`T8 finalized as COMPLETE for ${productionUrl} using authenticated production evidence.`);
