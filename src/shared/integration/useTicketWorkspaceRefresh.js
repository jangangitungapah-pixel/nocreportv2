import { useEffect } from 'react';

import { subscribeTicketWorkspaceChanges } from './ticketWorkspaceSync.js';

export function useTicketWorkspaceRefresh(
  refresh,
  {
    scope,
    ticketId = null,
    enabled = true,
    debounceMs = 160,
    refreshOnFocus = true,
  } = {},
) {
  useEffect(() => {
    if (!enabled || !scope || typeof refresh !== 'function') return undefined;
    return subscribeTicketWorkspaceChanges(
      () => {
        void refresh({ background: true, reason: 'workspace-sync' });
      },
      { scopes: [scope], ticketId, debounceMs },
    );
  }, [debounceMs, enabled, refresh, scope, ticketId]);

  useEffect(() => {
    if (!enabled || !refreshOnFocus || typeof refresh !== 'function') return undefined;

    let timer = null;
    const requestRefresh = () => {
      if (document.visibilityState === 'hidden') return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        void refresh({ background: true, reason: 'window-focus' });
      }, 120);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestRefresh();
    };

    window.addEventListener('focus', requestRefresh);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener('focus', requestRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, refresh, refreshOnFocus]);
}
