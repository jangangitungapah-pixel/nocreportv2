import { useEffect, useMemo, useRef, useState } from 'react';

import { getAuthClient } from '../../../infrastructure/firebase/authClient.js';
import { getFirebaseConfigStatus } from '../../../infrastructure/firebase/firebaseConfig.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import { duplicateLookupFingerprint, hasDuplicateLookupSignal } from '../lib/duplicateDetection.js';
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

const VALIDATION_CENTER_CONTENT_ID = 'generator-validation-center-content';

function Metric({ label, value }) {
  return (
    <div className="generator-readiness-metric min-w-0 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-2">
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
  if (typeof document === 'undefined') return false;
  const commandBar = document.querySelector('section.sticky');
  return commandBar?.textContent?.includes('Unsaved') ?? false;
}

function reloadEditor() {
  if (typeof window !== 'undefined' && typeof window.location?.reload === 'function') {
    window.location.reload();
  }
}

function preferredWorkspaceScrollBehavior() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'smooth';
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function focusDuplicateReview() {
  if (typeof document === 'undefined') return;
  document
    .querySelector('.generator-duplicate-related')
    ?.scrollIntoView?.({ block: 'center', behavior: preferredWorkspaceScrollBehavior() });
}

export function ValidationCenter({ validation, onFocusField, onOperationalContextChange }) {
  const ticket = validation?.ticket ?? null;
  const routeTicketId = persistedTicketIdFromPathname();
  const duplicateFingerprint = useMemo(() => duplicateLookupFingerprint(ticket), [ticket]);
  const duplicateAcknowledgedRef = useRef(false);
  const previousReadyRef = useRef(Boolean(validation?.readyForRunning));
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
  const [isCollapsed, setIsCollapsed] = useState(() => Boolean(validation?.readyForRunning));

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
    setDuplicateCandidates([]);
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
      setRelatedError(
        new Error('Save the current Generator changes before linking related Tickets.'),
      );
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
      setRelatedError(
        new Error('Save the current Generator changes before unlinking this Ticket.'),
      );
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

  useEffect(() => {
    if (!ready) {
      setIsCollapsed(false);
    } else if (!previousReadyRef.current) {
      setIsCollapsed(true);
    }
    previousReadyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    onOperationalContextChange?.({
      validationFindings: displayValidation?.findings ?? [],
      relatedTicketCount: relatedTickets.length,
    });
  }, [displayValidation?.findings, onOperationalContextChange, relatedTickets.length]);

  return (
    <div className="generator-readiness-stack grid gap-3">
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

      <section
        id="generator-validation-center"
        className="generator-intelligence-surface generator-validation-center overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"
        tabIndex={-1}
      >
        <header
          className={`generator-intelligence-header generator-validation-center__header flex min-h-10 flex-wrap items-center justify-between gap-2 px-3 py-1.5 ${
            isCollapsed ? '' : 'border-b border-[var(--border-subtle)]'
          }`}
        >
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
          <div className="flex items-center gap-1.5">
            <p className="text-[9px] font-semibold text-[var(--text-faint)]">
              Derived · {time.timezone ?? 'Asia/Jakarta'} · minute refresh
            </p>
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              aria-expanded={!isCollapsed}
              aria-controls={VALIDATION_CENTER_CONTENT_ID}
              aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} Validation Center`}
              title={`${isCollapsed ? 'Expand' : 'Collapse'} Validation Center`}
              onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            >
              <AppIcon
                name="chevronDown"
                size={14}
                className={`transition-transform motion-reduce:transition-none ${
                  isCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          </div>
        </header>

        <div id={VALIDATION_CENTER_CONTENT_ID} hidden={isCollapsed}>
          <div className="generator-readiness-metrics grid gap-2 border-b border-[var(--border-subtle)] p-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric label="MTTR" value={time.mttrMs} />
            <Metric label="Dispatch delay" value={time.dispatchDelayMs} />
            <Metric label="Latest Progress age" value={time.latestProgressAgeMs} />
            <Metric label="Resolved duration" value={time.resolvedDurationMs} />
            <Metric label="Latest update age" value={time.latestUpdateAgeMs} />
          </div>

          {findings.length ? (
            <div className="generator-readiness-findings p-3">
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
                      className="generator-finding generator-finding--interactive flex min-h-9 w-full items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      data-severity={item.severity}
                      onClick={() => onFocusField(item.field)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div
                      key={item.id}
                      className="generator-finding flex min-h-9 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-2.5 py-1.5"
                      data-severity={item.severity}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
