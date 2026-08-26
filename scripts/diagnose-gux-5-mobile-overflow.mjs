import { readFileSync, writeFileSync } from 'node:fs';

const path = 'e2e/gux-5-mobile.spec.js';
const text = readFileSync(path, 'utf8');
const from = `  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));`;
const to = `  const metrics = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const offenders = Array.from(document.querySelectorAll('body *'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        };
      })
      .filter((item) => item.right > viewport + 1 || item.left < -1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 12);
    return {
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      offenders,
    };
  });`;

if (!text.includes(to)) {
  if (!text.includes(from)) throw new Error('GUX-5 overflow diagnostic marker not found.');
  writeFileSync(path, text.replace(from, to));
}

const assertionFrom = `  expect(metrics.documentWidth, \`${'${label}'} document width\`).toBeLessThanOrEqual(
    metrics.viewport + 1,
  );`;
const assertionTo = `  expect(
    metrics.documentWidth,
    \`${'${label}'} document width; offenders=${'${JSON.stringify(metrics.offenders)}'}\`,
  ).toBeLessThanOrEqual(metrics.viewport + 1);`;

let output = readFileSync(path, 'utf8');
if (!output.includes(assertionTo)) {
  if (!output.includes(assertionFrom)) throw new Error('GUX-5 overflow assertion marker not found.');
  output = output.replace(assertionFrom, assertionTo);
  writeFileSync(path, output);
}
