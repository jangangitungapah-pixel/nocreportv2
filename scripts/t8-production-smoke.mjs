const DEFAULT_PRODUCTION_URL = 'https://nocreportv2.web.app';
const REQUEST_TIMEOUT_MS = 15_000;

const routes = ['/', '/login', '/dashboard', '/generator/new', '/running', '/cut-points'];

function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') {
    throw new Error(`Production smoke refused: expected an https URL, received ${url.protocol}`);
  }
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url;
}

async function fetchChecked(url, expectedContentType) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'user-agent': 'nocreportv2-t8-production-smoke/1.0',
      accept: '*/*',
    },
  });

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}.`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (expectedContentType && !contentType.includes(expectedContentType)) {
    throw new Error(`${url} returned unexpected content-type ${contentType || '(missing)'}.`);
  }

  return response;
}

function assertSpaShell(html, url) {
  if (!html.includes('id="root"')) {
    throw new Error(`${url} did not return the expected React SPA root element.`);
  }
  if (!/<script\b[^>]*\bsrc=["'][^"']+["']/i.test(html)) {
    throw new Error(`${url} did not reference a production JavaScript bundle.`);
  }
}

function findSameOriginAssets(html, baseUrl) {
  const assets = new Set();
  const attributePattern = /<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = attributePattern.exec(html)) !== null) {
    const candidate = new URL(match[1], baseUrl);
    if (candidate.origin === baseUrl.origin && candidate.pathname.startsWith('/assets/')) {
      assets.add(candidate.href);
    }
  }

  return [...assets];
}

const baseUrl = normalizeBaseUrl(process.env.T8_PRODUCTION_URL || DEFAULT_PRODUCTION_URL);
console.log(`T8 public production smoke target: ${baseUrl.origin}`);

let rootHtml = '';

for (const route of routes) {
  const url = new URL(route, baseUrl);
  const response = await fetchChecked(url, 'text/html');
  const html = await response.text();
  assertSpaShell(html, url.href);

  if (route === '/') {
    rootHtml = html;
  }

  console.log(`PASS ${route} -> HTTP ${response.status} React SPA shell`);
}

const assets = findSameOriginAssets(rootHtml, baseUrl);
if (assets.length === 0) {
  throw new Error('Production smoke could not discover any same-origin /assets/ bundles from the root HTML.');
}

for (const assetUrl of assets) {
  const response = await fetchChecked(assetUrl);
  console.log(`PASS asset ${new URL(assetUrl).pathname} -> HTTP ${response.status}`);
}

console.log('T8 public production smoke passed.');
console.log('This validates Firebase Hosting reachability, SPA rewrites, and published static assets only.');
console.log('Authenticated Firebase Auth/Firestore/RBAC and full NOC lifecycle smoke still require production-user validation.');
