import { useEffect, useRef, useState } from 'react';

import { analyzeCoordinateOcrText } from '../../../infrastructure/ocr/coordinateCandidates.js';
import { recognizeImageText } from '../../../infrastructure/ocr/ocrClient.js';
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
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-panel)] px-3 py-2 text-left text-sm transition hover:border-[var(--accent-solid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      onClick={() => onApply(candidate)}
    >
      <span>
        <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {label}
        </span>
        <span className="mt-1 block font-mono font-semibold text-[var(--text-primary)]">
          {candidate.formatted}
        </span>
      </span>
      <span className="shrink-0 text-xs font-bold text-[var(--accent-text)]">Apply & verify</span>
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
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">Cut Point Photo OCR</h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--text-muted)]">
            The image stays in this browser session. It is not uploaded or stored; only coordinates can
            move to the Ticket data model after verification.
          </p>
        </div>
        <span className="rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--success-text)]">
          Local only
        </span>
      </div>

      <div
        className={`mt-4 rounded-xl border border-dashed p-4 transition ${
          dragActive
            ? 'border-[var(--accent-solid)] bg-[var(--accent-soft)]'
            : 'border-[var(--border-default)] bg-[var(--surface-muted)]'
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Local Cut Point preview"
              className="h-28 w-full rounded-lg border border-[var(--border-subtle)] object-cover sm:w-40"
            />
          ) : (
            <div className="grid h-28 w-full place-items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-xs font-semibold text-[var(--text-muted)] sm:w-40">
              No image
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {file ? file.name : 'Drop a geotag photo here'}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              JPG, PNG, or WebP · maximum 15 MB · mobile photo picker supported
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
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
        <div className="mt-4 rounded-lg bg-[var(--surface-muted)] p-3" aria-live="polite">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold">
            <span>{progress.status || 'Starting OCR worker…'}</span>
            <span className="tabular-nums">{formatPercent(progress.progress)}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--accent-solid)] transition-[width]"
              style={{ width: formatPercent(progress.progress) }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger-text)]">
          {error}
        </div>
      ) : null}

      {phase === 'detected' && successfulCandidate ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            Coordinate candidate detected
            {sourceLabel ? ` from ${sourceLabel}` : ''}
            {Number.isFinite(confidence) ? ` · OCR confidence ${Math.round(confidence)}%` : ''}. Verify it
            before applying.
          </p>
          <CandidateButton candidate={successfulCandidate} label={analysis.format} onApply={applyCandidate} />
        </div>
      ) : null}

      {phase === 'ambiguous' ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-[var(--danger-text)]">
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
        <div className="mt-4 rounded-lg bg-[var(--success-soft)] p-3 text-sm font-semibold text-[var(--success-text)]">
          Coordinate applied to editable Latitude/Longitude fields. Review them before Save.
        </div>
      ) : null}

      {phase === 'not_found' || phase === 'invalid' ? (
        <div className="mt-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-secondary)]">
          {phase === 'not_found'
            ? 'No supported coordinate pattern was detected after region-first and full-image OCR. Enter Latitude/Longitude manually or try another photo.'
            : 'OCR found coordinate-like text, but the resulting location is invalid. Please correct it manually.'}
        </div>
      ) : null}

      {analysis?.normalizedText ? (
        <details className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
          <summary className="cursor-pointer text-xs font-semibold text-[var(--text-secondary)]">
            Review OCR text{sourceLabel ? ` · ${sourceLabel}` : ''}
          </summary>
          <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--text-secondary)]">
            {analysis.normalizedText}
          </pre>
        </details>
      ) : null}

      {attempts.length > 1 ? (
        <details className="mt-3 rounded-lg border border-[var(--border-subtle)] p-3">
          <summary className="cursor-pointer text-xs font-semibold text-[var(--text-muted)]">
            OCR attempts ({attempts.length})
          </summary>
          <div className="mt-3 space-y-3">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="rounded-lg bg-[var(--surface-muted)] p-3">
                <p className="text-xs font-bold text-[var(--text-secondary)]">
                  {attempt.label} · {Math.round(attempt.confidence || 0)}%
                </p>
                <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--text-muted)]">
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
