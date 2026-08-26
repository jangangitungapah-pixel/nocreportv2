import { useEffect, useMemo, useState } from 'react';

import { duplicateLookupFingerprint, hasDuplicateLookupSignal } from './duplicateDetection.js';
import { findDuplicateCandidates } from './duplicateDetectionService.js';

const DEFAULT_DELAY_MS = 450;

export function useDuplicateCandidates(
  ticket,
  {
    enabled = true,
    excludeTicketId = null,
    limit = 8,
    delayMs = DEFAULT_DELAY_MS,
  } = {},
) {
  const fingerprint = useMemo(() => duplicateLookupFingerprint(ticket), [ticket]);
  const [state, setState] = useState({
    candidates: [],
    pending: false,
    error: null,
    fingerprint: '',
  });

  useEffect(() => {
    if (!enabled || !hasDuplicateLookupSignal(ticket)) {
      setState({ candidates: [], pending: false, error: null, fingerprint });
      return undefined;
    }

    let cancelled = false;
    const waitMs = Math.max(0, Math.min(Number(delayMs) || DEFAULT_DELAY_MS, 2000));
    setState((current) => ({ ...current, pending: true, error: null, fingerprint }));

    const timer = window.setTimeout(async () => {
      try {
        const candidates = await findDuplicateCandidates(ticket, {
          excludeTicketId,
          limit,
        });
        if (cancelled) return;
        setState({ candidates, pending: false, error: null, fingerprint });
      } catch (error) {
        if (cancelled) return;
        setState({ candidates: [], pending: false, error, fingerprint });
      }
    }, waitMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [delayMs, enabled, excludeTicketId, fingerprint, limit, ticket]);

  return state;
}
