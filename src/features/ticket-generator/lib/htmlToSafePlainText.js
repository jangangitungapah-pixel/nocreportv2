import { normalizeOperationalText } from './operationalNormalization.js';

function fallbackStripHtml(value) {
  return String(value ?? '')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*(?:p|div|li|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<\s*(?:script|style|noscript)[^>]*>[\s\S]*?<\s*\/\s*(?:script|style|noscript)\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function htmlToSafePlainText(value) {
  const html = String(value ?? '');
  if (!html.trim()) return '';

  let text;
  const DomParser = globalThis.DOMParser;
  if (typeof DomParser !== 'undefined') {
    const document = new DomParser().parseFromString(html, 'text/html');
    document.querySelectorAll('script, style, noscript').forEach((node) => node.remove());
    document.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
    document.querySelectorAll('p, div, li, tr, h1, h2, h3, h4, h5, h6').forEach((node) => {
      node.append('\n');
    });
    text = document.body?.textContent ?? '';
  } else {
    text = fallbackStripHtml(html);
  }

  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => normalizeOperationalText(line))
    .filter(Boolean)
    .join('\n');
}
