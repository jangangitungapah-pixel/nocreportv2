import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Link, useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '../../../app/components/PageHeader.jsx';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import {
  TICKET_STATUS,
  TICKET_TITLE_MODE,
  extractExternalTicketNumber,
  formatCoordinatePair,
  formatTicketReport,
  validateCoordinatePair,
  validateTicketTransition,
} from '../../../entities/ticket/index.js';
import { CAPABILITY } from '../../../entities/user/authorization.js';
import {
  GENERATOR_WORKSPACE_COMMAND_EVENT,
  GENERATOR_WORKSPACE_COMMANDS,
} from '../../../shared/lib/generatorWorkspaceCommands.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { ResizableWorkspace } from '../../../shared/ui/ResizableWorkspace.jsx';
import {
  ConfirmDialog,
  DateTimeField,
  ErrorState,
  Skeleton,
  StatusBadge,
  TextInput,
  Textarea,
} from '../../../shared/ui/index.jsx';
import { CoordinateExtractor } from '../components/CoordinateExtractor.jsx';
import { CopyCenter } from '../components/CopyCenter.jsx';
import { DraftRecoveryNotice } from '../components/DraftRecoveryNotice.jsx';
import { EvidenceWorkspace } from '../components/EvidenceWorkspace.jsx';
import { ImpactListEditor } from '../components/ImpactListEditor.jsx';
import { OperatorPresetsPanel } from '../components/OperatorPresetsPanel.jsx';
import { ProgressComposer } from '../components/ProgressComposer.jsx';
import { ProgressTimeline } from '../components/ProgressTimeline.jsx';
import { ReportPreview } from '../components/ReportPreview.jsx';
import { SmartPasteParser } from '../components/SmartPasteParser.jsx';
import { TicketAuditHistory } from '../components/TicketAuditHistory.jsx';
import { ValidationCenter } from '../components/ValidationCenter.jsx';
import { clearDraftRecovery, readDraftRecovery, writeDraftRecovery } from '../lib/draftRecovery.js';
import { restoreEvidenceRecoveryItems } from '../lib/evidenceWorkspace.js';
import { DEFAULT_TICKET_FORM, buildTicketFromForm } from '../lib/formToTicket.js';
import { mergeImpactValues } from '../lib/impactCandidates.js';
import {
  readOperatorPresets,
  resetOperatorPresets,
  sanitizeOperatorPresets,
  writeOperatorPresets,
} from '../lib/operatorPresets.js';
import { DEFAULT_PROGRESS_SNIPPETS } from '../lib/progressSnippets.js';
import {
  createTicketEditor,
  loadTicketEditor,
  persistProgressAppend,
  persistProgressRemove,
  persistProgressUpdate,
  persistTicketTransition,
  saveTicketEditorCore,
} from '../lib/persistenceService.js';
import { applySelectiveImport } from '../lib/selectiveApply.js';
import { canGenerateSmartTitle, generateSmartTitle } from '../lib/smartTitle.js';
import {
  createEditorFeatureMetadata,
  featureMetadataFromImportCandidate,
} from '../lib/ticketFeatureMetadata.js';
import { ticketToFormValues } from '../lib/ticketToForm.js';
import { TIME_INTELLIGENCE_REFRESH_MS } from '../lib/timeIntelligence.js';
import { deriveReportValidation } from '../lib/validationCenter.js';
import { ticketFormSchema } from '../schemas/ticketFormSchema.js';

function EditorSection({ title, meta, children, className = '' }) {
  return (
    <section
      className={`generator-editor-section border-b border-[var(--border-subtle)] px-3 py-3 last:border-b-0 md:px-4 ${className}`}
    >
      <div className="generator-editor-section__header mb-2.5 flex min-h-6 items-center justify-between gap-3">
        <h3 className="generator-editor-section__title text-[12px] font-extrabold tracking-[-0.01em] text-[var(--text-primary)]">
          {title}
        </h3>
        {meta ? (
          <span className="generator-editor-section__meta text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
            {meta}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function WorkflowStage({ id, number, title, description, state, stateLabel, children }) {
  return (
    <section
      id={id}
      tabIndex={-1}
      className="generator-flow-stage"
      data-state={state}
      aria-labelledby={`${id}-title`}
    >
      <div className="generator-flow-stage__rail" aria-hidden="true">
        <span className="generator-flow-stage__number">{number}</span>
      </div>
      <div className="generator-flow-stage__content">
        <header className="generator-flow-stage__header">
          <div className="min-w-0">
            <p className="generator-flow-stage__eyebrow">Workflow stage {number}</p>
            <h2 id={`${id}-title`} className="generator-flow-stage__title">
              {title}
            </h2>
            <p className="generator-flow-stage__description">{description}</p>
          </div>
          <span className="generator-flow-stage__status">{stateLabel}</span>
        </header>
        <div className="generator-flow-stage__body">{children}</div>
      </div>
    </section>
  );
}

function GeneratorWorkflowDeck({ stages, nextAction }) {
  return (
    <section className="generator-workflow-deck" aria-label="Ticket workflow">
      <nav className="generator-workflow-map" aria-label="Generator stages">
        {stages.map((stage) => (
          <button
            key={stage.number}
            type="button"
            className="generator-workflow-step"
            data-state={stage.state}
            aria-current={stage.state === 'current' ? 'step' : undefined}
            onClick={() => focusWorkspaceElement(stage.targetId)}
          >
            <span className="generator-workflow-step__number">{stage.number}</span>
            <span className="generator-workflow-step__copy">
              <strong>{stage.label}</strong>
              <small>{stage.statusLabel}</small>
            </span>
          </button>
        ))}
      </nav>

      <div className="generator-next-action">
        <div className="generator-next-action__copy">
          <span>Next best action</span>
          <strong>{nextAction.detail}</strong>
        </div>
        <Button size="sm" onClick={nextAction.onClick}>
          {nextAction.label}
        </Button>
      </div>
    </section>
  );
}

function GeneratorCommandBar({
  status,
  ticket,
  revision,
  routeTicketId,
  hasUnsavedChanges,
  persistPending,
  copyPending,
  localDevelopmentMode,
  onTransition,
  onCopy,
}) {
  return (
    <section className="generator-command-bar sticky top-2 z-20 flex min-h-12 flex-wrap items-center gap-2 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-panel)_94%,transparent)] px-2.5 py-2 shadow-[var(--shadow-sm)] backdrop-blur-xl">
      <div className="generator-command-context flex min-w-0 flex-1 items-center gap-2.5">
        <StatusBadge status={status} />
        <div className="min-w-0">
          <p className="truncate font-mono text-[10.5px] font-bold text-[var(--text-secondary)]">
            {ticket.externalTtNumber ?? 'TT not detected'}
          </p>
          <p className="truncate text-[9.5px] font-semibold text-[var(--text-faint)]">
            {localDevelopmentMode
              ? 'Local preview'
              : routeTicketId
                ? `Revision ${revision}`
                : 'New cloud Ticket'}
          </p>
        </div>
        <span
          className={`hidden min-h-6 items-center gap-1.5 rounded-full border px-2 text-[9px] font-extrabold uppercase tracking-[0.08em] sm:inline-flex ${
            hasUnsavedChanges
              ? 'border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]'
              : 'border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-muted)]'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              hasUnsavedChanges ? 'bg-[var(--warning-solid)]' : 'bg-[var(--success-solid)]'
            }`}
            aria-hidden="true"
          />
          {hasUnsavedChanges ? 'Unsaved' : 'Saved'}
        </span>
      </div>

      <div className="generator-command-actions ml-auto flex flex-wrap items-center justify-end gap-1.5">
        {routeTicketId ? (
          <Button asChild tone="ghost" size="sm">
            <Link to={`/tickets/${routeTicketId}`}>
              <AppIcon name="info" size={14} />
              Review
            </Link>
          </Button>
        ) : null}
        <Button tone="secondary" size="sm" disabled={copyPending} onClick={onCopy}>
          <AppIcon name="copy" size={14} />
          {copyPending ? 'Copying…' : 'Copy Report'}
        </Button>
        <Button
          form="ticket-editor-form"
          type="submit"
          tone="secondary"
          size="sm"
          disabled={persistPending}
        >
          <AppIcon name="check" size={14} />
          {persistPending ? 'Saving…' : 'Save'}
        </Button>
        {status === TICKET_STATUS.DRAFT ? (
          <Button
            size="sm"
            disabled={persistPending}
            onClick={() => onTransition(TICKET_STATUS.RUNNING)}
          >
            Mark Running
          </Button>
        ) : null}
        {status === TICKET_STATUS.RUNNING ? (
          <Button
            size="sm"
            disabled={persistPending}
            onClick={() => onTransition(TICKET_STATUS.RESOLVED)}
          >
            Resolve Ticket
          </Button>
        ) : null}
      </div>
    </section>
  );
}

async function copyPlainText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) throw new Error('Clipboard copy failed.');
}

function coordinateSummary(latitude, longitude) {
  const lat = String(latitude ?? '').trim();
  const lng = String(longitude ?? '').trim();

  if (!lat && !lng) return { valid: true, text: 'No coordinate recorded yet.' };
  if (!lat || !lng) {
    return { valid: false, text: 'Latitude and Longitude must be provided together.' };
  }

  const validation = validateCoordinatePair(lat, lng);
  if (!validation.valid) {
    return { valid: false, text: 'Coordinate is outside a valid geographic range or not numeric.' };
  }

  return {
    valid: true,
    text: formatCoordinatePair(validation.latitude, validation.longitude),
  };
}

function persistenceMessage(error, fallback) {
  if (error?.code === 'STALE_REVISION') {
    return 'This Ticket changed in another session. Reload the Ticket before saving again.';
  }
  if (error?.code === 'PERMISSION_DENIED') {
    return 'Your account does not have permission for this Ticket action.';
  }
  if (error?.code === 'NETWORK_ERROR') {
    return 'The network/Firebase service is unavailable. Your unsaved form data is still on screen.';
  }
  return fallback;
}

function createImportedProgressId(index) {
  if (typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `smart-import-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;
}

function toImportedProgressEntries(progress) {
  const createdAt = new Date();
  return progress
    .map((entry, index) => {
      const occurredAt = new Date(entry.occurredAt);
      if (Number.isNaN(occurredAt.getTime()) || !entry.text?.trim()) return null;
      return {
        id: createImportedProgressId(index),
        occurredAt,
        text: entry.text.trim(),
        createdAt,
        createdBy: null,
      };
    })
    .filter(Boolean);
}

function topLevelDirtyFields(dirtyFields) {
  return Object.entries(dirtyFields ?? {})
    .filter(([, value]) => Boolean(value))
    .map(([field]) => field);
}

const EMPTY_DRAFT_RECOVERY = Object.freeze({ state: 'missing', payload: null });
const EMPTY_PROGRESS_DRAFT = Object.freeze({ occurredAt: '', text: '' });
const EMAIL_SENT_TIME_WARNING = 'Email Sent Time was not available; Dispatch Time needs review.';
const VALID_PROGRESS_SNIPPET_IDS = Object.freeze(
  DEFAULT_PROGRESS_SNIPPETS.map((snippet) => snippet.id),
);

function recoveredProgressEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => {
      const occurredAt = new Date(entry?.occurredAt);
      const createdAt = entry?.createdAt ? new Date(entry.createdAt) : occurredAt;
      if (Number.isNaN(occurredAt.getTime()) || !entry?.text?.trim()) return null;
      return {
        id: entry.id,
        occurredAt,
        text: entry.text.trim(),
        createdAt: Number.isNaN(createdAt.getTime()) ? occurredAt : createdAt,
        createdBy: null,
      };
    })
    .filter(Boolean);
}

function recoveredImportReview(metadata) {
  if (!metadata) return null;
  return {
    candidate: {
      source: metadata.source ?? {},
      warnings: metadata.missingSentTime ? [EMAIL_SENT_TIME_WARNING] : [],
      conflicts: Array.isArray(metadata.conflicts) ? metadata.conflicts : [],
    },
    identityResolution: metadata.identityResolution ?? null,
  };
}

function preferredWorkspaceScrollBehavior() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'smooth';
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function focusWorkspaceElement(id) {
  if (typeof document === 'undefined') return false;
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView?.({ block: 'center', behavior: preferredWorkspaceScrollBehavior() });
  target.focus?.();
  return true;
}

function GeneratorLoading() {
  return (
    <div className="grid gap-3" aria-label="Loading Ticket">
      <Skeleton className="h-14" />
      <Skeleton className="h-12" />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.7fr)]">
        <Skeleton className="h-[36rem]" />
        <Skeleton className="h-[36rem]" />
      </div>
    </div>
  );
}

export function TicketGeneratorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ticketId: routeTicketId } = useParams();
  const { localDevelopmentMode, can } = useAuth();
  const canReadAudit = can?.(CAPABILITY.READ_AUDIT) ?? false;
  const { pushToast } = useToast();
  const [operatorPresets, setOperatorPresets] = useState(() =>
    readOperatorPresets({ validSnippetIds: VALID_PROGRESS_SNIPPET_IDS }),
  );
  const [selectedCopyTargetId, setSelectedCopyTargetId] = useState(null);
  const [handoverContext, setHandoverContext] = useState({
    validationFindings: [],
    relatedTicketCount: 0,
  });
  const [status, setStatus] = useState(TICKET_STATUS.DRAFT);
  const [savedStatus, setSavedStatus] = useState(TICKET_STATUS.DRAFT);
  const [progressEntries, setProgressEntries] = useState([]);
  const [progressDirty, setProgressDirty] = useState(false);
  const [copyPending, setCopyPending] = useState(false);
  const [persistPending, setPersistPending] = useState(false);
  const [removeProgressId, setRemoveProgressId] = useState(null);
  const [revision, setRevision] = useState(0);
  const [persistedCoordinateSignature, setPersistedCoordinateSignature] = useState('none');
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [pendingNavigationTicketId, setPendingNavigationTicketId] = useState(null);
  const [featureMetadata, setFeatureMetadata] = useState(() =>
    createEditorFeatureMetadata({
      templateProfileId: routeTicketId ? 'MANDAU_DEFAULT' : operatorPresets.templateProfileId,
    }),
  );
  const [featureMetadataDirty, setFeatureMetadataDirty] = useState(false);
  const [importReview, setImportReview] = useState(null);
  const [validationNow, setValidationNow] = useState(() => new Date());
  const [draftRecovery, setDraftRecovery] = useState(EMPTY_DRAFT_RECOVERY);
  const [draftRecoveryReady, setDraftRecoveryReady] = useState(false);
  const [progressComposerDraft, setProgressComposerDraft] = useState(EMPTY_PROGRESS_DRAFT);
  const [progressRecoveryDraft, setProgressRecoveryDraft] = useState(null);
  const [evidenceItems, setEvidenceItems] = useState([]);

  const {
    control,
    register,
    getValues,
    reset,
    clearErrors,
    setError,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors, isDirty, dirtyFields },
  } = useForm({
    defaultValues: {
      ...DEFAULT_TICKET_FORM,
      impactList: [],
      ...(!routeTicketId && operatorPresets.defaultPic ? { pic: operatorPresets.defaultPic } : {}),
    },
    mode: 'onBlur',
    resolver: zodResolver(ticketFormSchema),
    shouldFocusError: true,
  });

  const { fields, append, remove, move, replace } = useFieldArray({
    control,
    name: 'impactList',
  });
  const watchedValues = useWatch({ control });
  const statusDirty = status !== savedStatus;
  const progressComposerDirty = Boolean(progressComposerDraft.text?.trim());
  const hasUnsavedChanges =
    isDirty || progressDirty || featureMetadataDirty || statusDirty || progressComposerDirty;
  const blocker = useBlocker(hasUnsavedChanges);

  const ticket = useMemo(
    () =>
      buildTicketFromForm(watchedValues, {
        status,
        progress: progressEntries,
        revision,
        featureMetadata,
      }),
    [featureMetadata, progressEntries, revision, status, watchedValues],
  );
  const report = useMemo(() => formatTicketReport(ticket), [ticket]);
  const validation = useMemo(
    () =>
      deriveReportValidation(ticket, {
        formValues: watchedValues,
        importCandidate: importReview?.candidate ?? null,
        resolvedPrimaryIdentity: Boolean(importReview?.identityResolution),
        now: validationNow,
        timezone: 'Asia/Jakarta',
      }),
    [importReview, ticket, validationNow, watchedValues],
  );
  const coordinate = coordinateSummary(watchedValues?.latitude, watchedValues?.longitude);
  const selectedCopyTarget = selectedCopyTargetId ?? operatorPresets.defaultCopyTarget;

  const persistOperatorPresetState = useCallback((nextValue) => {
    const next = sanitizeOperatorPresets(nextValue, {
      validSnippetIds: VALID_PROGRESS_SNIPPET_IDS,
    });
    setOperatorPresets(next);
    writeOperatorPresets(next, { validSnippetIds: VALID_PROGRESS_SNIPPET_IDS });
    return next;
  }, []);

  const resetOperatorPresetState = useCallback(() => {
    const next = resetOperatorPresets({ validSnippetIds: VALID_PROGRESS_SNIPPET_IDS });
    setOperatorPresets(next);
    setSelectedCopyTargetId(null);
    pushToast({
      title: 'Operator presets reset',
      message: 'Browser-local Generator defaults returned to profile defaults.',
      tone: 'success',
    });
  }, [pushToast]);

  const updateFavoriteSnippetIds = useCallback((ids) => {
    setOperatorPresets((current) => {
      const next = sanitizeOperatorPresets(
        { ...current, favoriteProgressSnippetIds: ids },
        { validSnippetIds: VALID_PROGRESS_SNIPPET_IDS },
      );
      writeOperatorPresets(next, { validSnippetIds: VALID_PROGRESS_SNIPPET_IDS });
      return next;
    });
  }, []);

  const updateHandoverContext = useCallback((context) => {
    setHandoverContext(context);
  }, []);

  const loadPersistedEditor = useCallback(async () => {
    if (localDevelopmentMode || !routeTicketId) {
      setLoadingTicket(false);
      setLoadError(null);
      if (!routeTicketId) {
        setImportReview(null);
        setDraftRecovery(readDraftRecovery());
        setDraftRecoveryReady(true);
      } else {
        setDraftRecovery(EMPTY_DRAFT_RECOVERY);
        setDraftRecoveryReady(false);
      }
      return;
    }

    setLoadingTicket(true);
    setLoadError(null);
    try {
      const loaded = await loadTicketEditor(routeTicketId);
      reset(ticketToFormValues(loaded.ticket));
      setStatus(loaded.ticket.status);
      setSavedStatus(loaded.ticket.status);
      setProgressEntries(loaded.progress);
      setProgressDirty(false);
      setRevision(loaded.ticket.revision);
      setFeatureMetadata(createEditorFeatureMetadata(loaded.ticket));
      setFeatureMetadataDirty(false);
      setImportReview(null);
      setPersistedCoordinateSignature(loaded.coordinateSignature);
      setDraftRecovery(
        readDraftRecovery({ ticketId: routeTicketId, currentRevision: loaded.ticket.revision }),
      );
      setDraftRecoveryReady(true);
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoadingTicket(false);
    }
  }, [localDevelopmentMode, reset, routeTicketId]);

  useEffect(() => {
    loadPersistedEditor();
  }, [loadPersistedEditor]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setValidationNow(new Date()),
      TIME_INTELLIGENCE_REFRESH_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loadingTicket || location.hash !== '#progress-text') return undefined;

    const timer = window.setTimeout(() => {
      const progressInput = document.getElementById('progress-text');
      progressInput?.scrollIntoView?.({
        block: 'center',
        behavior: preferredWorkspaceScrollBehavior(),
      });
      progressInput?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadingTicket, location.hash, routeTicketId]);

  useEffect(() => {
    if (pendingNavigationTicketId && !hasUnsavedChanges) {
      const nextId = pendingNavigationTicketId;
      setPendingNavigationTicketId(null);
      navigate(`/generator/${nextId}/edit`, { replace: true });
    }
  }, [hasUnsavedChanges, navigate, pendingNavigationTicketId]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!draftRecoveryReady || loadingTicket) return undefined;
    if (routeTicketId && localDevelopmentMode) return undefined;
    if (draftRecovery.state === 'available' || draftRecovery.state === 'stale') return undefined;

    const recoverableDirty =
      isDirty ||
      progressDirty ||
      featureMetadataDirty ||
      Boolean(progressComposerDraft.text?.trim()) ||
      evidenceItems.length > 0;
    if (!recoverableDirty) return undefined;

    const timer = window.setTimeout(() => {
      writeDraftRecovery({
        ticketId: routeTicketId ?? null,
        baseRevision: routeTicketId ? revision : null,
        formValues: watchedValues ?? {},
        featureMetadata,
        progressDraft: progressComposerDraft,
        progressEntries: routeTicketId ? [] : progressEntries,
        evidenceItems,
        templateProfileId: featureMetadata.templateProfileId,
        importReview,
        dirtyAt: new Date(),
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    draftRecovery.state,
    draftRecoveryReady,
    evidenceItems,
    featureMetadata,
    featureMetadataDirty,
    importReview,
    isDirty,
    loadingTicket,
    localDevelopmentMode,
    progressComposerDraft,
    progressDirty,
    progressEntries,
    revision,
    routeTicketId,
    watchedValues,
  ]);

  const restoreRecoveryDraft = () => {
    const payload = draftRecovery.payload;
    if (!payload) return;

    const nextValues = {
      ...DEFAULT_TICKET_FORM,
      impactList: [],
      ...(payload.formValues ?? {}),
    };
    reset(nextValues);
    replace(Array.isArray(nextValues.impactList) ? nextValues.impactList : []);
    setFeatureMetadata(
      createEditorFeatureMetadata(
        payload.featureMetadata ?? { templateProfileId: payload.templateProfileId },
      ),
    );
    setFeatureMetadataDirty(true);

    if (!routeTicketId) {
      const localProgress = recoveredProgressEntries(payload.progressEntries);
      setProgressEntries(localProgress);
      setProgressDirty(localProgress.length > 0);
    }

    const recoveredDraft = payload.progressDraft ?? EMPTY_PROGRESS_DRAFT;
    setProgressComposerDraft(recoveredDraft);
    setProgressRecoveryDraft({ ...recoveredDraft });
    setEvidenceItems(restoreEvidenceRecoveryItems(payload.evidenceItems));
    setImportReview(recoveredImportReview(payload.importMetadata));
    setDraftRecovery(EMPTY_DRAFT_RECOVERY);
    pushToast({
      title: 'Local draft restored',
      message: 'Recovered values are local and remain unsaved until you explicitly persist them.',
      tone: 'success',
    });
  };

  const discardRecoveryDraft = () => {
    clearDraftRecovery({ ticketId: routeTicketId ?? null });
    setDraftRecovery(EMPTY_DRAFT_RECOVERY);
    pushToast({
      title: 'Recovery draft discarded',
      message: 'The local recovery snapshot was removed. Cloud Ticket data was not changed.',
      tone: 'success',
    });
  };

  const notifyInvalidForm = () => {
    pushToast({
      title: 'Check the form',
      message: 'Some fields need attention before this action can continue.',
      tone: 'error',
    });
  };

  const validateFormState = async () => {
    const valid = await trigger(undefined, { shouldFocus: true });
    if (!valid) {
      notifyInvalidForm();
      return null;
    }
    return getValues();
  };

  const persistCoreTicket = async (values) => {
    if (persistPending) return;

    if (!routeTicketId && progressComposerDraft.text?.trim()) {
      document.getElementById('progress-text')?.focus();
      pushToast({
        title: 'Add or clear Progress draft',
        message:
          'Submit the current Progress text before creating the Ticket so it is not silently lost.',
        tone: 'error',
      });
      return;
    }

    if (localDevelopmentMode) {
      reset(values);
      setFeatureMetadataDirty(false);
      setProgressDirty(false);
      setSavedStatus(status);
      clearDraftRecovery({ ticketId: routeTicketId ?? null });
      setDraftRecovery(EMPTY_DRAFT_RECOVERY);
      pushToast({
        title: 'Saved for this session',
        message: 'Local preview mode does not write to Firestore.',
        tone: 'success',
      });
      return;
    }

    const candidate = buildTicketFromForm(values, {
      status,
      progress: progressEntries,
      revision,
      featureMetadata,
    });
    setPersistPending(true);
    try {
      if (!routeTicketId) {
        const created = await createTicketEditor(candidate, progressEntries);
        setRevision(created.revision);
        reset(values);
        setFeatureMetadataDirty(false);
        setProgressDirty(false);
        setSavedStatus(status);
        clearDraftRecovery();
        setDraftRecovery(EMPTY_DRAFT_RECOVERY);
        setPendingNavigationTicketId(created.ticketId);
        pushToast({
          title: 'Ticket created',
          message: 'Ticket and current Progress Timeline were persisted to Firestore.',
          tone: 'success',
        });
        return;
      }

      if (!isDirty && !featureMetadataDirty) {
        pushToast({
          title: 'No core changes to save',
          message: 'Status and Progress mutations are persisted separately when they happen.',
          tone: 'success',
        });
        return;
      }

      const saved = await saveTicketEditorCore({
        ticketId: routeTicketId,
        expectedRevision: revision,
        ticket: candidate,
        previousCoordinateSignature: persistedCoordinateSignature,
      });
      setRevision(saved.revision);
      setPersistedCoordinateSignature(saved.coordinateSignature);
      setStatus(saved.ticket.status);
      setSavedStatus(saved.ticket.status);
      setFeatureMetadata(createEditorFeatureMetadata(saved.ticket));
      setFeatureMetadataDirty(false);
      reset(ticketToFormValues(saved.ticket));
      clearDraftRecovery({ ticketId: routeTicketId });
      setDraftRecovery(EMPTY_DRAFT_RECOVERY);
      pushToast({
        title: 'Ticket saved',
        message: 'Core Ticket fields and verified coordinate metadata are up to date.',
        tone: 'success',
      });
    } catch (error) {
      pushToast({
        title: 'Save failed',
        message: persistenceMessage(
          error,
          'The Ticket could not be saved. Your form data is still on screen.',
        ),
        tone: 'error',
      });
    } finally {
      setPersistPending(false);
    }
  };

  const submitTicket = handleSubmit(persistCoreTicket, notifyInvalidForm);

  useEffect(() => {
    const handleSaveShortcut = (event) => {
      if (event.defaultPrevented) return;
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;
      const activeElement = document.activeElement;
      if (activeElement?.closest?.('[role="dialog"], [role="menu"]')) return;
      const form = document.getElementById('ticket-editor-form');
      if (!form || typeof form.requestSubmit !== 'function') return;
      event.preventDefault();
      form.requestSubmit();
    };

    document.addEventListener('keydown', handleSaveShortcut);
    return () => document.removeEventListener('keydown', handleSaveShortcut);
  }, []);

  const transitionTo = async (targetStatus) => {
    const values = await validateFormState();
    if (!values || persistPending) return;

    const candidate = buildTicketFromForm(values, {
      status,
      progress: progressEntries,
      revision,
      featureMetadata,
    });
    const transition = validateTicketTransition(candidate, targetStatus);

    if (!transition.valid) {
      let shouldFocus = true;
      for (const issue of transition.errors) {
        if (issue.field && issue.field !== 'status') {
          setError(issue.field, { type: 'manual', message: issue.message }, { shouldFocus });
          shouldFocus = false;
        }
      }
      pushToast({
        title: 'Status change blocked',
        message: transition.errors[0]?.message ?? 'Ticket requirements are incomplete.',
        tone: 'error',
      });
      return;
    }

    if (localDevelopmentMode || !routeTicketId) {
      if (!localDevelopmentMode && !routeTicketId && targetStatus === TICKET_STATUS.RESOLVED) {
        pushToast({
          title: 'Save Ticket first',
          message: 'Create the Firestore Ticket before resolving it.',
          tone: 'error',
        });
        return;
      }

      setStatus(targetStatus);
      pushToast({
        title: targetStatus === TICKET_STATUS.RUNNING ? 'Ticket marked Running' : 'Ticket resolved',
        message: localDevelopmentMode
          ? 'The status change is local in preview mode.'
          : 'The Running status will be persisted when this new Ticket is saved.',
        tone: 'success',
      });
      return;
    }

    if (isDirty || featureMetadataDirty) {
      pushToast({
        title: 'Save form changes first',
        message: 'Persist the current Ticket fields before changing its cloud status.',
        tone: 'error',
      });
      return;
    }

    setPersistPending(true);
    try {
      const result = await persistTicketTransition({
        ticketId: routeTicketId,
        expectedRevision: revision,
        toStatus: targetStatus,
      });
      setRevision(result.revision);
      setStatus(result.ticket.status);
      setSavedStatus(result.ticket.status);
      pushToast({
        title: targetStatus === TICKET_STATUS.RUNNING ? 'Ticket marked Running' : 'Ticket resolved',
        message: 'Status transition was persisted atomically.',
        tone: 'success',
      });
    } catch (error) {
      pushToast({
        title: 'Status change failed',
        message: persistenceMessage(error, 'The status transition could not be persisted.'),
        tone: 'error',
      });
    } finally {
      setPersistPending(false);
    }
  };

  const copyOutput = useCallback(
    async (text, { title = 'Copied', message = 'Plain text is ready to paste.' } = {}) => {
      if (copyPending || !text) return false;
      setCopyPending(true);
      try {
        await copyPlainText(text);
        pushToast({ title, message, tone: 'success' });
        return true;
      } catch {
        pushToast({
          title: 'Copy failed',
          message: 'Your browser did not allow clipboard access.',
          tone: 'error',
        });
        return false;
      } finally {
        setCopyPending(false);
      }
    },
    [copyPending, pushToast],
  );

  const copyReport = () =>
    copyOutput(report, { title: 'Report copied', message: 'Plain text is ready to paste.' });

  const copyUtilityTarget = (target) =>
    copyOutput(target?.text, {
      title: `${target?.label ?? 'Output'} copied`,
      message: 'Canonical Generator output is ready to paste.',
    });

  useEffect(() => {
    const handleWorkspaceCommand = (event) => {
      const command = event?.detail?.command;
      if (command === GENERATOR_WORKSPACE_COMMANDS.COPY_REPORT) {
        void copyOutput(report, {
          title: 'Report copied',
          message: 'Plain text is ready to paste.',
        });
        return;
      }
      if (command === GENERATOR_WORKSPACE_COMMANDS.FOCUS_SMART_IMPORT) {
        focusWorkspaceElement('generator-smart-import');
        return;
      }
      if (command === GENERATOR_WORKSPACE_COMMANDS.FOCUS_PROGRESS) {
        focusWorkspaceElement('progress-text');
        return;
      }
      if (command === GENERATOR_WORKSPACE_COMMANDS.FOCUS_VALIDATION) {
        focusWorkspaceElement('generator-validation-center');
      }
    };

    window.addEventListener(GENERATOR_WORKSPACE_COMMAND_EVENT, handleWorkspaceCommand);
    return () =>
      window.removeEventListener(GENERATOR_WORKSPACE_COMMAND_EVENT, handleWorkspaceCommand);
  }, [copyOutput, report]);

  const addProgress = async (entry) => {
    if (localDevelopmentMode || !routeTicketId) {
      setProgressEntries((current) => [...current, entry]);
      setProgressDirty(true);
      return true;
    }

    if (persistPending) return false;
    setPersistPending(true);
    try {
      const result = await persistProgressAppend({
        ticketId: routeTicketId,
        expectedRevision: revision,
        entry,
      });
      setRevision(result.ticketRevision);
      setProgressEntries((current) => [...current, result.progress]);
      setProgressDirty(false);
      clearDraftRecovery({ ticketId: routeTicketId });
      setDraftRecovery(EMPTY_DRAFT_RECOVERY);
      pushToast({
        title: 'Progress added',
        message: 'Timeline update persisted.',
        tone: 'success',
      });
      return true;
    } catch (error) {
      pushToast({
        title: 'Progress not saved',
        message: persistenceMessage(error, 'The progress update could not be persisted.'),
        tone: 'error',
      });
      return false;
    } finally {
      setPersistPending(false);
    }
  };

  const updateProgress = async (entry) => {
    if (localDevelopmentMode || !routeTicketId) {
      setProgressEntries((current) => current.map((item) => (item.id === entry.id ? entry : item)));
      setProgressDirty(true);
      return;
    }

    if (persistPending) return;
    setPersistPending(true);
    try {
      const result = await persistProgressUpdate({
        ticketId: routeTicketId,
        expectedRevision: revision,
        entry,
      });
      setRevision(result.ticketRevision);
      setProgressEntries((current) =>
        current.map((item) => (item.id === result.progress.id ? result.progress : item)),
      );
      pushToast({
        title: 'Progress updated',
        message: 'Timeline correction persisted.',
        tone: 'success',
      });
    } catch (error) {
      pushToast({
        title: 'Progress update failed',
        message: persistenceMessage(error, 'The progress correction could not be persisted.'),
        tone: 'error',
      });
    } finally {
      setPersistPending(false);
    }
  };

  const confirmRemoveProgress = async () => {
    const progressId = removeProgressId;
    setRemoveProgressId(null);
    if (!progressId) return;

    if (localDevelopmentMode || !routeTicketId) {
      setProgressEntries((current) => current.filter((entry) => entry.id !== progressId));
      setProgressDirty(true);
      return;
    }

    if (persistPending) return;
    setPersistPending(true);
    try {
      const result = await persistProgressRemove({
        ticketId: routeTicketId,
        expectedRevision: revision,
        progressId,
      });
      setRevision(result.ticketRevision);
      setProgressEntries((current) => current.filter((entry) => entry.id !== progressId));
      pushToast({
        title: 'Progress removed',
        message: 'Timeline correction persisted.',
        tone: 'success',
      });
    } catch (error) {
      pushToast({
        title: 'Progress removal failed',
        message: persistenceMessage(error, 'The progress entry could not be removed.'),
        tone: 'error',
      });
    } finally {
      setPersistPending(false);
    }
  };

  const applyUnifiedImport = ({
    candidate,
    confirmedFields,
    includeProgress,
    includeMetadata,
    identityResolution,
  }) => {
    const currentValues = getValues();
    const result = applySelectiveImport(candidate, currentValues, {
      dirtyFields: topLevelDirtyFields(dirtyFields),
      confirmedFields,
    });
    const scalarFields = ['title', 'occurAt', 'dispatchAt', 'pic', 'rootcause', 'cutPoint'];

    for (const field of scalarFields) {
      if (!result.appliedFields.includes(field)) continue;
      setValue(field, result.nextValues[field] ?? '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }

    if (result.appliedFields.includes('impactList')) {
      const importedImpact = Array.isArray(result.nextValues.impactList)
        ? result.nextValues.impactList
        : [];
      replace(importedImpact);
      setValue('impactList', importedImpact, { shouldDirty: true, shouldTouch: true });
    }

    if (includeMetadata) {
      setFeatureMetadata(featureMetadataFromImportCandidate(candidate, { identityResolution }));
      setFeatureMetadataDirty(true);
    }

    let importedProgressCount = 0;
    if (includeProgress) {
      const importedProgress = toImportedProgressEntries(candidate.progress ?? []);
      setProgressEntries(importedProgress);
      setProgressDirty(true);
      importedProgressCount = importedProgress.length;
    }

    if (result.appliedFields.length) clearErrors(result.appliedFields);

    const appliedSummary = [
      `${result.appliedFields.length} field${result.appliedFields.length === 1 ? '' : 's'}`,
      includeMetadata ? 'structured metadata' : null,
      includeProgress
        ? `${importedProgressCount} progress update${importedProgressCount === 1 ? '' : 's'}`
        : null,
    ]
      .filter(Boolean)
      .join(' + ');

    pushToast({
      title: 'Import applied to draft',
      message: `${appliedSummary || 'Selected values'} updated locally. Nothing was written to Firestore.`,
      tone: 'success',
    });
  };

  const applyImpactCandidates = (values) => {
    const currentImpact = getValues('impactList') ?? [];
    const mergedImpact = mergeImpactValues(currentImpact, values).map((value) => ({ value }));
    replace(mergedImpact);
    setValue('impactList', mergedImpact, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    pushToast({
      title: 'Impact proposals applied',
      message: `${values.length} selected Impact item${values.length === 1 ? '' : 's'} added to the local draft.`,
      tone: 'success',
    });
  };

  const applyExtractedCoordinate = (candidate) => {
    setValue('latitude', String(candidate.latitude), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue('longitude', String(candidate.longitude), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue('coordinateSource', 'ocr', { shouldDirty: true });
    setValue('coordinateDetectedFormat', candidate.detectedFormat ?? null, { shouldDirty: true });
    setValue('coordinateVerified', true, { shouldDirty: true });
    clearErrors(['latitude', 'longitude']);
    pushToast({
      title: 'Coordinate verified',
      message: `${candidate.formatted} applied. The source photo remains local only.`,
      tone: 'success',
    });
  };

  const focusValidationField = (field) => {
    const fieldIds = {
      title: 'ticket-title',
      occurAt: 'occur-at',
      dispatchAt: 'dispatch-at',
      pic: 'pic',
      rootcause: 'rootcause',
      cutPoint: 'cut-point',
      latitude: 'latitude',
      longitude: 'longitude',
      progress: 'progress-text',
    };
    const target = fieldIds[field] ? document.getElementById(fieldIds[field]) : null;
    if (target) {
      target.scrollIntoView?.({ block: 'center', behavior: preferredWorkspaceScrollBehavior() });
      target.focus?.();
      return;
    }
    const section =
      field === 'impactList'
        ? document.querySelector('.generator-impact-editor')
        : field === 'description'
          ? document.querySelector('.generator-smart-import')
          : null;
    section?.scrollIntoView?.({ block: 'center', behavior: preferredWorkspaceScrollBehavior() });
  };

  const titleRegistration = register('title');
  const smartTitleAvailable = canGenerateSmartTitle(ticket);
  const hasStructuredMetadata = Boolean(
    featureMetadata.incidentKey ||
    featureMetadata.pathKey ||
    featureMetadata.alarmContext?.rawAlarm ||
    featureMetadata.alarmContext?.transportFamily ||
    featureMetadata.alarmContext?.pathEndpoints?.length,
  );

  const regenerateTitle = () => {
    if (!smartTitleAvailable) return;
    const generated = generateSmartTitle(ticket);
    if (!generated) return;
    setValue('title', generated, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setFeatureMetadata((current) => ({
      ...current,
      titleMode: TICKET_TITLE_MODE.GENERATED,
      externalTtNumber: ticket.externalTtNumber ?? current.externalTtNumber,
    }));
    setFeatureMetadataDirty(true);
  };

  const firstBlockingFinding = validation.blocking[0] ?? null;
  const hasTitle = Boolean(ticket.title?.trim());
  const hasOccurTime = Boolean(ticket.occurAt);
  const hasResponseContext = Boolean(
    progressEntries.length ||
    ticket.impactList?.length ||
    ticket.pic?.trim() ||
    ticket.rootcause?.trim() ||
    ticket.cutPoint?.trim() ||
    evidenceItems.length,
  );
  const hasCoreBlocker = validation.blocking.some((finding) => finding.source !== 'import');
  const incidentCoreReady = hasTitle && hasOccurTime && coordinate.valid && !hasCoreBlocker;
  const activeWorkflowStage =
    firstBlockingFinding?.source === 'import' || !hasTitle
      ? '01'
      : !incidentCoreReady
        ? '02'
        : !hasResponseContext
          ? '03'
          : '04';
  const workflowState = (number, completed) => {
    if (activeWorkflowStage === number) return 'current';
    return completed ? 'complete' : 'upcoming';
  };
  const workflowStages = [
    {
      number: '01',
      label: 'Intake',
      statusLabel: hasTitle ? 'Identified' : 'Start here',
      state: workflowState('01', hasTitle),
      targetId: 'generator-stage-intake',
    },
    {
      number: '02',
      label: 'Incident',
      statusLabel: incidentCoreReady ? 'Core ready' : 'Required',
      state: workflowState('02', incidentCoreReady),
      targetId: 'generator-stage-incident',
    },
    {
      number: '03',
      label: 'Response',
      statusLabel: hasResponseContext ? 'Context added' : 'Operational',
      state: workflowState('03', hasResponseContext),
      targetId: 'generator-stage-response',
    },
    {
      number: '04',
      label: 'Handover',
      statusLabel: validation.readyForRunning
        ? 'Ready to review'
        : `${validation.counts.blocking} blocking`,
      state: workflowState('04', validation.readyForRunning && hasResponseContext),
      targetId: 'generator-stage-handover',
    },
  ];
  const nextAction = firstBlockingFinding
    ? {
        label:
          firstBlockingFinding.field === 'title'
            ? 'Set incident title'
            : firstBlockingFinding.field === 'occurAt'
              ? 'Add occur time'
              : 'Resolve next blocker',
        detail: firstBlockingFinding.message,
        onClick: () => focusValidationField(firstBlockingFinding.field),
      }
    : !hasResponseContext
      ? {
          label: 'Add first progress',
          detail: 'Add operational context, or jump directly to Handover.',
          onClick: () => focusWorkspaceElement('progress-text'),
        }
      : {
          label: 'Review live output',
          detail:
            validation.counts.warning > 0
              ? `Ready for Running · ${validation.counts.warning} warning${validation.counts.warning === 1 ? '' : 's'} to review.`
              : 'Required fields are ready for final review.',
          onClick: () => focusWorkspaceElement('generator-report-preview'),
        };

  const handleTitleChange = (event) => {
    titleRegistration.onChange(event);
    setFeatureMetadata((current) => ({
      ...current,
      titleMode: TICKET_TITLE_MODE.MANUAL,
      externalTtNumber: extractExternalTicketNumber(event.target.value),
    }));
    setFeatureMetadataDirty(true);
  };

  if (loadingTicket) return <GeneratorLoading />;

  if (loadError) {
    return (
      <ErrorState
        title="Ticket could not be loaded"
        description={persistenceMessage(
          loadError,
          'Check the Ticket ID, permission, or Firebase connection.',
        )}
        onRetry={loadPersistedEditor}
      />
    );
  }

  const editor = (
    <div className="generator-editor-stack min-w-0">
      <WorkflowStage
        id="generator-stage-intake"
        number="01"
        title="Intake & readiness"
        description="Bring in the incident, then clear the issues that affect lifecycle readiness."
        state={workflowStages[0].state}
        stateLabel={workflowStages[0].statusLabel}
      >
        <DraftRecoveryNotice
          recovery={draftRecovery}
          currentRevision={revision}
          currentValues={watchedValues ?? {}}
          onRestore={restoreRecoveryDraft}
          onDiscard={discardRecoveryDraft}
        />

        {!routeTicketId ? (
          <SmartPasteParser
            onApply={applyUnifiedImport}
            currentValues={watchedValues ?? {}}
            dirtyFields={dirtyFields}
            progressCount={progressEntries.length}
            progressDirty={progressDirty}
            metadataPresent={hasStructuredMetadata}
            onAnalysisChange={setImportReview}
          />
        ) : null}

        <ValidationCenter
          validation={validation}
          onFocusField={focusValidationField}
          onOperationalContextChange={updateHandoverContext}
        />
      </WorkflowStage>

      <WorkflowStage
        id="generator-stage-incident"
        number="02"
        title="Define the incident"
        description="Confirm identity, operational clock, ownership, diagnosis, and affected scope."
        state={workflowStages[1].state}
        stateLabel={workflowStages[1].statusLabel}
      >
        <form
          id="ticket-editor-form"
          className="generator-authoring-form generator-core-form overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"
          onSubmit={submitTicket}
          noValidate
        >
          <EditorSection
            title="Ticket Identity"
            meta="Required for Running"
            className="generator-authoring-section generator-authoring-section--identity"
          >
            <TextInput
              id="ticket-title"
              label="Title"
              required
              placeholder="[MANDAU] LINK DOWN ... [TT : INC-...]"
              error={errors.title?.message}
              {...titleRegistration}
              onChange={handleTitleChange}
            />
            <div className="generator-title-controlbar mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2 text-[10px]">
              <span className="font-semibold text-[var(--text-faint)]">
                Smart Title ·{' '}
                {featureMetadata.titleMode === TICKET_TITLE_MODE.GENERATED
                  ? 'Generated'
                  : 'Manual override'}
              </span>
              <Button
                type="button"
                tone="ghost"
                size="xs"
                disabled={!smartTitleAvailable}
                onClick={regenerateTitle}
              >
                Regenerate
              </Button>
            </div>
            <div className="generator-tt-detection-bar mt-2 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-2 text-[10px]">
              <span className="font-semibold text-[var(--text-faint)]">Detected TT</span>
              <strong className="generator-tt-detection-value truncate font-mono text-[var(--text-secondary)]">
                {ticket.externalTtNumber ?? 'Not detected'}
              </strong>
            </div>
          </EditorSection>

          <EditorSection
            title="Incident Timing"
            meta="Operational clock"
            className="generator-authoring-section generator-authoring-section--timing"
          >
            <div className="generator-timing-grid grid gap-3 md:grid-cols-2">
              <DateTimeField
                id="occur-at"
                label="Occur Time"
                hint="Required to mark Running"
                error={errors.occurAt?.message}
                {...register('occurAt')}
              />
              <DateTimeField
                id="dispatch-at"
                label="Dispatch Time"
                error={errors.dispatchAt?.message}
                {...register('dispatchAt')}
              />
            </div>
          </EditorSection>

          <EditorSection
            title="Assignment & Diagnosis"
            className="generator-authoring-section generator-authoring-section--diagnosis"
          >
            <div className="generator-assignment-grid grid gap-3 md:grid-cols-2">
              <TextInput
                id="pic"
                label="PIC"
                placeholder="Agus (majalengka)"
                error={errors.pic?.message}
                {...register('pic')}
              />
              <TextInput
                id="rootcause"
                label="Rootcause"
                placeholder="impact forest burning"
                error={errors.rootcause?.message}
                {...register('rootcause')}
              />
            </div>
            <div className="generator-cutpoint-field mt-3">
              <Textarea
                id="cut-point"
                label="Cut Point"
                rows={3}
                placeholder="OTDR FO CUT at KM 24 from majalengka..."
                error={errors.cutPoint?.message}
                {...register('cutPoint')}
              />
            </div>
          </EditorSection>

          <EditorSection
            title="Cut Point Coordinate"
            meta="Operator verified"
            className="generator-authoring-section generator-authoring-section--coordinate"
          >
            <div className="generator-coordinate-grid grid gap-3 md:grid-cols-2">
              <TextInput
                id="latitude"
                label="Latitude"
                inputMode="decimal"
                placeholder="-6.12345"
                error={errors.latitude?.message}
                {...register('latitude')}
              />
              <TextInput
                id="longitude"
                label="Longitude"
                inputMode="decimal"
                placeholder="107.12345"
                error={errors.longitude?.message}
                {...register('longitude')}
              />
            </div>
            <div
              className={`generator-coordinate-summary mt-2.5 border-l-2 px-2.5 py-1.5 text-[11px] leading-5 ${
                coordinate.valid
                  ? 'border-[var(--border-default)] text-[var(--text-muted)]'
                  : 'border-[var(--danger-solid)] bg-[var(--danger-soft)] text-[var(--danger-text)]'
              }`}
              data-state={coordinate.valid ? 'valid' : 'invalid'}
            >
              <span className="font-semibold">Normalized:</span> {coordinate.text}
              {ticket.coordinate ? (
                <span className="ml-1.5 text-[var(--text-faint)]">
                  · {ticket.coordinate.source === 'ocr' ? 'Local OCR verified' : 'Manual entry'}
                  {ticket.coordinate.detectedFormat ? ` · ${ticket.coordinate.detectedFormat}` : ''}
                </span>
              ) : null}
            </div>
          </EditorSection>
        </form>

        <ImpactListEditor
          fields={fields}
          register={register}
          append={append}
          remove={remove}
          move={move}
          currentValues={watchedValues?.impactList ?? []}
          onApplyCandidates={applyImpactCandidates}
        />
      </WorkflowStage>

      <WorkflowStage
        id="generator-stage-response"
        number="03"
        title="Coordinate the response"
        description="Capture evidence locally, verify coordinates, and keep the shift timeline current."
        state={workflowStages[2].state}
        stateLabel={workflowStages[2].statusLabel}
      >
        <EvidenceWorkspace
          items={evidenceItems}
          onItemsChange={setEvidenceItems}
          onApplyCoordinate={applyExtractedCoordinate}
        />
        <CoordinateExtractor onApplyCoordinate={applyExtractedCoordinate} />
        <ProgressComposer
          onAdd={addProgress}
          profileId={featureMetadata.templateProfileId}
          recoveryDraft={progressRecoveryDraft}
          onDraftChange={setProgressComposerDraft}
          favoriteSnippetIds={operatorPresets.favoriteProgressSnippetIds}
          onFavoriteSnippetIdsChange={updateFavoriteSnippetIds}
          eventTimeBehavior={operatorPresets.eventTimeBehavior}
        />
        <ProgressTimeline
          entries={progressEntries}
          onUpdate={updateProgress}
          onRemove={setRemoveProgressId}
        />
      </WorkflowStage>

      <WorkflowStage
        id="generator-stage-handover"
        number="04"
        title="Review & handover"
        description="Use the canonical output, shift handover, presets, and immutable audit context."
        state={workflowStages[3].state}
        stateLabel={workflowStages[3].statusLabel}
      >
        <CopyCenter
          ticket={ticket}
          validationFindings={handoverContext.validationFindings}
          relatedTicketCount={handoverContext.relatedTicketCount}
          selectedTargetId={selectedCopyTarget}
          expanded={operatorPresets.utilityState.copyCenterExpanded}
          handoverExpanded={operatorPresets.utilityState.handoverExpanded}
          onSelectedTargetChange={setSelectedCopyTargetId}
          onExpandedChange={(expanded) =>
            persistOperatorPresetState({
              ...operatorPresets,
              utilityState: { ...operatorPresets.utilityState, copyCenterExpanded: expanded },
            })
          }
          onHandoverExpandedChange={(expanded) =>
            persistOperatorPresetState({
              ...operatorPresets,
              utilityState: { ...operatorPresets.utilityState, handoverExpanded: expanded },
            })
          }
          onCopy={copyUtilityTarget}
        />
        <OperatorPresetsPanel
          presets={operatorPresets}
          expanded={operatorPresets.utilityState.presetsExpanded}
          onChange={persistOperatorPresetState}
          onReset={resetOperatorPresetState}
        />
        <TicketAuditHistory
          ticketId={routeTicketId}
          enabled={Boolean(routeTicketId && !localDevelopmentMode && canReadAudit)}
          limit={50}
        />
      </WorkflowStage>
    </div>
  );

  const preview = (
    <div className="generator-preview-stage">
      <ReportPreview
        report={report}
        validation={validation}
        onCopy={copyReport}
        copyPending={copyPending}
        fill
        showCopyAction={false}
      />
    </div>
  );

  return (
    <div className="generator-cockpit grid gap-3">
      <PageHeader
        title={routeTicketId ? 'Edit Ticket' : 'New Ticket'}
        eyebrow="Template Generator"
        description={
          routeTicketId
            ? ticket.title || ticket.externalTtNumber || 'Explicit mutation workspace'
            : 'Build, validate, and preview the canonical NOC report before persistence.'
        }
      />

      <GeneratorCommandBar
        status={status}
        ticket={ticket}
        revision={revision}
        routeTicketId={routeTicketId}
        hasUnsavedChanges={hasUnsavedChanges}
        persistPending={persistPending}
        copyPending={copyPending}
        localDevelopmentMode={localDevelopmentMode}
        onTransition={transitionTo}
        onCopy={copyReport}
      />

      <GeneratorWorkflowDeck stages={workflowStages} nextAction={nextAction} />

      <ResizableWorkspace
        id="generator-editor-preview"
        primaryId="editor"
        secondaryId="preview"
        primaryDefault={64}
        primaryMin="500px"
        secondaryMin="320px"
        primary={editor}
        secondary={preview}
        className="generator-cockpit-workspace h-[calc(100vh-15rem)] min-h-[560px]"
        mobileClassName="generator-cockpit-mobile-flow"
      />

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave with unsaved changes?"
        description={
          localDevelopmentMode
            ? 'Changes made since the last local-session Save will be discarded if you leave this page.'
            : 'Unsaved core Ticket changes will be discarded if you leave this page.'
        }
        confirmLabel="Leave page"
        tone="danger"
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />

      <ConfirmDialog
        open={Boolean(removeProgressId)}
        title="Remove progress update?"
        description={
          localDevelopmentMode || !routeTicketId
            ? 'This removes the local progress entry from the current draft.'
            : 'This removes the persisted progress entry and updates the Ticket summary atomically.'
        }
        confirmLabel="Remove"
        tone="danger"
        onClose={() => setRemoveProgressId(null)}
        onConfirm={confirmRemoveProgress}
      />
    </div>
  );
}
