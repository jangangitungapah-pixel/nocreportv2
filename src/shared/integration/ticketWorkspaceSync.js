export const TICKET_WORKSPACE_SYNC_EVENT = 'nocreport:ticket-workspace-sync';
export const TICKET_WORKSPACE_SYNC_STORAGE_KEY = 'nocreportv2:ticket-workspace-sync:v1';
export const TICKET_WORKSPACE_SYNC_CHANNEL = 'nocreportv2-ticket-workspace-v1';

export const TICKET_WORKSPACE_SCOPE = Object.freeze({
  DASHBOARD: 'dashboard',
  RUNNING: 'running',
  CUT_POINTS: 'cut-points',
  ARCHIVE: 'archive',
  TICKET: 'ticket',
});

const ALL_TICKET_SCOPES = Object.freeze(Object.values(TICKET_WORKSPACE_SCOPE));
let tabSourceId = null;

function browserAvailable() {
  return typeof window !== 'undefined';
}

function normalizedScopes(scopes) {
  const values = Array.isArray(scopes) ? scopes : [];
  const valid = new Set(ALL_TICKET_SCOPES);
  return [...new Set(values.filter((scope) => valid.has(scope)))];
}

function randomId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function currentSourceId() {
  if (!browserAvailable()) return 'server';
  if (!tabSourceId) tabSourceId = randomId();
  return tabSourceId;
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeChange(change = {}) {
  return {
    id: String(change.id || randomId()),
    version: 1,
    sourceId: String(change.sourceId || currentSourceId()),
    kind: String(change.kind || 'ticket-updated'),
    ticketId: change.ticketId ? String(change.ticketId) : null,
    revision: optionalNumber(change.revision),
    status: change.status ? String(change.status) : null,
    scopes: normalizedScopes(change.scopes?.length ? change.scopes : ALL_TICKET_SCOPES),
    occurredAt: optionalNumber(change.occurredAt) ?? Date.now(),
  };
}

function parseStorageChange(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || parsed.version !== 1 || !parsed.id || !parsed.sourceId) return null;
    return normalizeChange(parsed);
  } catch {
    return null;
  }
}

export function publishTicketWorkspaceChange(change) {
  const payload = normalizeChange(change);
  if (!browserAvailable()) return payload;

  window.dispatchEvent(
    new globalThis.CustomEvent(TICKET_WORKSPACE_SYNC_EVENT, { detail: payload }),
  );

  if (typeof globalThis.BroadcastChannel === 'function') {
    const channel = new globalThis.BroadcastChannel(TICKET_WORKSPACE_SYNC_CHANNEL);
    try {
      channel.postMessage(payload);
    } finally {
      channel.close();
    }
    return payload;
  }

  try {
    window.localStorage.setItem(TICKET_WORKSPACE_SYNC_STORAGE_KEY, JSON.stringify(payload));
    window.localStorage.removeItem(TICKET_WORKSPACE_SYNC_STORAGE_KEY);
  } catch {
    // Same-tab CustomEvent delivery already happened. Browsers that deny storage
    // simply lose the cross-tab fallback rather than breaking a Ticket mutation.
  }

  return payload;
}

function matchesSubscription(change, { scopes, ticketId, ignoreCurrentSource }) {
  if (!change) return false;
  if (ignoreCurrentSource && change.sourceId === currentSourceId()) return false;
  if (ticketId && change.ticketId !== ticketId) return false;
  if (!scopes.length) return true;
  return change.scopes.some((scope) => scopes.includes(scope));
}

export function subscribeTicketWorkspaceChanges(
  listener,
  {
    scopes = [],
    ticketId = null,
    debounceMs = 120,
    ignoreCurrentSource = false,
  } = {},
) {
  if (!browserAvailable() || typeof listener !== 'function') return () => {};

  const expectedScopes = normalizedScopes(scopes);
  const expectedTicketId = ticketId ? String(ticketId) : null;
  const delay = Math.max(0, Math.min(Number(debounceMs) || 0, 1000));
  const seen = new Set();
  let timer = null;
  let pending = null;

  const deliver = (change) => {
    if (
      !matchesSubscription(change, {
        scopes: expectedScopes,
        ticketId: expectedTicketId,
        ignoreCurrentSource,
      })
    ) {
      return;
    }
    if (seen.has(change.id)) return;
    seen.add(change.id);
    if (seen.size > 80) seen.delete(seen.values().next().value);

    pending = change;
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      const next = pending;
      pending = null;
      if (next) listener(next);
    }, delay);
  };

  const handleLocal = (event) => deliver(event?.detail ?? null);
  const handleStorage = (event) => {
    if (event.key !== TICKET_WORKSPACE_SYNC_STORAGE_KEY) return;
    deliver(parseStorageChange(event.newValue));
  };

  window.addEventListener(TICKET_WORKSPACE_SYNC_EVENT, handleLocal);
  window.addEventListener('storage', handleStorage);

  const channel =
    typeof globalThis.BroadcastChannel === 'function'
      ? new globalThis.BroadcastChannel(TICKET_WORKSPACE_SYNC_CHANNEL)
      : null;
  const handleChannel = (event) => {
    if (!event?.data?.id || !event?.data?.sourceId) return;
    deliver(normalizeChange(event.data));
  };
  channel?.addEventListener('message', handleChannel);

  return () => {
    if (timer !== null) window.clearTimeout(timer);
    window.removeEventListener(TICKET_WORKSPACE_SYNC_EVENT, handleLocal);
    window.removeEventListener('storage', handleStorage);
    channel?.removeEventListener('message', handleChannel);
    channel?.close();
  };
}
