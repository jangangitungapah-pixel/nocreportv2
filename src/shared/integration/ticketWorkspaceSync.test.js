import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  TICKET_WORKSPACE_SCOPE,
  publishTicketWorkspaceChange,
  subscribeTicketWorkspaceChanges,
} from './ticketWorkspaceSync.js';

describe('ticket workspace synchronization bus', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('delivers same-tab changes only to matching scopes', () => {
    vi.useFakeTimers();
    vi.stubGlobal('BroadcastChannel', undefined);
    const runningListener = vi.fn();
    const archiveListener = vi.fn();
    const stopRunning = subscribeTicketWorkspaceChanges(runningListener, {
      scopes: [TICKET_WORKSPACE_SCOPE.RUNNING],
      debounceMs: 20,
    });
    const stopArchive = subscribeTicketWorkspaceChanges(archiveListener, {
      scopes: [TICKET_WORKSPACE_SCOPE.ARCHIVE],
      debounceMs: 20,
    });

    publishTicketWorkspaceChange({
      kind: 'progress-updated',
      ticketId: 'ticket-1',
      scopes: [TICKET_WORKSPACE_SCOPE.RUNNING, TICKET_WORKSPACE_SCOPE.TICKET],
    });
    vi.advanceTimersByTime(20);

    expect(runningListener).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'progress-updated', ticketId: 'ticket-1' }),
    );
    expect(archiveListener).not.toHaveBeenCalled();

    stopRunning();
    stopArchive();
  });

  it('can ignore mutations originating from the current browser tab', () => {
    vi.useFakeTimers();
    vi.stubGlobal('BroadcastChannel', undefined);
    const listener = vi.fn();
    const stop = subscribeTicketWorkspaceChanges(listener, {
      scopes: [TICKET_WORKSPACE_SCOPE.RUNNING],
      debounceMs: 0,
      ignoreCurrentSource: true,
    });

    publishTicketWorkspaceChange({
      ticketId: 'ticket-1',
      revision: null,
      scopes: [TICKET_WORKSPACE_SCOPE.RUNNING],
    });
    vi.runAllTimers();

    expect(listener).not.toHaveBeenCalled();
    stop();
  });

  it('filters Ticket-detail subscriptions by Ticket id', () => {
    vi.useFakeTimers();
    vi.stubGlobal('BroadcastChannel', undefined);
    const listener = vi.fn();
    const stop = subscribeTicketWorkspaceChanges(listener, {
      scopes: [TICKET_WORKSPACE_SCOPE.TICKET],
      ticketId: 'ticket-2',
      debounceMs: 0,
    });

    publishTicketWorkspaceChange({
      ticketId: 'ticket-1',
      scopes: [TICKET_WORKSPACE_SCOPE.TICKET],
    });
    publishTicketWorkspaceChange({
      ticketId: 'ticket-2',
      revision: 7,
      scopes: [TICKET_WORKSPACE_SCOPE.TICKET],
    });
    vi.runAllTimers();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ ticketId: 'ticket-2', revision: 7 }),
    );
    stop();
  });

  it('keeps absent revision metadata null instead of coercing it to zero', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    const published = publishTicketWorkspaceChange({
      ticketId: 'ticket-1',
      revision: null,
      scopes: [TICKET_WORKSPACE_SCOPE.DASHBOARD],
    });

    expect(published.revision).toBeNull();
  });

  it('coalesces rapid mutations into the latest refresh signal', () => {
    vi.useFakeTimers();
    vi.stubGlobal('BroadcastChannel', undefined);
    const listener = vi.fn();
    const stop = subscribeTicketWorkspaceChanges(listener, {
      scopes: [TICKET_WORKSPACE_SCOPE.DASHBOARD],
      debounceMs: 50,
    });

    publishTicketWorkspaceChange({
      kind: 'ticket-saved',
      ticketId: 'ticket-1',
      revision: 2,
      scopes: [TICKET_WORKSPACE_SCOPE.DASHBOARD],
    });
    publishTicketWorkspaceChange({
      kind: 'coordinate-updated',
      ticketId: 'ticket-1',
      revision: 3,
      scopes: [TICKET_WORKSPACE_SCOPE.DASHBOARD],
    });
    vi.advanceTimersByTime(50);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'coordinate-updated', revision: 3 }),
    );
    stop();
  });
});
