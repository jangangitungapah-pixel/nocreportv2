import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/styles/app.css';
const text = readFileSync(path, 'utf8');
const from = `    .generator-command-actions > * {
      min-height: 44px;
      flex: 0 0 auto;
      scroll-snap-align: start;
    }`;
const to = `    .generator-command-actions > * {
      height: 44px;
      min-height: 44px;
      flex: 0 0 auto;
      scroll-snap-align: start;
    }

    .generator-command-actions > :is(button, a) {
      height: 44px !important;
      min-height: 44px !important;
    }`;

if (!text.includes(to)) {
  if (!text.includes(from)) throw new Error('GUX-5 command touch target marker not found.');
  writeFileSync(path, text.replace(from, to));
}
