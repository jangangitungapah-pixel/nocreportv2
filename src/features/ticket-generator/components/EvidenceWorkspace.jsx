import { useEffect, useRef, useState } from 'react';

import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';
import { Textarea } from '../../../shared/ui/index.jsx';
import {
  EVIDENCE_QUEUE_MAX_ITEMS,
  createLocalEvidenceItem,
  reattachEvidenceFile,
  updateEvidenceNote,
  withEvidenceOcrResult,
} from '../lib/evidenceWorkspace.js';

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LocalPreview({ file, name }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!file || typeof URL?.createObjectURL !== 'function') {
      setUrl('');
      return undefined;
    }
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL?.(nextUrl);
  }, [file]);

  if (!url) {
    return (
      <div className="grid h-24 place-items-center rounded-[var(--radius-control)] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] text-center text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-faint)]">
        Metadata only
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`Local evidence preview: ${name}`}
      className="h-24 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] object-cover"
    />
  );
}

function analysisCandidates(analysis) {
  if (analysis?.status === 'success') {
    return [
      {
        latitude: analysis.latitude,
        longitude: analysis.longitude,
        formatted: analysis.formatted,
      },
    ];
  }
  return analysis?.status === 'ambiguous' && Array.isArray(analysis.candidates)
    ? analysis.candidates
    : [];
}

function EvidenceItem({ item, onChange, onRemove, onApplyCoordinate }) {
  const reattachRef = useRef(null);
  const [scan, setScan] = useState({ phase: 'idle', progress: 0, status: '', analysis: null });

  const scanImage = async () => {
    if (!item.file || !item.localFileAvailable) {
      setScan({
        phase: 'error',
        progress: 0,
        status: 'Re-attach the original image before running OCR.',
        analysis: null,
      });
      return;
    }

    setScan({ phase: 'processing', progress: 0, status: 'Starting OCR…', analysis: null });
    try {
      const { recognizeImageText } = await import('../../../infrastructure/ocr/ocrClient.js');
      const result = await recognizeImageText(item.file, {
        onProgress: (progress) =>
          setScan((current) => ({
            ...current,
            phase: 'processing',
            progress: Number(progress.progress ?? 0),
            status: progress.status ?? 'Scanning…',
          })),
      });
      const analysis = result.analysis ?? null;
      const phase = ['success', 'ambiguous'].includes(analysis?.status)
        ? 'review'
        : analysis?.status === 'invalid'
          ? 'invalid'
          : 'not_found';
      setScan({
        phase,
        progress: 1,
        status: result.sourceLabel ?? '',
        analysis,
        confidence: result.confidence,
      });
      onChange(
        withEvidenceOcrResult(item, {
          status: analysis?.status ?? 'not_found',
          selectedCoordinate: item.ocr?.selectedCoordinate ?? null,
        }),
      );
    } catch (error) {
      setScan({
        phase: 'error',
        progress: 0,
        status: error instanceof Error ? error.message : 'OCR processing failed.',
        analysis: null,
      });
    }
  };

  const applyCoordinate = (candidate) => {
    const selectedCoordinate = {
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      formatted: candidate.formatted,
      detectedFormat: scan.analysis?.format ?? null,
      confidence: Number.isFinite(Number(scan.confidence)) ? Number(scan.confidence) : null,
    };
    onChange(withEvidenceOcrResult(item, { status: 'selected', selectedCoordinate }));
    onApplyCoordinate?.({
      ...selectedCoordinate,
      source: 'ocr',
      verified: true,
    });
    setScan((current) => ({ ...current, phase: 'selected' }));
  };

  const recoveredCoordinate = item.ocr?.selectedCoordinate ?? null;

  return (
    <article className="generator-evidence-card overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)]">
      <div className="grid gap-3 p-3 md:grid-cols-[150px_minmax(0,1fr)]">
        <LocalPreview file={item.file} name={item.name} />

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-extrabold text-[var(--text-primary)]">
                {item.name}
              </p>
              <p className="mt-0.5 font-mono text-[9px] text-[var(--text-faint)]">
                {formatBytes(item.size)} · {item.type || 'unknown type'}
              </p>
            </div>
            <span
              className={`generator-evidence-state-badge rounded-full border px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.08em] ${
                item.localFileAvailable
                  ? 'border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-text)]'
                  : 'border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-text)]'
              }`}
            >
              {item.localFileAvailable ? 'Local file ready' : 'Re-attach required'}
            </span>
          </div>

          {!item.localFileAvailable ? (
            <p className="mt-2 border-l-2 border-[var(--warning-solid)] bg-[var(--warning-soft)] px-2.5 py-1.5 text-[10px] leading-5 text-[var(--warning-text)]">
              Only safe metadata survived recovery. The original image is not stored and no preview
              is available until you explicitly re-attach it.
            </p>
          ) : null}

          <div className="mt-2.5">
            <Textarea
              id={`evidence-note-${item.id}`}
              label="Operator note"
              rows={2}
              value={item.note ?? ''}
              placeholder="Optional local evidence note…"
              onChange={(event) => onChange(updateEvidenceNote(item, event.target.value))}
            />
          </div>

          <input
            ref={reattachRef}
            className="sr-only"
            type="file"
            accept={ACCEPTED_TYPES}
            aria-label={`Re-attach evidence ${item.name}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              const result = reattachEvidenceFile(item, file);
              if (result.valid) onChange(result.item);
              else
                setScan({
                  phase: 'error',
                  progress: 0,
                  status: result.error.message,
                  analysis: null,
                });
            }}
          />

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="xs"
              tone="secondary"
              onClick={() => reattachRef.current?.click()}
            >
              <AppIcon name="refresh" size={13} />
              {item.localFileAvailable ? 'Replace image' : 'Re-attach image'}
            </Button>
            <Button
              type="button"
              size="xs"
              disabled={!item.localFileAvailable || scan.phase === 'processing'}
              onClick={() => void scanImage()}
            >
              <AppIcon name="map" size={13} />
              {scan.phase === 'processing' ? 'Scanning…' : 'Scan coordinates'}
            </Button>
            <Button type="button" size="xs" tone="ghost" onClick={onRemove}>
              Remove
            </Button>
          </div>
        </div>
      </div>

      {scan.phase === 'processing' ? (
        <div
          className="generator-evidence-scan border-t border-[var(--border-subtle)] px-3 py-2"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-2 text-[9.5px] font-bold text-[var(--text-secondary)]">
            <span>{scan.status || 'Scanning locally…'}</span>
            <span className="font-mono">
              {Math.round(Math.max(0, Math.min(1, scan.progress)) * 100)}%
            </span>
          </div>
        </div>
      ) : null}

      {scan.phase === 'review' ? (
        <div className="generator-evidence-review border-t border-[var(--border-subtle)] bg-[var(--accent-soft)] p-3">
          <p className="text-[10px] font-bold text-[var(--text-secondary)]">
            Review OCR coordinate candidate before applying it to the Ticket.
          </p>
          <div className="mt-2 grid gap-1.5">
            {analysisCandidates(scan.analysis).map((candidate, index) => (
              <button
                key={`${candidate.formatted}-${index}`}
                type="button"
                className="flex min-h-10 items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--border-accent)] bg-[var(--surface-panel)] px-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                onClick={() => applyCoordinate(candidate)}
              >
                <span>
                  <span className="block text-[8.5px] font-extrabold uppercase text-[var(--text-faint)]">
                    Candidate {index + 1}
                  </span>
                  <span className="font-mono text-[10.5px] font-bold text-[var(--text-primary)]">
                    {candidate.formatted}
                  </span>
                </span>
                <span className="text-[9px] font-extrabold text-[var(--accent-text)]">
                  Apply coordinate
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {['not_found', 'invalid', 'error'].includes(scan.phase) ? (
        <p className="border-t border-[var(--border-subtle)] px-3 py-2 text-[10px] leading-5 text-[var(--warning-text)]">
          {scan.status ||
            (scan.phase === 'invalid'
              ? 'OCR found coordinate-like text but it was invalid.'
              : 'No supported coordinate was detected.')}
        </p>
      ) : null}

      {recoveredCoordinate ? (
        <div className="generator-evidence-selected flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] px-3 py-2">
          <p className="font-mono text-[9.5px] font-bold text-[var(--text-secondary)]">
            Selected coordinate · {recoveredCoordinate.formatted}
          </p>
          <Button
            type="button"
            size="xs"
            tone="ghost"
            onClick={() =>
              onApplyCoordinate?.({ ...recoveredCoordinate, source: 'ocr', verified: true })
            }
          >
            Apply again
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export function EvidenceWorkspace({ items = [], onItemsChange, onApplyCoordinate }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  const addFiles = (fileList) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    let nextItems = [...items];
    let nextError = '';

    for (const file of files) {
      const result = createLocalEvidenceItem(file, { currentCount: nextItems.length });
      if (!result.valid) {
        nextError = result.error.message;
        break;
      }
      nextItems.push(result.item);
    }

    setError(nextError);
    if (nextItems !== items) onItemsChange?.(nextItems);
  };

  const replaceItem = (id, nextItem) => {
    onItemsChange?.(items.map((item) => (item.id === id ? nextItem : item)));
  };

  return (
    <section
      id="generator-evidence-workspace"
      className="generator-operations-surface generator-evidence-workspace overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"
      tabIndex={-1}
    >
      <header className="generator-operations-header generator-evidence-workspace__header flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <AppIcon name="map" size={14} className="text-[var(--accent-text)]" />
          <div>
            <h3 className="text-xs font-extrabold text-[var(--text-primary)]">
              Evidence Workspace
            </h3>
            <p className="text-[9px] font-semibold text-[var(--text-faint)]">
              Local files only · no binary cloud persistence
            </p>
          </div>
        </div>
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[9px] font-bold text-[var(--text-muted)]">
          {items.length}/{EVIDENCE_QUEUE_MAX_ITEMS}
        </span>
      </header>

      <div className="p-3">
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          aria-label="Add local evidence images"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />

        <div className="generator-evidence-dropzone flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2.5">
          <div>
            <p className="text-[10.5px] font-bold text-[var(--text-primary)]">
              Attach local evidence
            </p>
            <p className="mt-0.5 text-[9.5px] leading-4 text-[var(--text-muted)]">
              JPG, PNG, WebP · max 15 MB each · up to {EVIDENCE_QUEUE_MAX_ITEMS} items. Saving the
              Ticket never uploads these files.
            </p>
          </div>
          <Button
            type="button"
            size="xs"
            disabled={items.length >= EVIDENCE_QUEUE_MAX_ITEMS}
            onClick={() => inputRef.current?.click()}
          >
            <AppIcon name="plus" size={13} />
            Add evidence
          </Button>
        </div>

        {error ? (
          <p
            className="mt-2 border-l-2 border-[var(--danger-solid)] bg-[var(--danger-soft)] px-2.5 py-1.5 text-[10px] text-[var(--danger-text)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {items.length ? (
          <div className="mt-3 grid gap-2.5">
            {items.map((item) => (
              <EvidenceItem
                key={item.id}
                item={item}
                onChange={(nextItem) => replaceItem(item.id, nextItem)}
                onRemove={() => onItemsChange?.(items.filter((entry) => entry.id !== item.id))}
                onApplyCoordinate={onApplyCoordinate}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-center text-[10px] leading-5 text-[var(--text-faint)]">
            No local evidence attached. Add an image when you need a temporary reference or
            coordinate OCR source.
          </p>
        )}
      </div>
    </section>
  );
}
