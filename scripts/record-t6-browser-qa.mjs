import { readFile, writeFile } from 'node:fs/promises';

const trackerPath = 'docs/06-workplan/IMPLEMENTATION-WORKPLAN.md';
const evidenceItems = [
  [
    '- [ ] usable marker interaction on touch devices.',
    '- [x] usable marker interaction on touch devices.',
  ],
  [
    '- [ ] no page-level horizontal overflow.',
    '- [x] no page-level horizontal overflow.',
  ],
];

let tracker = await readFile(trackerPath, 'utf8');
let changed = false;

for (const [pending, complete] of evidenceItems) {
  if (tracker.includes(complete)) continue;
  if (!tracker.includes(pending)) {
    throw new Error(`T6 browser QA tracker item is missing: ${pending}`);
  }
  tracker = tracker.replace(pending, complete);
  changed = true;
}

if (changed) {
  await writeFile(trackerPath, tracker, 'utf8');
  console.log('Recorded validated T6 real-browser touch and overflow evidence.');
} else {
  console.log('T6 real-browser evidence is already recorded.');
}
