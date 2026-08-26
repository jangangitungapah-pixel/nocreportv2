import { readFileSync, writeFileSync } from 'node:fs';

const path = 'e2e/gux-5-mobile.spec.js';
const text = readFileSync(path, 'utf8');
const from = 'position: getComputedStyle(element).position';
const to = 'position: window.getComputedStyle(element).position';

if (!text.includes(to)) {
  if (!text.includes(from)) throw new Error('GUX-5 lint marker not found.');
  writeFileSync(path, text.replace(from, to));
}
