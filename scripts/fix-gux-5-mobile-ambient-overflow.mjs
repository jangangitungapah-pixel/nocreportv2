import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/styles/app.css';
const text = readFileSync(path, 'utf8');
const from = `    .generator-cockpit::before {
      right: -28%;
      width: 82vw;
      height: 12rem;
      opacity: 0.72;
    }`;
const to = `    .generator-cockpit::before {
      right: 0;
      width: min(72vw, 22rem);
      height: 12rem;
      opacity: 0.72;
    }`;

if (!text.includes(to)) {
  if (!text.includes(from)) throw new Error('GUX-5 ambient overflow marker not found.');
  writeFileSync(path, text.replace(from, to));
}
