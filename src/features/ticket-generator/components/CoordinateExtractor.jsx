import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import { analyzeCoordinateOcrText } from '../../../infrastructure/ocr/coordinateCandidates.js';
import { validateOcrImageFile } from '../../../infrastructure/ocr/imageValidation.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import { Button } from '../../../shared/ui/primitives.jsx';

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

function formatPercent(value) {
  return `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`;
}

function CandidateButton({ candidate, label, onApply }) {
  return (
    <button
      type="button"
      className="generator-ocr-candidate flex min-h-10 w-full items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-3 py-2 text-left transition-colors first:border-t-0 hover:bg-[var(--surface-panel-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]"
      onClick={() => onApply(candidate)}
    >
      <span className="min-w-0">
        <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
          {label}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[11px] font-bold text-[var(--text-primary)]">
          {candidate.formatted}
        </span>
      </span>
      <span className="shrink-0 text-[10px] font-extrabold text-[var(--accent-text)]">
        Apply & verify
      </span>
    </button>
  );
}

export function CoordinateExtractor({ onApplyCoordinate }) {
  const inputRef = useRef(null);
  const [portalTarget, setPortalTarget] = useState(null);
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
    if (typeof document === 'undefined') return;
    setPortalTarget(document.querySelector('.generator-authoring-section--coordinate'));
  }, []);

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

      if (nextAnalysis.status === 'success') setPhase('detected');
      else if (nextAnalysis.status === 'ambiguous') setPhase('ambiguous');
      else if (nextAnalysis.status === 'invalid') setPhase('invalid');
      else setPhase('not_found');
    } catch (scanError) {
      setPhase('error');
      setError(scanError instanceof Error ? scanError.message : 'Coordinate analysis failed.');
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
  const needsGeminiKey = error.includes('Gemini API key');

  const content = (
    <section
      className="generator-operations-surface generator-coordinate-extractor generator-coordinate-extractor--inline overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)] xl:overflow-visible xl:rounded-none xl:border-0 xl:bg-transparent xl:shadow-none"
      aria-label="Photo coordinate scanner"
    >
      <header className="generator-operations-header generator-coordinate-extractor__header flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 xl:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <AppIcon name="map" size={14} className="text-[var(--accent-text)]" />
          <h3 className="text-xs font-extrabold text-[var(--text-primary)]">Photo coordinate</h3>
          <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-text)]">
            Gemini 3.6 Flash
          </span>
        </div>
        <span className="hidden text-[9.5px] font-medium text-[var(--text-faint)] sm:inline">
          Scan a geotag photo to fill the coordinate fields above
        </span>
      </header>

      <div className="p-3 xl:p-0">
        <div
          className={`generator-ocr-dropzone grid gap-3 border border-dashed p-2.5 transition-colors sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center xl:grid-cols-[72px_minmax(0,1fr)_auto] xl:gap-3 xl:border-x-0 xl:border-b-0 xl:border-t xl:border-solid xl:px-0 xl:py-3 ${
            dragActive
              ? 'border-[var(--accent-solid)] bg-[var(--accent-soft)]'
              : 'border-[var(--border-default)] bg-[var(--surface-muted)] xl:bg-transparent'
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

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Local Cut Point preview"
              className="h-20 w-full border border-[var(--border-subtle)] object-cover sm:h-16 xl:h-12"
            />
          ) : (
            <div className="grid h-20 place-items-center border border-[var(--border-subtle)] bg-[var(--surface-panel)] text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)] sm:h-16 xl:h-12 xl:text-[8px]">
              No image
            </div>
          )}

          <div className="min-w-0">
            <div className="hidden items-center gap-2 xl:flex">
              <AppIcon name="map" size={13} className="text-[var(--accent-text)]" />
              <p className="text-[11px] font-semibold text-[var(--text-primary)]">
                Photo coordinate
              </p>
              <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--accent-text)]">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="truncate text-[11.5px] font-bold text-[var(--text-primary)] xl:mt-0.5 xl:text-[10.5px] xl:font-medium xl:text-[var(--text-secondary)]">
              {file ? file.name : 'Drop a geotag photo here'}
            </p>
            <p className="mt-0.5 text-[10px] leading-4 text-[var(--text-muted)] xl:text-[9.5px]">
              JPG, PNG, WebP · max 15 MB · sent to Gemini only when Scan is pressed
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:col-start-2 xl:col-start-3 xl:row-start-1 xl:items-center xl:justify-end">
            <Button tone="secondary" size="xs" onClick={() => inputRef.current?.click()}>
              Choose image
            </Button>
            <Button size="xs" disabled={!file || phase === 'processing'} onClick={scanImage}>
              {phase === 'processing' ? 'Scanning…' : 'Scan coordinates'}
            </Button>
          </div>
        </div>

        {phase === 'processing' ? (
          <div
            className="generator-ocr-progress mt-2.5 border-l-2 border-[var(--accent-solid)] px-2.5 py-1.5"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3 text-[10px] font-bold">
              <span>{progress.status || 'Starting Gemini analysis…'}</span>
              <span className="font-mono text-[var(--accent-text)]">
                {formatPercent(progress.progress)}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden bg-[var(--border-subtle)]">
              <div
                className="h-full bg-[var(--accent-solid)] transition-[width] duration-200"
                style={{ width: formatPercent(progress.progress) }}
              />
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-2.5 grid gap-2">
            <p className="border-l-2 border-[var(--danger-solid)] bg-[var(--danger-soft)] px-2.5 py-1.5 text-[11px] font-medium leading-5 text-[var(--danger-text)]">
              {error}
            </p>
            {needsGeminiKey ? (
              <div>
                <Button asChild tone="secondary" size="xs">
                  <Link to="/settings">Open Settings</Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {phase === 'detected' && successfulCandidate ? (
          <div className="generator-ocr-result generator-ocr-result--detected mt-2.5 overflow-hidden border border-[var(--border-accent)] bg-[var(--accent-soft)]">
            <p className="px-3 py-2 text-[10.5px] font-medium leading-4 text-[var(--text-secondary)]">
              Coordinate detected{sourceLabel ? ` from ${sourceLabel}` : ''}
              {Number.isFinite(confidence) ? ` · OCR confidence ${Math.round(confidence)}%` : ''}.
              Verify before applying.
            </p>
            <CandidateButton
              candidate={successfulCandidate}
              label={analysis.format}
              onApply={applyCandidate}
            />
          </div>
        ) : null}

        {phase === 'ambiguous' ? (
          <div className="generator-ocr-result generator-ocr-result--ambiguous mt-2.5 overflow-hidden border border-[var(--warning-border)] bg-[var(--warning-soft)]">
            <p className="px-3 py-2 text-[10.5px] font-bold leading-4 text-[var(--warning-text)]">
              Multiple coordinate candidates found. Choose the correct pair.
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
          <p className="mt-2.5 border-l-2 border-[var(--success-solid)] bg-[var(--success-soft)] px-2.5 py-1.5 text-[11px] font-semibold leading-5 text-[var(--success-text)]">
            Coordinate applied to editable Latitude/Longitude fields above. Review them before Save.
          </p>
        ) : null}

        {phase === 'not_found' || phase === 'invalid' ? (
          <p className="mt-2.5 border-l-2 border-[var(--border-default)] px-2.5 py-1.5 text-[10.5px] leading-5 text-[var(--text-secondary)]">
            {phase === 'not_found'
              ? 'Gemini did not find a visible supported coordinate pair. Enter Latitude/Longitude manually or try another photo.'
              : 'Gemini found coordinate-like content, but the location is invalid. Correct it manually.'}
          </p>
        ) : null}

        {analysis?.normalizedText ? (
          <details className="generator-ocr-details mt-2.5 border-t border-[var(--border-subtle)] pt-2.5">
            <summary className="cursor-pointer text-[10.5px] font-bold text-[var(--text-secondary)]">
              Review detected text{sourceLabel ? ` · ${sourceLabel}` : ''}
            </summary>
            <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-words bg-[var(--surface-muted)] p-2.5 font-mono text-[10px] leading-4 text-[var(--text-secondary)]">
              {analysis.normalizedText}
            </pre>
          </details>
        ) : null}

        {attempts.length > 1 ? (
          <details className="generator-ocr-details mt-2 border-t border-[var(--border-subtle)] pt-2">
            <summary className="cursor-pointer text-[10.5px] font-bold text-[var(--text-muted)]">
              OCR attempts ({attempts.length})
            </summary>
            <div className="mt-2 divide-y divide-[var(--border-subtle)]">
              {attempts.map((attempt) => (
                <div key={attempt.id} className="py-2">
                  <p className="text-[10px] font-bold text-[var(--text-secondary)]">
                    {attempt.label}
                    {Number.isFinite(attempt.confidence)
                      ? ` · ${Math.round(attempt.confidence)}%`
                      : ''}
                  </p>
                  <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap break-words font-mono text-[9.5px] leading-4 text-[var(--text-muted)]">
                    {attempt.text || '(no text)'}
                  </pre>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </section>
  );

  return portalTarget ? createPortal(content, portalTarget) : content;
}
