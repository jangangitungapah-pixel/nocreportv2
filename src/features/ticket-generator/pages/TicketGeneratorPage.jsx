import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useBlocker } from 'react-router-dom';

import {
  TICKET_STATUS,
  formatCoordinatePair,
  formatTicketReport,
  validateCoordinatePair,
  validateTicketTransition,
} from '../../../entities/ticket/index.js';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import {
  Button,
  ConfirmDialog,
  DateTimeField,
  StatusBadge,
  TextInput,
  Textarea,
} from '../../../shared/ui/index.jsx';
import { ImpactListEditor } from '../components/ImpactListEditor.jsx';
import { ProgressComposer } from '../components/ProgressComposer.jsx';
import { ProgressTimeline } from '../components/ProgressTimeline.jsx';
import { ReportPreview } from '../components/ReportPreview.jsx';
import { DEFAULT_TICKET_FORM, buildTicketFromForm } from '../lib/formToTicket.js';
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

export function TicketGeneratorPage() {
  const { pushToast } = useToast();
  const [status, setStatus] = useState(TICKET_STATUS.DRAFT);
  const [savedStatus, setSavedStatus] = useState(TICKET_STATUS.DRAFT);
  const [progressEntries, setProgressEntries] = useState([]);
  const [progressDirty, setProgressDirty] = useState(false);
  const [copyPending, setCopyPending] = useState(false);
  const [removeProgressId, setRemoveProgressId] = useState(null);

  const {
    control,
    register,
    getValues,
    reset,
    clearErrors,
    setError,
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
    () => buildTicketFromForm(watchedValues, { status, progress: progressEntries }),
    [progressEntries, status, watchedValues],
  );
  const report = useMemo(() => formatTicketReport(ticket), [ticket]);
  const coordinate = coordinateSummary(watchedValues?.latitude, watchedValues?.longitude);

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
    return values;
  };

  const saveLocalDraft = () => {
    const values = validateFormState();
    if (!values) return;

    reset(values);
    setProgressDirty(false);
    setSavedStatus(status);
    pushToast({
      title: 'Saved for this session',
      message: 'Firestore persistence is connected in T5. No cloud write occurred.',
      tone: 'success',
    });
  };

  const transitionTo = (targetStatus) => {
    const values = validateFormState();
    if (!values) return;

    const candidate = buildTicketFromForm(values, { status, progress: progressEntries });
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

    setStatus(targetStatus);
    pushToast({
      title: targetStatus === TICKET_STATUS.RUNNING ? 'Ticket marked Running' : 'Ticket resolved',
      message: 'The change is local until Firebase persistence is connected.',
      tone: 'success',
    });
  };

  const copyReport = async () => {
    setCopyPending(true);
    try {
      await copyPlainText(report);
      pushToast({ title: 'Report copied', message: 'Plain text is ready to paste.', tone: 'success' });
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

  const addProgress = (entry) => {
    setProgressEntries((current) => [...current, entry]);
    setProgressDirty(true);
  };

  const updateProgress = (entry) => {
    setProgressEntries((current) => current.map((item) => (item.id === entry.id ? entry : item)));
    setProgressDirty(true);
  };

  const confirmRemoveProgress = () => {
    setProgressEntries((current) => current.filter((entry) => entry.id !== removeProgressId));
    setProgressDirty(true);
    setRemoveProgressId(null);
  };

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
              {hasUnsavedChanges ? 'Unsaved changes' : 'Session state saved'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button tone="secondary" onClick={saveLocalDraft}>
            Save
          </Button>
          {status === TICKET_STATUS.DRAFT ? (
            <Button onClick={() => transitionTo(TICKET_STATUS.RUNNING)}>Mark Running</Button>
          ) : null}
          {status === TICKET_STATUS.RUNNING ? (
            <Button onClick={() => transitionTo(TICKET_STATUS.RESOLVED)}>Resolve Ticket</Button>
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

          <FieldSection
            title="Cut Point Coordinate"
            description="Manual Decimal Degrees input is available now. Photo OCR is added in T4."
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
        description="Changes made since the last local-session Save will be discarded if you leave this page."
        confirmLabel="Leave page"
        tone="danger"
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />

      <ConfirmDialog
        open={Boolean(removeProgressId)}
        title="Remove progress update?"
        description="This removes the local progress entry from the current draft."
        confirmLabel="Remove"
        tone="danger"
        onClose={() => setRemoveProgressId(null)}
        onConfirm={confirmRemoveProgress}
      />
    </div>
  );
}
