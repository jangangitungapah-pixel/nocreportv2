import { readFileSync, writeFileSync } from 'node:fs';

const path = 'e2e/gux-5-mobile.spec.js';
let text = readFileSync(path, 'utf8');

const startMarker = 'async function assertNoHorizontalOverflow(page, label) {';
const endMarker = '\nasync function assertTouchTargets';
const start = text.indexOf(startMarker);
const end = start >= 0 ? text.indexOf(endMarker, start) : -1;

if (start < 0 || end < 0) {
  throw new Error('GUX-5 overflow diagnostic function boundary not found.');
}

const replacement = `async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => {
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
  });

  expect(
    metrics.documentWidth,
    \`\${label} document width; offenders=\${JSON.stringify(metrics.offenders)}\`,
  ).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(
    metrics.bodyWidth,
    \`\${label} body width; offenders=\${JSON.stringify(metrics.offenders)}\`,
  ).toBeLessThanOrEqual(metrics.viewport + 1);
}`;

text = text.slice(0, start) + replacement + text.slice(end);
writeFileSync(path, text);
