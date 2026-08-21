/* global fetch, WebSocket */

import { execFileSync, spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { clearTimeout, setTimeout as scheduleTimeout } from 'node:timers';
import { setTimeout as sleep } from 'node:timers/promises';

const APP_ORIGIN = 'http://127.0.0.1:5173';
const DEBUG_PORT = 9222;
const WAIT_INTERVAL_MS = 100;
const WAIT_TIMEOUT_MS = 20_000;
const OVERALL_TIMEOUT_MS = 90_000;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      // Try the next known executable name.
    }
  }

  throw new Error('Chrome/Chromium executable was not found on the runner.');
}

async function waitFor(check, description, timeoutMs = WAIT_TIMEOUT_MS) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const result = await check();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await sleep(WAIT_INTERVAL_MS);
  }

  throw new Error(
    `${description} did not become ready within ${timeoutMs}ms${
      lastError ? `: ${lastError.message}` : ''
    }`,
  );
}

async function waitForHttp(url) {
  return waitFor(async () => {
    const response = await fetch(url);
    return response.ok;
  }, `HTTP endpoint ${url}`);
}

class CdpSession {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();

    socket.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data);
      if (!payload.id) return;
      const pending = this.pending.get(payload.id);
      if (!pending) return;
      this.pending.delete(payload.id);
      if (payload.error) pending.reject(new Error(payload.error.message));
      else pending.resolve(payload.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function connectToChrome() {
  const targets = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
    if (!response.ok) return null;
    const items = await response.json();
    return items.find((item) => item.type === 'page') ? items : null;
  }, 'Chrome DevTools target');

  const pageTarget = targets.find((item) => item.type === 'page');
  const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  const session = new CdpSession(socket);
  await session.send('Page.enable');
  await session.send('Runtime.enable');
  return session;
}

async function evaluate(session, expression) {
  const result = await session.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed.');
  }

  return result.result?.value;
}

async function setViewport(session, width, height) {
  await session.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
}

async function navigate(session, url, readyExpression) {
  await session.send('Page.navigate', { url });
  await waitFor(
    () =>
      evaluate(
        session,
        `document.readyState === 'complete' && Boolean(${readyExpression})`,
      ),
    `page ${url}`,
  );
}

async function assertNoHorizontalOverflow(session, label) {
  const metrics = await evaluate(
    session,
    `(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth
    }))()`,
  );

  assert(
    metrics.documentWidth <= metrics.viewport + 1 && metrics.bodyWidth <= metrics.viewport + 1,
    `${label} overflowed horizontally: viewport=${metrics.viewport}, document=${metrics.documentWidth}, body=${metrics.bodyWidth}`,
  );
}

async function runApplicationViewportQa(session, width, height) {
  await setViewport(session, width, height);
  await navigate(
    session,
    `${APP_ORIGIN}/cut-points`,
    `document.querySelector('[aria-label="Cut Point map"]') && document.body.textContent.includes('Cut Point Tracker')`,
  );

  await assertNoHorizontalOverflow(session, `/cut-points at ${width}px`);

  const layout = await evaluate(
    session,
    `(() => {
      const mapHost = document.querySelector('[aria-label="Cut Point map"]');
      const mapSection = mapHost?.parentElement;
      const workspace = mapSection?.parentElement;
      const listPanel = workspace?.firstElementChild;
      const attribution = document.querySelector('.leaflet-control-attribution');
      return {
        mapWidth: mapSection?.getBoundingClientRect().width ?? 0,
        mapHeight: mapSection?.getBoundingClientRect().height ?? 0,
        panelWidth: listPanel?.getBoundingClientRect().width ?? 0,
        workspaceWidth: workspace?.getBoundingClientRect().width ?? 0,
        attribution: attribution?.textContent ?? ''
      };
    })()`,
  );

  assert(layout.mapWidth >= Math.min(width - 32, 300), `Map width is too small at ${width}px.`);
  assert(layout.mapHeight >= 300, `Map height is too small at ${width}px.`);
  assert(
    layout.attribution.includes('OpenStreetMap'),
    `OpenStreetMap attribution is missing at ${width}px.`,
  );

  if (width >= 1280) {
    const mapShare = layout.workspaceWidth > 0 ? layout.mapWidth / layout.workspaceWidth : 0;
    assert(
      layout.mapWidth > layout.panelWidth && mapShare >= 0.55,
      `Desktop map must remain the primary workspace: map=${layout.mapWidth}px, panel=${layout.panelWidth}px, workspace=${layout.workspaceWidth}px, share=${mapShare.toFixed(2)}.`,
    );
  }

  console.log(`T6 viewport QA passed at ${width}x${height}.`);
}

async function dispatchTouch(session, x, y) {
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 }],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function runMarkerTouchQa(session) {
  await setViewport(session, 390, 844);
  await navigate(
    session,
    `${APP_ORIGIN}/tests/browser/t6-map-harness.html`,
    `window.__t6HarnessReady === true && document.querySelector('.noc-map-marker-icon')`,
  );
  await assertNoHorizontalOverflow(session, 'synthetic marker harness at 390px');

  const marker = await evaluate(
    session,
    `(() => {
      const element = document.querySelector('.noc-map-marker-icon');
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        title: element.getAttribute('title'),
        tabindex: element.getAttribute('tabindex'),
        display: style.display
      };
    })()`,
  );

  assert(marker.width >= 44 && marker.height >= 44, `Marker touch target is ${marker.width}x${marker.height}.`);
  assert(marker.title === 'INC-QA-001', 'Marker title metadata is missing.');
  assert(marker.tabindex === '0', 'Leaflet keyboard marker must remain focusable.');

  await dispatchTouch(session, marker.centerX, marker.centerY);
  await waitFor(
    () => evaluate(session, `Boolean(document.querySelector('.noc-map-popup'))`),
    'marker popup after touch',
  );

  const popup = await evaluate(
    session,
    `(() => {
      const popup = document.querySelector('.noc-map-popup');
      const button = popup.querySelector('.noc-map-popup-action');
      const rect = button.getBoundingClientRect();
      return {
        text: popup.textContent,
        buttonX: rect.left + rect.width / 2,
        buttonY: rect.top + rect.height / 2
      };
    })()`,
  );
  assert(popup.text.includes('INC-QA-001'), 'Touched marker popup did not show the Ticket number.');
  assert(popup.text.includes('Jakarta QA splice point'), 'Touched marker popup did not show Cut Point details.');

  await dispatchTouch(session, popup.buttonX, popup.buttonY);
  await waitFor(
    () => evaluate(session, `window.__openedTicket === 'qa-ticket-1'`),
    'Open Ticket action after touch',
  );

  console.log('T6 marker touch QA passed at 390x844.');
}

const vite = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1'], {
  stdio: 'ignore',
  env: process.env,
});
const chromeProfile = `/tmp/nocreport-t6-chrome-${process.pid}`;
const watchdog = scheduleTimeout(() => {
  console.error(`T6 browser QA exceeded ${OVERALL_TIMEOUT_MS}ms.`);
  process.exit(1);
}, OVERALL_TIMEOUT_MS);
let chrome = null;
let session = null;

try {
  await waitForHttp(APP_ORIGIN);
  const chromeExecutable = findChromeExecutable();
  chrome = spawn(
    chromeExecutable,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${chromeProfile}`,
      '--window-size=1280,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  session = await connectToChrome();

  for (const viewport of [
    [360, 800],
    [390, 844],
    [412, 915],
    [1280, 900],
  ]) {
    await runApplicationViewportQa(session, viewport[0], viewport[1]);
  }

  await runMarkerTouchQa(session);
  console.log('T6 real-browser viewport and touch QA passed.');
} finally {
  clearTimeout(watchdog);
  session?.close();
  chrome?.kill('SIGKILL');
  vite.kill('SIGKILL');
  await sleep(100);
  await rm(chromeProfile, { recursive: true, force: true }).catch(() => {});
}
