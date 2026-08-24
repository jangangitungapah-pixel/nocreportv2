import { useEffect, useRef, useState } from 'react';

import { analyzeCoordinateOcrText } from '../../../infrastructure/ocr/coordinateCandidates.js';
import { validateOcrImageFile } from '../../../infrastructure/ocr/imageValidation.js';
import { Button } from '../../../shared/ui/index.jsx';

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

function formatPercent(value) {
  return `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`;
}

function CandidateButton({ candidate, label, onApply }) {
  return (
    <button
      type="button"
      className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-panel)] px-3.5 py-3 text-left text-sm shadow-[var(--shadow-xs)] transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--border-accent)] hover:bg-[var(--surface-panel-strong)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      onClick={() => onApply(candidate)}
    >
      <span className="min-w-0">
        <span className="block text-[10px] font-extrabold uppercase tracking-[0.11em] text-[var(--text-muted)]">
          {label}
        </span>
        <span className="mt-1.5 block truncate font-mono text-xs font-bold text-[var(--text-primary)]">
          {candidate.formatted}
        </span>
      </span>
      <span className="shrink-0 rounded-xl bg-[var(--accent-soft)] px-2.5 py-2 text-[10px] font-extrabold text-[var(--accent-text)] transition group-hover:bg-[var(--accent-soft-strong)]">
        Apply & verify
      </span>
    </button>
  );
}

export function CoordinateExtractor({ onApplyCoordinate }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ status: '', progress: 0 });
  const [analysis, setAnalysis] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [sourceLabel, setSourceLabel] = useState('');
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (nextFile) => {
    const validation = validateOcrImageFile(nextFile);
    setAnalysis(null);
    setConfidence(null);
    setSourceLabel('');
    setAttempts([]);
    setProgress({ status: '', progress: 0 });

    if (!validation.valid) {
      setFile(null);
      setPhase('error');
      setError(validation.message);
      return;
    }

    setFile(nextFile);
    setPhase('ready');
    setError('');
  };

  const scanImage = async () => {
    if (!file) {
      setError('Choose a Cut Point image first.');
      setPhase('error');
      return;
    }

    setPhase('processing');
    setError('');
    setAnalysis(null);
    setAttempts([]);
    setSourceLabel('');

    try {
      const { recognizeImageText } = await import('../../../infrastructure/ocr/ocrClient.js');
      const result = await recognizeImageText(file, { onProgress: setProgress });
      const nextAnalysis = result.analysis ?? analyzeCoordinateOcrText(result.text);
      setAnalysis(nextAnalysis);
      setConfidence(result.confidence);
      setSourceLabel(result.sourceLabel ?? '');
      setAttempts(result.attempts ?? []);

      if (nextAnalysis.status === 'success') {
        setPhase('detected');
      } else if (nextAnalysis.status === 'ambiguous') {
        setPhase('ambiguous');
      } else if (nextAnalysis.status === 'invalid') {
        setPhase('invalid');
      } else {
        setPhase('not_found');
      }
    } catch (scanError) {
      setPhase('error');
      setError(scanError instanceof Error ? scanError.message : 'OCR processing failed.');
    }
  };

  const applyCandidate = (candidate) => {
    onApplyCoordinate({
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      formatted: candidate.formatted,
      source: 'ocr',
      detectedFormat: analysis?.format ?? null,
      verified: true,
    });
    setPhase('verified');
  };

  const successfulCandidate =
    analysis?.status === 'success'
      ? {
          latitude: analysis.latitude,
          longitude: analysis.longitude,
          formatted: analysis.formatted,
        }
      : null;

  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-sm)] md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="spatial-kicker">Browser-local utility</p>
          <h3 className="mt-1.5 text-base font-bold">Cut Point Photo OCR</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            The image stays in this browser session. It is never uploaded or stored; only a verified
            coordinate can move into the Ticket data model.
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--success-soft)] px-3 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--success-text)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success-solid)]" aria-hidden="true" />
          Local only
        </span>
      </div>

      <div
        className={`relative mt-4 overflow-hidden rounded-2xl border border-dashed p-4 transition-[background-color,border-color,box-shadow] duration-200 md:p-5 ${
          dragActive
            ? 'border-[var(--accent-solid)] bg-[var(--accent-soft)] shadow-[0_0_0_4px_var(--focus-soft)]'
            : 'border-[var(--border-default)] bg-[var(--surface-panel-strong)]'
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          selectFile(event.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept={ACCEPTED_TYPES}
          aria-label="Choose Cut Point photo"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />

        <div className="grid gap-4 sm:grid-cols-[176px_minmax(0,1fr)] sm:items-center">
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] shadow-[var(--shadow-sm)]">
              <img
                src={previewUrl}
                alt="Local Cut Point preview"
                className="h-32 w-full object-cover sm:h-28"
              />
              <span className="absolute bottom-2 left-2 rounded-lg bg-[#090c12]/70 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white backdrop-blur">
                Local preview
              </span>
            </div>
          ) : (
            <div className="grid h-32 w-full place-items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] sm:h-28">
              <div className="text-center">
                <span
                  className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface-panel)] text-sm font-black text-[var(--text-muted)] shadow-[var(--shadow-xs)]"
                  aria-hidden="true"
                >
                  +
                </span>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  No image
                </p>
              </div>
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {file ? file.name : 'Drop a geotag photo here'}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              JPG, PNG, or WebP · maximum 15 MB · mobile photo picker supported
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button tone="secondary" onClick={() => inputRef.current?.click()}>
                Choose image
              </Button>
              <Button disabled={!file || phase === 'processing'} onClick={scanImage}>
                {phase === 'processing' ? 'Scanning…' : 'Scan coordinates'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {phase === 'processing' ? (
        <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3.5" aria-live="polite">
          <div className="flex items-center justify-between gap-3 text-xs font-bold">
            <span>{progress.status || 'Starting OCR worker…'}</span>
            <span className="font-mono tabular-nums text-[var(--accent-text)]">
              {formatPercent(progress.progress)}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--border-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--accent-solid)] transition-[width] duration-200"
              style={{ width: formatPercent(progress.progress) }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-3.5 text-sm font-medium leading-6 text-[var(--danger-text)]">
          {error}
        </div>
      ) : null}

      {phase === 'detected' && successfulCandidate ? (
        <div className="mt-4 space-y-2.5 rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-soft)] p-3.5">
          <p className="text-xs font-semibold leading-5 text-[var(--text-secondary)]">
            Coordinate candidate detected
            {sourceLabel ? ` from ${sourceLabel}` : ''}
            {Number.isFinite(confidence) ? ` · OCR confidence ${Math.round(confidence)}%` : ''}.
            Verify it before applying.
          </p>
          <CandidateButton
            candidate={successfulCandidate}
            label={analysis.format}
            onApply={applyCandidate}
          />
        </div>
      ) : null}

      {phase === 'ambiguous' ? (
        <div className="mt-4 space-y-2.5 rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-soft)] p-3.5">
          <p className="text-sm font-bold text-[var(--warning-text)]">
            Coordinate result requires verification. Choose the correct Latitude/Longitude pair.
          </p>
          {analysis.candidates.map((candidate, index) => (
            <CandidateButton
              key={candidate.formatted}
              candidate={candidate}
              label={`Candidate ${index + 1}`}
              onApply={applyCandidate}
            />
          ))}
        </div>
      ) : null}

      {phase === 'verified' ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--success-soft)] p-3.5 text-sm font-semibold text-[var(--success-text)]">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--surface-panel)] text-xs font-black shadow-[var(--shadow-xs)]"
            aria-hidden="true"
          >
            ✓
          </span>
          Coordinate applied to editable Latitude/Longitude fields. Review them before Save.
        </div>
      ) : null}

      {phase === 'not_found' || phase === 'invalid' ? (
        <div className="mt-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3.5 text-sm leading-6 text-[var(--text-secondary)]">
          {phase === 'not_found'
            ? 'No supported coordinate pattern was detected after region-first and full-image OCR. Enter Latitude/Longitude manually or try another photo.'
            : 'OCR found coordinate-like text, but the resulting location is invalid. Please correct it manually.'}
        </div>
      ) : null}

      {analysis?.normalizedText ? (
        <details className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3.5">
          <summary className="cursor-pointer text-xs font-bold text-[var(--text-secondary)]">
            Review OCR text{sourceLabel ? ` · ${sourceLabel}` : ''}
          </summary>
          <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[var(--surface-panel)] p-3 font-mono text-[11px] leading-5 text-[var(--text-secondary)]">
            {analysis.normalizedText}
          </pre>
        </details>
      ) : null}

      {attempts.length > 1 ? (
        <details className="mt-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] p-3.5">
          <summary className="cursor-pointer text-xs font-bold text-[var(--text-muted)]">
            OCR attempts ({attempts.length})
          </summary>
          <div className="mt-3 space-y-3">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="rounded-xl bg-[var(--surface-muted)] p-3">
                <p className="text-xs font-bold text-[var(--text-secondary)]">
                  {attempt.label} · {Math.round(attempt.confidence || 0)}%
                </p>
                <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-[var(--text-muted)]">
                  {attempt.text || '(no text)'}
                </pre>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
