import { useEffect, useMemo, useRef, useState } from 'react';

import { getAuthClient } from '../../../infrastructure/firebase/authClient.js';
import { getFirebaseConfigStatus } from '../../../infrastructure/firebase/firebaseConfig.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import {
  duplicateLookupFingerprint,
  hasDuplicateLookupSignal,
} from '../lib/duplicateDetection.js';
import { findDuplicateCandidates } from '../lib/duplicateDetectionService.js';
import {
  loadRelatedTickets,
  relateTicketToCandidate,
  unlinkCurrentTicketFromGroup,
} from '../lib/relatedTicketsService.js';
import { formatOperationalDuration } from '../lib/timeIntelligence.js';
import { withDuplicateCandidateFindings } from '../lib/validationCenter.js';
import { DuplicateRelatedPanel } from './DuplicateRelatedPanel.jsx';

const SEVERITY_META = Object.freeze({
  blocking: { label: 'Blocking', className: 'text-[var(--danger-text)]' },
  warning: { label: 'Warning', className: 'text-[var(--warning-text)]' },
  info: { label: 'Info', className: 'text-[var(--text-muted)]' },
});

function Metric({ label, value }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-2">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-faint)]">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-[11px] font-bold text-[var(--text-primary)]">
        {formatOperationalDuration(value)}
      </p>
    </div>
  );
}

function persistedTicketIdFromPathname() {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/^\/generator\/([^/]+)\/edit\/?$/);
  if (!match || match[1] === 'new') return null;
  return decodeURIComponent(match[1]);
}

function hasAuthenticatedFirebaseUser() {
  try {
    if (!getFirebaseConfigStatus().configured) return false;
    return Boolean(getAuthClient().currentUser);
  } catch {
    return false;
  }
}

function generatorHasUnsavedChanges() {
  if (typeof window === 'undefined') return false;
  const event = new Event('beforeunload', { cancelable: true });
  const dispatched = window.dispatchEvent(event);
  return event.defaultPrevented || dispatched === false;
}

function reloadEditor() {
  if (typeof window !== 'undefined' && typeof window.location?.reload === 'function') {
    window.location.reload();
  }
}

function focusDuplicateReview() {
  if (typeof document === 'undefined') return;
  document
    .querySelector('.generator-duplicate-related')
    ?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
}

export function ValidationCenter({ validation, onFocusField }) {
  const ticket = validation?.ticket ?? null;
  const routeTicketId = persistedTicketIdFromPathname();
  const duplicateFingerprint = useMemo(() => duplicateLookupFingerprint(ticket), [ticket]);
  const duplicateAcknowledgedRef = useRef(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState([]);
  const [duplicatePending, setDuplicatePending] = useState(false);
  const [duplicateError, setDuplicateError] = useState(null);
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);
  const [relatedGroup, setRelatedGroup] = useState(null);
  const [relatedTickets, setRelatedTickets] = useState([]);
  const [relatedPending, setRelatedPending] = useState(false);
  const [relatedError, setRelatedError] = useState(null);
  const [relatePendingId, setRelatePendingId] = useState(null);
  const [unlinkPending, setUnlinkPending] = useState(false);

  useEffect(() => {
    duplicateAcknowledgedRef.current = false;
    setDuplicateAcknowledged(false);
  }, [duplicateFingerprint]);

  useEffect(() => {
    if (!ticket || !hasDuplicateLookupSignal(ticket) || !hasAuthenticatedFirebaseUser()) {
      setDuplicateCandidates([]);
      setDuplicatePending(false);
      setDuplicateError(null);
      return undefined;
    }

    let cancelled = false;
    setDuplicatePending(true);
    setDuplicateError(null);
    const timer = window.setTimeout(() => {
      findDuplicateCandidates(ticket, { excludeTicketId: routeTicketId, limit: 8 })
        .then((candidates) => {
          if (!cancelled) setDuplicateCandidates(candidates);
        })
        .catch((error) => {
          if (!cancelled) {
            setDuplicateCandidates([]);
            setDuplicateError(error);
          }
        })
        .finally(() => {
          if (!cancelled) setDuplicatePending(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [duplicateFingerprint, routeTicketId, ticket]);

  useEffect(() => {
    if (!ticket?.incidentGroupId || !routeTicketId || !hasAuthenticatedFirebaseUser()) {
      setRelatedGroup(null);
      setRelatedTickets([]);
      setRelatedPending(false);
      setRelatedError(null);
      return undefined;
    }

    let cancelled = false;
    setRelatedPending(true);
    setRelatedError(null);
    loadRelatedTickets(ticket.incidentGroupId, routeTicketId)
      .then((result) => {
        if (!cancelled) {
          setRelatedGroup(result.group);
          setRelatedTickets(result.tickets);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRelatedGroup(null);
          setRelatedTickets([]);
          setRelatedError(error);
        }
      })
      .finally(() => {
        if (!cancelled) setRelatedPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [routeTicketId, ticket?.incidentGroupId, ticket?.revision]);

  useEffect(() => {
    if (
      routeTicketId ||
      duplicateCandidates.length === 0 ||
      duplicateError ||
      duplicateAcknowledged
    ) {
      return undefined;
    }

    const form = document.getElementById('ticket-editor-form');
    if (!form) return undefined;

    const requireExplicitDuplicateReview = (event) => {
      if (duplicateAcknowledgedRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      focusDuplicateReview();
    };

    form.addEventListener('submit', requireExplicitDuplicateReview, true);
    return () => form.removeEventListener('submit', requireExplicitDuplicateReview, true);
  }, [duplicateAcknowledged, duplicateCandidates.length, duplicateError, routeTicketId]);

  const handleCreateAnyway = () => {
    duplicateAcknowledgedRef.current = true;
    setDuplicateAcknowledged(true);
    const form = document.getElementById('ticket-editor-form');
    if (typeof form?.requestSubmit === 'function') form.requestSubmit();
  };

  const handleRelateCandidate = async (candidate) => {
    if (!routeTicketId || !ticket || relatePendingId) return;
    if (generatorHasUnsavedChanges()) {
      setRelatedError(new Error('Save the current Generator changes before linking related Tickets.'));
      return;
    }

    setRelatedError(null);
    setRelatePendingId(candidate.id);
    try {
      await relateTicketToCandidate({
        currentTicket: { ...ticket, id: routeTicketId },
        candidate,
      });
      reloadEditor();
    } catch (error) {
      setRelatedError(error);
    } finally {
      setRelatePendingId(null);
    }
  };

  const handleUnlinkCurrent = async () => {
    if (!routeTicketId || !ticket?.incidentGroupId || unlinkPending) return;
    if (generatorHasUnsavedChanges()) {
      setRelatedError(new Error('Save the current Generator changes before unlinking this Ticket.'));
      return;
    }

    setRelatedError(null);
    setUnlinkPending(true);
    try {
      await unlinkCurrentTicketFromGroup({ ...ticket, id: routeTicketId });
      reloadEditor();
    } catch (error) {
      setRelatedError(error);
    } finally {
      setUnlinkPending(false);
    }
  };

  const displayValidation = useMemo(
    () => withDuplicateCandidateFindings(validation, duplicateCandidates),
    [duplicateCandidates, validation],
  );
  const time = displayValidation?.time ?? {};
  const findings = displayValidation?.findings ?? [];
  const ready = Boolean(displayValidation?.readyForRunning);
  const hasUnsavedChanges = generatorHasUnsavedChanges();

  return (
    <div className="grid gap-3">
      <DuplicateRelatedPanel
        candidates={duplicateCandidates}
        duplicatePending={duplicatePending}
        duplicateError={duplicateError}
        duplicateAcknowledged={duplicateAcknowledged}
        canCreateAnyway={!routeTicketId}
        onCreateAnyway={handleCreateAnyway}
        canRelate={Boolean(routeTicketId)}
        hasUnsavedChanges={hasUnsavedChanges}
        relatePendingId={relatePendingId}
        onRelate={handleRelateCandidate}
        relatedGroup={relatedGroup}
        relatedTickets={relatedTickets}
        relatedPending={relatedPending}
        relatedError={relatedError}
        unlinkPending={unlinkPending}
        onUnlinkCurrent={handleUnlinkCurrent}
      />

      <section className="generator-validation-center overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
        <header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <AppIcon name={ready ? 'check' : 'info'} size={14} />
            <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Validation Center</h3>
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] ${
                ready
                  ? 'border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]'
                  : 'border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]'
              }`}
            >
              {ready ? 'Running ready' : `${displayValidation?.counts?.blocking ?? 0} blocking`}
            </span>
          </div>
          <p className="text-[9px] font-semibold text-[var(--text-faint)]">
            Derived · {time.timezone ?? 'Asia/Jakarta'} · minute refresh
          </p>
        </header>

        <div className="grid gap-2 border-b border-[var(--border-subtle)] p-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Incident elapsed" value={time.incidentElapsedMs} />
          <Metric label="Dispatch delay" value={time.dispatchDelayMs} />
          <Metric label="Latest Progress age" value={time.latestProgressAgeMs} />
          <Metric label="Resolved duration" value={time.resolvedDurationMs} />
          <Metric label="Latest update age" value={time.latestUpdateAgeMs} />
        </div>

        <div className="p-3">
          {findings.length ? (
            <div className="grid gap-1.5">
              {findings.map((item) => {
                const meta = SEVERITY_META[item.severity] ?? SEVERITY_META.info;
                const interactive = Boolean(item.field && onFocusField);
                const content = (
                  <>
                    <span
                      className={`shrink-0 text-[9px] font-extrabold uppercase ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                    <span className="min-w-0 flex-1 text-left text-[10.5px] leading-5 text-[var(--text-secondary)]">
                      {item.message}
                    </span>
                    {interactive ? (
                      <span className="shrink-0 text-[9px] font-bold text-[var(--accent-text)]">
                        Focus
                      </span>
                    ) : null}
                  </>
                );

                return interactive ? (
                  <button
                    key={item.id}
                    type="button"
                    className="flex min-h-9 w-full items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    onClick={() => onFocusField(item.field)}
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    key={item.id}
                    className="flex min-h-9 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 py-1.5"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10.5px] leading-5 text-[var(--text-muted)]">
              No derived findings. Field validation and lifecycle rules are currently satisfied.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
