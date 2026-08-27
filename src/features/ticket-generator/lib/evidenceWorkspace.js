import { validateOcrImageFile } from '../../../infrastructure/ocr/imageValidation.js';

export const EVIDENCE_QUEUE_MAX_ITEMS = 8;
export const EVIDENCE_NOTE_MAX_LENGTH = 1000;
export const EVIDENCE_RECOVERY_VERSION = 1;

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function createEvidenceId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeCoordinateCandidate(value) {
  if (!value || typeof value !== 'object') return null;
  const latitude = validFiniteNumber(value.latitude);
  const longitude = validFiniteNumber(value.longitude);
  if (latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return {
    latitude,
    longitude,
    formatted: cleanText(value.formatted, 120) || `${latitude}, ${longitude}`,
    detectedFormat: cleanText(value.detectedFormat ?? value.format, 80) || null,
    confidence: validFiniteNumber(value.confidence),
  };
}

export function validateEvidenceFile(file, { currentCount = 0, replacing = false } = {}) {
  if (!replacing && Number(currentCount) >= EVIDENCE_QUEUE_MAX_ITEMS) {
    return {
      valid: false,
      code: 'QUEUE_FULL',
      message: `Evidence queue supports up to ${EVIDENCE_QUEUE_MAX_ITEMS} local images.`,
    };
  }
  return validateOcrImageFile(file);
}

export function createLocalEvidenceItem(
  file,
  { id = createEvidenceId(), currentCount = 0, now = new Date() } = {},
) {
  const validation = validateEvidenceFile(file, { currentCount });
  if (!validation.valid) return { valid: false, error: validation, item: null };

  return {
    valid: true,
    error: null,
    item: {
      id,
      name: cleanText(file.name, 240) || 'Local image',
      size: Number(file.size),
      type: cleanText(file.type, 100),
      note: '',
      addedAt: now instanceof Date ? now.toISOString() : new Date(now).toISOString(),
      file,
      localFileAvailable: true,
      ocr: {
        status: 'idle',
        selectedCoordinate: null,
      },
    },
  };
}

export function updateEvidenceNote(item, note) {
  return {
    ...item,
    note: cleanText(note, EVIDENCE_NOTE_MAX_LENGTH),
  };
}

export function withEvidenceOcrResult(item, { status, selectedCoordinate = null } = {}) {
  return {
    ...item,
    ocr: {
      status: cleanText(status, 40) || 'idle',
      selectedCoordinate: safeCoordinateCandidate(selectedCoordinate),
    },
  };
}

export function sanitizeEvidenceRecoveryItem(item = {}) {
  const size = Number(item.size);
  return {
    version: EVIDENCE_RECOVERY_VERSION,
    id: cleanText(item.id, 160) || createEvidenceId(),
    name: cleanText(item.name, 240) || 'Evidence image',
    size: Number.isFinite(size) && size > 0 ? size : 0,
    type: cleanText(item.type, 100),
    note: cleanText(item.note, EVIDENCE_NOTE_MAX_LENGTH),
    addedAt: cleanText(item.addedAt, 80) || null,
    localFileAvailable: false,
    ocr: {
      status: cleanText(item.ocr?.status, 40) || 'idle',
      selectedCoordinate: safeCoordinateCandidate(item.ocr?.selectedCoordinate),
    },
  };
}

export function sanitizeEvidenceRecoveryItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, EVIDENCE_QUEUE_MAX_ITEMS).map(sanitizeEvidenceRecoveryItem);
}

export function restoreEvidenceRecoveryItems(items) {
  return sanitizeEvidenceRecoveryItems(items).map((item) => ({
    ...item,
    file: null,
    localFileAvailable: false,
  }));
}

export function reattachEvidenceFile(item, file) {
  const validation = validateEvidenceFile(file, { replacing: true });
  if (!validation.valid) return { valid: false, error: validation, item };

  return {
    valid: true,
    error: null,
    item: {
      ...sanitizeEvidenceRecoveryItem(item),
      name: cleanText(file.name, 240) || item.name,
      size: Number(file.size),
      type: cleanText(file.type, 100),
      file,
      localFileAvailable: true,
    },
  };
}

export function evidenceRecoveryHasForbiddenBinaryFields(item = {}) {
  const forbiddenKeys = new Set([
    'file',
    'blob',
    'bytes',
    'arrayBuffer',
    'dataUrl',
    'dataURL',
    'objectUrl',
    'objectURL',
    'previewUrl',
    'rawText',
    'normalizedText',
    'attempts',
  ]);

  const visit = (value) => {
    if (!value || typeof value !== 'object') return false;
    for (const [key, nested] of Object.entries(value)) {
      if (forbiddenKeys.has(key)) return true;
      if (visit(nested)) return true;
    }
    return false;
  };

  return visit(item);
}
