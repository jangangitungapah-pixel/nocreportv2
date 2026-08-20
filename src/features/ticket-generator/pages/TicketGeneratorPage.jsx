import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import {
  TICKET_STATUS,
  formatCoordinatePair,
  formatTicketReport,
  validateCoordinatePair,
  validateTicketTransition,
} from '../../../entities/ticket/index.js';
import {
  Button,
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
import { DEFAULT_TICKET_FORM, buildTicketFromForm } from '../lib/formToTicket.js';
import {
  createTicketEditor,
  loadTicketEditor,
  persistProgressAppend,
  persistProgressRemove,
  persistProgressUpdate,
  persistTicketTransition,
  saveTicketEditorCore,
} from '../lib/persistenceService.js';
import { ticketToFormValues } from '../lib/ticketToForm.js';
import { validateTicketForm } from '../schemas/ticketFormSchema.js';

function FieldSection({ title, description, children }) {
  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-4">
        <h3 className="text-sm font-bold">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{description}</p>
        ) : null}
      </div>
      {children}
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

  if (!copied) {
    throw new Error('Clipboard copy failed.');
  }
}

function coordinateSummary(latitude, longitude) {
  const lat = String(latitude ?? '').trim();
  const lng = String(longitude ?? '').trim();

  if (!lat && !lng) {
    return { valid: true, text: 'No coordinate recorded yet.' };
  }

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

function GeneratorLoading() {
  return (
    <div className="space-y-5" aria-label="Loading Ticket">
      <Skeleton className="h-16" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]">
        <div className="space-y-5">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-60" />
        </div>
        <Skeleton className="h-[34rem]" />
      </div>
    </div>
  );
}

export function TicketGeneratorPage() {
  const navigate = useNavigate();
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

  const {
    control,
    register,
    getValues,
    reset,
    clearErrors,
    setError,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: { ...DEFAULT_TICKET_FORM, impactList: [] },
    mode: 'onBlur',
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'impactList' });
  const watchedValues = useWatch({ control });
  const statusDirty = status !== savedStatus;
  const hasUnsavedChanges = isDirty || progressDirty || statusDirty;
  const blocker = useBlocker(hasUnsavedChanges);

  const ticket = useMemo(
    () => buildTicketFromForm(watchedValues, { status, progress: progressEntries, revision }),
    [progressEntries, revision, status, watchedValues],
  );
  const report = useMemo(() => formatTicketReport(ticket), [ticket]);
  const coordinate = coordinateSummary(watchedValues?.latitude, watchedValues?.longitude);

  const loadPersistedEditor = useCallback(async () => {
    if (localDevelopmentMode || !routeTicketId) {
      setLoadingTicket(false);
      setLoadError(null);
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
    if (pendingNavigationTicketId && !hasUnsavedChanges) {
      const nextId = pendingNavigationTicketId;
      setPendingNavigationTicketId(null);
      navigate(`/generator/${nextId}`, { replace: true });
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

  const applySchemaErrors = (issues) => {
    clearErrors();
    for (const issue of issues) {
      const field = issue.path?.[0];
      if (typeof field === 'string') {
        setError(field, { type: 'manual', message: issue.message });
      }
    }
  };

  const validateFormState = () => {
    const values = getValues();
    const validation = validateTicketForm(values);

    if (!validation.success) {
      applySchemaErrors(validation.error.issues);
      pushToast({
        title: 'Check the form',
        message: 'Some fields need attention before this action can continue.',
        tone: 'error',
      });
      return null;
    }

    clearErrors();
    return validation.data;
  };

  const saveTicket = async () => {
    const values = validateFormState();
    if (!values || persistPending) return;

    if (localDevelopmentMode) {
      reset(values);
      setProgressDirty(false);
      setSavedStatus(status);
      pushToast({
        title: 'Saved for this session',
        message: 'Local preview mode does not write to Firestore.',
        tone: 'success',
      });
      return;
    }

    const candidate = buildTicketFromForm(values, { status, progress: progressEntries, revision });
    setPersistPending(true);
    try {
      if (!routeTicketId) {
        const created = await createTicketEditor(candidate, progressEntries);
        setRevision(created.revision);
        reset(values);
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

      if (!isDirty) {
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

  const transitionTo = async (targetStatus) => {
    const values = validateFormState();
    if (!values || persistPending) return;

    const candidate = buildTicketFromForm(values, { status, progress: progressEntries, revision });
    const transition = validateTicketTransition(candidate, targetStatus);

    if (!transition.valid) {
      for (const issue of transition.errors) {
        if (issue.field && issue.field !== 'status') {
          setError(issue.field, { type: 'manual', message: issue.message });
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

    if (isDirty) {
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
      return;
    }

    if (persistPending) return;
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
    } catch (error) {
      pushToast({
        title: 'Progress not saved',
        message: persistenceMessage(error, 'The progress update could not be persisted.'),
        tone: 'error',
      });
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

  if (loadingTicket) {
    return <GeneratorLoading />;
  }

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

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {ticket.externalTtNumber ?? 'New ticket — TT number not detected'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {hasUnsavedChanges
                ? 'Unsaved changes'
                : localDevelopmentMode
                  ? 'Session state saved'
                  : routeTicketId
                    ? `Saved to Firestore · revision ${revision}`
                    : 'New cloud Ticket not saved yet'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button tone="secondary" disabled={persistPending} onClick={saveTicket}>
            {persistPending ? 'Saving…' : 'Save'}
          </Button>
          {status === TICKET_STATUS.DRAFT ? (
            <Button disabled={persistPending} onClick={() => transitionTo(TICKET_STATUS.RUNNING)}>
              Mark Running
            </Button>
          ) : null}
          {status === TICKET_STATUS.RUNNING ? (
            <Button disabled={persistPending} onClick={() => transitionTo(TICKET_STATUS.RESOLVED)}>
              Resolve Ticket
            </Button>
          ) : null}
          <Button tone="secondary" disabled title="Admin archive permission is enforced in T7">
            Archive
          </Button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]">
        <div className="space-y-5">
          <FieldSection
            title="Ticket Identity"
            description="The complete operational Title remains the source of truth for report output."
          >
            <TextInput
              id="ticket-title"
              label="Title"
              required
              placeholder="[MANDAU] LINK DOWN ... [TT : INC-...]"
              error={errors.title?.message}
              {...register('title')}
            />
            <div className="mt-3 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-secondary)]">
              Detected TT: <strong>{ticket.externalTtNumber ?? 'Not detected'}</strong>
            </div>
          </FieldSection>

          <ImpactListEditor
            fields={fields}
            register={register}
            append={append}
            remove={remove}
            move={move}
          />

          <FieldSection
            title="Incident Timing"
            description="Occur Time is required before the ticket can become Running."
          >
            <div className="grid gap-4 md:grid-cols-2">
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
                hint="May be unknown during early Draft"
                error={errors.dispatchAt?.message}
                {...register('dispatchAt')}
              />
            </div>
          </FieldSection>

          <FieldSection title="Assignment & Diagnosis">
            <div className="grid gap-4 md:grid-cols-2">
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
            <div className="mt-4">
              <Textarea
                id="cut-point"
                label="Cut Point"
                rows={3}
                placeholder="OTDR FO CUT at KM 24 from majalengka..."
                error={errors.cutPoint?.message}
                {...register('cutPoint')}
              />
            </div>
          </FieldSection>

          <CoordinateExtractor onApplyCoordinate={applyExtractedCoordinate} />

          <FieldSection
            title="Cut Point Coordinate"
            description="Latitude and Longitude remain editable even after OCR so the operator is always the final authority."
          >
            <div className="grid gap-4 md:grid-cols-2">
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
              className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                coordinate.valid
                  ? 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                  : 'border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)]'
              }`}
            >
              Normalized coordinate: {coordinate.text}
            </div>
            {ticket.coordinate ? (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Source:{' '}
                {ticket.coordinate.source === 'ocr' ? 'Local photo OCR · verified' : 'Manual entry'}
                {ticket.coordinate.detectedFormat ? ` · ${ticket.coordinate.detectedFormat}` : ''}
              </p>
            ) : null}
          </FieldSection>

          <ProgressComposer onAdd={addProgress} />
          <ProgressTimeline
            entries={progressEntries}
            onUpdate={updateProgress}
            onRemove={setRemoveProgressId}
          />
        </div>

        <ReportPreview report={report} onCopy={copyReport} copyPending={copyPending} />
      </div>

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
