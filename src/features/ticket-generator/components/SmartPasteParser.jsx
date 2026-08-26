import { useEffect, useMemo, useState } from 'react';

import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { Textarea } from '../../../shared/ui/index.jsx';
import { parseOutlookMsgImportWithDefaultDecoder } from '../lib/outlookMsgAdapter.js';
import { parseReportTextImport } from '../lib/reportTextAdapter.js';
import { buildSelectiveApplyPlan } from '../lib/selectiveApply.js';
import { importCandidateHasOperationalMetadata } from '../lib/ticketFeatureMetadata.js';

const EMPTY_CURRENT_VALUES = Object.freeze({});
const EMPTY_DIRTY_FIELDS = Object.freeze({});

const FIELD_LABELS = {
  title: 'Title',
  impactList: 'Impact List',
  occurAt: 'Occur Time',
  dispatchAt: 'Dispatch Time',
  pic: 'PIC',
  rootcause: 'Rootcause',
  cutPoint: 'Cut Point',
};

function dirtyFieldNames(dirtyFields) {
  return Object.entries(dirtyFields ?? {})
    .filter(([, value]) => Boolean(value))
    .map(([field]) => field);
}

function previewValue(value) {
  if (Array.isArray(value)) {
    if (!value.length) return 'Empty list';
    return value
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (entry?.name) return entry.name;
        return JSON.stringify(entry);
      })
      .join(' · ');
  }
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? '');
}

function withSelectedFields(candidate, selectedFields) {
  return {
    ...candidate,
    fields: Object.fromEntries(
      Object.entries(candidate.fields).map(([field, imported]) => [
        field,
        {
          ...imported,
          selected: Boolean(imported?.selected && selectedFields.has(field)),
        },
      ]),
    ),
  };
}

export function SmartPasteParser({
  onApply,
  currentValues = EMPTY_CURRENT_VALUES,
  dirtyFields = EMPTY_DIRTY_FIELDS,
  progressCount = 0,
  progressDirty = false,
  metadataPresent = false,
  onAnalysisChange,
}) {
  const [mode, setMode] = useState('report_text');
  const [source, setSource] = useState('');
  const [msgCandidate, setMsgCandidate] = useState(null);
  const [msgSourceName, setMsgSourceName] = useState('');
  const [msgPending, setMsgPending] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [selectedFields, setSelectedFields] = useState(() => new Set());
  const [includeProgress, setIncludeProgress] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [identityChoice, setIdentityChoice] = useState('');

  const reportCandidate = useMemo(
    () => (source.trim() ? parseReportTextImport(source) : null),
    [source],
  );
  const candidate = mode === 'report_text' ? reportCandidate : msgCandidate;
  const dirtyNames = useMemo(() => dirtyFieldNames(dirtyFields), [dirtyFields]);
  const plan = useMemo(
    () =>
      candidate
        ? buildSelectiveApplyPlan(candidate, currentValues, {
            dirtyFields: dirtyNames,
          })
        : [],
    [candidate, currentValues, dirtyNames],
  );
  const hasOperationalMetadata = importCandidateHasOperationalMetadata(candidate);
  const blockingIdentityConflict = candidate?.conflicts?.find(
    (conflict) => conflict.severity === 'blocking' && conflict.field === 'externalTtNumber',
  );
  const chosenIdentity = identityChoice
    ? (blockingIdentityConflict?.candidates?.[Number(identityChoice)] ?? null)
    : null;
  const titleBlockedByIdentity = Boolean(
    blockingIdentityConflict && (!chosenIdentity || chosenIdentity.source !== 'subject'),
  );

  useEffect(() => {
    onAnalysisChange?.(candidate ? { candidate, identityResolution: chosenIdentity } : null);
  }, [candidate, chosenIdentity, onAnalysisChange]);

  useEffect(() => {
    const safeDefaults = plan
      .filter(
        (item) =>
          item.selected &&
          !item.replacement &&
          !(item.field === 'title' && blockingIdentityConflict),
      )
      .map((item) => item.field);
    setSelectedFields(new Set(safeDefaults));
    setIncludeProgress(
      Boolean(candidate?.progress?.length) && progressCount === 0 && !progressDirty,
    );
    setIncludeMetadata(hasOperationalMetadata && !metadataPresent);
    setIdentityChoice('');
  }, [
    candidate,
    plan,
    progressCount,
    progressDirty,
    blockingIdentityConflict,
    hasOperationalMetadata,
    metadataPresent,
  ]);

  const resetMsg = () => {
    setMsgCandidate(null);
    setMsgSourceName('');
    setMsgError('');
    setMsgPending(false);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setSelectedFields(new Set());
    setIncludeProgress(false);
    setIncludeMetadata(false);
    setIdentityChoice('');
    if (nextMode === 'outlook_msg') resetMsg();
  };

  const readOutlookFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setMsgPending(true);
    setMsgError('');
    setMsgCandidate(null);
    setMsgSourceName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parseOutlookMsgImportWithDefaultDecoder(buffer, {
        sourceName: file.name,
      });
      setMsgCandidate(parsed);
    } catch (error) {
      setMsgError(error?.message ?? 'Outlook .msg file could not be parsed locally.');
    } finally {
      setMsgPending(false);
    }
  };

  const toggleField = (field, checked) => {
    setSelectedFields((current) => {
      const next = new Set(current);
      if (checked) next.add(field);
      else next.delete(field);
      return next;
    });
  };

  const apply = () => {
    if (!candidate) return;

    const confirmedFields = plan
      .filter((item) => item.requiresConfirmation && selectedFields.has(item.field))
      .map((item) => item.field);

    onApply({
      candidate: withSelectedFields(candidate, selectedFields),
      confirmedFields,
      includeProgress,
      includeMetadata,
      identityResolution: chosenIdentity,
    });
  };

  const selectedCount = selectedFields.size + (includeProgress ? 1 : 0) + (includeMetadata ? 1 : 0);
  const hasCandidate = Boolean(candidate);
  const progressReplacement = Boolean(candidate?.progress?.length && progressCount > 0);
  const metadataReplacement = Boolean(hasOperationalMetadata && metadataPresent);

  return (
    <section className="generator-smart-import overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-accent)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
      <header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <AppIcon name="generator" size={14} className="text-[var(--accent-text)]" />
          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Unified Import</h3>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
            Local only · no API
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            tone={mode === 'report_text' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => switchMode('report_text')}
          >
            Paste report
          </Button>
          <Button
            tone={mode === 'outlook_msg' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => switchMode('outlook_msg')}
          >
            Outlook .msg
          </Button>
        </div>
      </header>

      <div className="p-3">
        {mode === 'report_text' ? (
          <Textarea
            id="smart-report-paste"
            label="Existing report"
            rows={5}
            value={source}
            placeholder={`*[MANDAU] LINK DOWN ... [TT : INC-...]*\nOccur Time = 25/08/2026 01:10\nDispatch Time = 25/08/2026 01:20\nPIC = ...\nRootcause = ...\nCut Point = ...\n\nUpdate Progress\n01:21 team coordination...`}
            onChange={(event) => setSource(event.target.value)}
          />
        ) : (
          <div className="grid gap-2.5">
            <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
              <label
                htmlFor="outlook-msg-import"
                className="block text-[11px] font-extrabold text-[var(--text-primary)]"
              >
                Outlook email file
              </label>
              <p className="mt-1 text-[10px] leading-5 text-[var(--text-muted)]">
                Parsed in this browser only. Raw .msg bytes, body, recipients, headers, and
                attachments are not uploaded or persisted.
              </p>
              <input
                id="outlook-msg-import"
                className="mt-2 block w-full text-[10.5px] text-[var(--text-secondary)] file:mr-2 file:rounded-md file:border file:border-[var(--border-default)] file:bg-[var(--surface-panel)] file:px-2 file:py-1.5 file:text-[10px] file:font-bold file:text-[var(--text-primary)]"
                type="file"
                accept=".msg,application/vnd.ms-outlook"
                disabled={msgPending}
                onChange={readOutlookFile}
              />
              {msgSourceName ? (
                <p className="mt-1.5 truncate font-mono text-[9.5px] text-[var(--text-faint)]">
                  {msgPending ? 'Parsing locally… ' : ''}
                  {msgSourceName}
                </p>
              ) : null}
            </div>
            {msgError ? (
              <p
                className="border-l-2 border-[var(--danger-solid)] bg-[var(--danger-soft)] px-2.5 py-1.5 text-[10.5px] leading-5 text-[var(--danger-text)]"
                role="alert"
              >
                {msgError}
              </p>
            ) : null}
          </div>
        )}

        {hasCandidate ? (
          <div className="mt-3 border-t border-[var(--border-subtle)] pt-3">
            <div className="flex flex-wrap items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[var(--text-primary)]">
                  Review detected values before applying
                </p>
                <p className="mt-0.5 text-[10px] leading-5 text-[var(--text-muted)]">
                  Imported values stay local until you choose Apply. Current dirty fields are never
                  silently overwritten.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[9px] font-bold text-[var(--text-faint)]">
                {candidate.source.kind === 'outlook_msg' ? 'OUTLOOK_MSG' : 'REPORT_TEXT'}
              </span>
            </div>

            {blockingIdentityConflict ? (
              <div className="mt-2.5 rounded-[var(--radius-control)] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-2.5">
                <p className="text-[10.5px] font-extrabold text-[var(--danger-text)]">
                  Blocking TT identity conflict
                </p>
                <p className="mt-1 text-[10px] leading-5 text-[var(--danger-text)]">
                  Subject and body disagree on the primary incident. Choose the intended identity
                  explicitly before applying related Title/metadata.
                </p>
                <div className="mt-2 grid gap-1.5">
                  {blockingIdentityConflict.candidates.map((item, index) => (
                    <label
                      key={`${item.source}-${item.value}-${index}`}
                      className="flex min-h-9 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--danger-border)] bg-[var(--surface-panel)] px-2.5 py-1.5 text-[10px] text-[var(--text-secondary)]"
                    >
                      <input
                        type="radio"
                        name="primary-tt-resolution"
                        value={String(index)}
                        checked={identityChoice === String(index)}
                        onChange={(event) => setIdentityChoice(event.target.value)}
                      />
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {item.value}
                      </span>
                      <span className="ml-auto uppercase text-[9px] text-[var(--text-faint)]">
                        {item.source}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {candidate.warnings?.length ? (
              <div className="mt-2.5 grid gap-1">
                {candidate.warnings.map((warning) => (
                  <p
                    key={warning}
                    className="border-l-2 border-[var(--warning-solid)] bg-[var(--warning-soft)] px-2.5 py-1.5 text-[10px] leading-5 text-[var(--warning-text)]"
                  >
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}

            {candidate.conflicts?.filter((item) => item !== blockingIdentityConflict).length ? (
              <div className="mt-2.5 grid gap-1">
                {candidate.conflicts
                  .filter((item) => item !== blockingIdentityConflict)
                  .map((conflict, index) => (
                    <p
                      key={`${conflict.field}-${index}`}
                      className="border-l-2 border-[var(--warning-solid)] bg-[var(--warning-soft)] px-2.5 py-1.5 text-[10px] leading-5 text-[var(--warning-text)]"
                    >
                      {conflict.message ?? `${FIELD_LABELS[conflict.field] ?? conflict.field} conflicts across sources.`}
                    </p>
                  ))}
              </div>
            ) : null}

            <div className="mt-2.5 grid gap-1.5">
              {plan.map((item) => {
                const selected = selectedFields.has(item.field);
                const disabled =
                  !item.selected ||
                  (item.field === 'title' && titleBlockedByIdentity) ||
                  (item.field === 'externalTtNumber' && blockingIdentityConflict && !chosenIdentity);

                return (
                  <label
                    key={item.field}
                    className={`flex min-h-10 items-start gap-2 rounded-[var(--radius-control)] border px-2.5 py-1.5 ${
                      item.replacement
                        ? 'border-[var(--warning-border)] bg-[var(--warning-soft)]'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-muted)]'
                    } ${disabled ? 'opacity-55' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={disabled}
                      onChange={(event) => toggleField(item.field, event.target.checked)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span className="text-[10px] font-extrabold text-[var(--text-primary)]">
                          {FIELD_LABELS[item.field] ?? item.field}
                        </span>
                        <span className="font-mono text-[8.5px] uppercase text-[var(--text-faint)]">
                          {item.source} · {item.confidence}
                        </span>
                        {item.replacement ? (
                          <span className="text-[8.5px] font-extrabold uppercase text-[var(--warning-text)]">
                            replaces current value
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block break-words text-[10px] leading-5 text-[var(--text-secondary)]">
                        {previewValue(item.incomingValue)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            {candidate.progress?.length ? (
              <label
                className={`mt-1.5 flex min-h-10 items-start gap-2 rounded-[var(--radius-control)] border px-2.5 py-1.5 ${
                  progressReplacement
                    ? 'border-[var(--warning-border)] bg-[var(--warning-soft)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-muted)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeProgress}
                  onChange={(event) => setIncludeProgress(event.target.checked)}
                />
                <span className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold text-[var(--text-primary)]">
                    Progress · {candidate.progress.length} updates
                  </span>
                  <span className="mt-0.5 block text-[9.5px] leading-5 text-[var(--text-secondary)]">
                    {progressReplacement
                      ? 'Existing Progress will be replaced only after this explicit selection.'
                      : 'Imported Progress stays local until Ticket Save.'}
                  </span>
                </span>
              </label>
            ) : null}

            {hasOperationalMetadata ? (
              <label
                className={`mt-1.5 flex min-h-10 items-start gap-2 rounded-[var(--radius-control)] border px-2.5 py-1.5 ${
                  metadataReplacement
                    ? 'border-[var(--warning-border)] bg-[var(--warning-soft)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-muted)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(event) => setIncludeMetadata(event.target.checked)}
                />
                <span className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold text-[var(--text-primary)]">
                    Operational metadata · alarm, path, profile & TT identity
                  </span>
                  <span className="mt-0.5 block text-[9.5px] leading-5 text-[var(--text-secondary)]">
                    {metadataReplacement
                      ? 'Current structured metadata is preserved unless you explicitly select this replacement.'
                      : 'Structured metadata is stored only after normal Ticket Save; raw email body/headers/attachments are never included.'}
                  </span>
                </span>
              </label>
            ) : null}

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5">
              <p className="text-[9.5px] text-[var(--text-faint)]">
                {selectedCount} selection{selectedCount === 1 ? '' : 's'} · Apply only updates the
                form. Save remains explicit.
              </p>
              <Button
                size="xs"
                disabled={selectedCount === 0 || Boolean(blockingIdentityConflict && !chosenIdentity)}
                onClick={apply}
              >
                Apply selected ({selectedCount})
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
