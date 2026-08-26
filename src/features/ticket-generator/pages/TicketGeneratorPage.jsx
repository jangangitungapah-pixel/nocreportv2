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
import { ImpactListEditor } from '../components/ImpactListEditor.jsx';
import { ProgressComposer } from '../components/ProgressComposer.jsx';
import { ProgressTimeline } from '../components/ProgressTimeline.jsx';
import { ReportPreview } from '../components/ReportPreview.jsx';
import { SmartPasteParser } from '../components/SmartPasteParser.jsx';
import { ValidationCenter } from '../components/ValidationCenter.jsx';
import { DEFAULT_TICKET_FORM, buildTicketFromForm } from '../lib/formToTicket.js';
import { mergeImpactValues } from '../lib/impactCandidates.js';
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
      className={`border-b border-[var(--border-subtle)] px-3 py-3 last:border-b-0 md:px-4 ${className}`}
    >
      <div className="mb-2.5 flex min-h-6 items-center justify-between gap-3">
        <h3 className="text-[12px] font-extrabold tracking-[-0.01em] text-[var(--text-primary)]">
          {title}
        </h3>
        {meta ? (
          <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
            {meta}
          </span>
        ) : null}
      </div>
      {children}
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
    <section className="sticky top-2 z-20 flex min-h-12 flex-wrap items-center gap-2 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-panel)_94%,transparent)] px-2.5 py-2 shadow-[var(--shadow-sm)] backdrop-blur-xl">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
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

      <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
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
  const { localDevelopmentMode } = useAuth();
  const { pushToast } = useToast();
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
    createEditorFeatureMetadata({ templateProfileId: 'MANDAU_DEFAULT' }),
  );
  const [featureMetadataDirty, setFeatureMetadataDirty] = useState(false);
  const [importReview, setImportReview] = useState(null);
  const [validationNow, setValidationNow] = useState(() => new Date());

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
    defaultValues: { ...DEFAULT_TICKET_FORM, impactList: [] },
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
  const hasUnsavedChanges = isDirty || progressDirty || featureMetadataDirty || statusDirty;
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

  const loadPersistedEditor = useCallback(async () => {
    if (localDevelopmentMode || !routeTicketId) {
      setLoadingTicket(false);
      setLoadError(null);
      if (!routeTicketId) setImportReview(null);
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
      progressInput?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
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

    if (localDevelopmentMode) {
      reset(values);
      setFeatureMetadataDirty(false);
      setProgressDirty(false);
      setSavedStatus(status);
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

  const copyReport = async () => {
    setCopyPending(true);
    try {
      await copyPlainText(report);
      pushToast({
        title: 'Report copied',
        message: 'Plain text is ready to paste.',
        tone: 'success',
      });
    } catch {
      pushToast({
        title: 'Copy failed',
        message: 'Your browser did not allow clipboard access.',
        tone: 'error',
      });
    } finally {
      setCopyPending(false);
    }
  };

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
      target.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      target.focus?.();
      return;
    }
    const section =
      field === 'impactList'
        ? document.querySelector('.generator-impact-editor')
        : field === 'description'
          ? document.querySelector('.generator-smart-import')
          : null;
    section?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
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
    <div className="grid min-w-0 gap-3">
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

      <ValidationCenter validation={validation} onFocusField={focusValidationField} />

      <form
        id="ticket-editor-form"
        className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"
        onSubmit={submitTicket}
        noValidate
      >
        <EditorSection title="Ticket Identity" meta="Required for Running">
          <TextInput
            id="ticket-title"
            label="Title"
            required
            placeholder="[MANDAU] LINK DOWN ... [TT : INC-...]"
            error={errors.title?.message}
            {...titleRegistration}
            onChange={handleTitleChange}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2 text-[10px]">
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
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-2 text-[10px]">
            <span className="font-semibold text-[var(--text-faint)]">Detected TT</span>
            <strong className="truncate font-mono text-[var(--text-secondary)]">
              {ticket.externalTtNumber ?? 'Not detected'}
            </strong>
          </div>
        </EditorSection>

        <EditorSection title="Incident Timing" meta="Operational clock">
          <div className="grid gap-3 md:grid-cols-2">
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

        <EditorSection title="Assignment & Diagnosis">
          <div className="grid gap-3 md:grid-cols-2">
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
          <div className="mt-3">
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

        <EditorSection title="Cut Point Coordinate" meta="Operator verified">
          <div className="grid gap-3 md:grid-cols-2">
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
            className={`mt-2.5 border-l-2 px-2.5 py-1.5 text-[11px] leading-5 ${
              coordinate.valid
                ? 'border-[var(--border-default)] text-[var(--text-muted)]'
                : 'border-[var(--danger-solid)] bg-[var(--danger-soft)] text-[var(--danger-text)]'
            }`}
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
      <CoordinateExtractor onApplyCoordinate={applyExtractedCoordinate} />
      <ProgressComposer onAdd={addProgress} profileId={featureMetadata.templateProfileId} />
      <ProgressTimeline
        entries={progressEntries}
        onUpdate={updateProgress}
        onRemove={setRemoveProgressId}
      />
    </div>
  );

  const preview = (
    <ReportPreview
      report={report}
      onCopy={copyReport}
      copyPending={copyPending}
      fill
      showCopyAction={false}
    />
  );

  return (
    <div className="grid gap-3">
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

      <ResizableWorkspace
        id="generator-editor-preview"
        primaryId="editor"
        secondaryId="preview"
        primaryDefault={64}
        primaryMin="500px"
        secondaryMin="320px"
        primary={editor}
        secondary={preview}
        className="h-[calc(100vh-10.5rem)] min-h-[620px]"
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
