import { describe, expect, it } from 'vitest';

import {
  EVIDENCE_NOTE_MAX_LENGTH,
  EVIDENCE_QUEUE_MAX_ITEMS,
  createLocalEvidenceItem,
  evidenceRecoveryHasForbiddenBinaryFields,
  reattachEvidenceFile,
  restoreEvidenceRecoveryItems,
  sanitizeEvidenceRecoveryItem,
  sanitizeEvidenceRecoveryItems,
  updateEvidenceNote,
  validateEvidenceFile,
  withEvidenceOcrResult,
} from './evidenceWorkspace.js';

function imageFile({ name = 'cut-point.jpg', type = 'image/jpeg', size = 2048 } = {}) {
  return new File([new Uint8Array(size)], name, { type });
}

describe('GEN-F8 evidence workspace contracts', () => {
  it('reuses OCR image validation and enforces a bounded local queue', () => {
    expect(validateEvidenceFile(imageFile(), { currentCount: 0 })).toMatchObject({ valid: true });
    expect(
      validateEvidenceFile(imageFile({ type: 'application/pdf' }), { currentCount: 0 }),
    ).toMatchObject({ valid: false, code: 'UNSUPPORTED_TYPE' });
    expect(validateEvidenceFile(imageFile(), { currentCount: EVIDENCE_QUEUE_MAX_ITEMS })).toEqual({
      valid: false,
      code: 'QUEUE_FULL',
      message: `Evidence queue supports up to ${EVIDENCE_QUEUE_MAX_ITEMS} local images.`,
    });
  });

  it('creates local evidence, bounds operator notes, and keeps selected OCR coordinate metadata', () => {
    const created = createLocalEvidenceItem(imageFile(), {
      id: 'evidence-1',
      now: new Date('2026-08-27T01:00:00+07:00'),
    });
    expect(created.valid).toBe(true);
    expect(created.item).toMatchObject({
      id: 'evidence-1',
      name: 'cut-point.jpg',
      type: 'image/jpeg',
      localFileAvailable: true,
      ocr: { status: 'idle', selectedCoordinate: null },
    });
    expect(created.item.file).toBeInstanceOf(File);

    const noted = updateEvidenceNote(created.item, `  ${'x'.repeat(EVIDENCE_NOTE_MAX_LENGTH + 20)}  `);
    expect(noted.note).toHaveLength(EVIDENCE_NOTE_MAX_LENGTH);

    const scanned = withEvidenceOcrResult(noted, {
      status: 'detected',
      selectedCoordinate: {
        latitude: -6.12345,
        longitude: 107.12345,
        formatted: '-6.12345, 107.12345',
        detectedFormat: 'decimal_pair',
        confidence: 91.5,
      },
    });
    expect(scanned.ocr.selectedCoordinate).toEqual({
      latitude: -6.12345,
      longitude: 107.12345,
      formatted: '-6.12345, 107.12345',
      detectedFormat: 'decimal_pair',
      confidence: 91.5,
    });
  });

  it('sanitizes recovery metadata and never persists local binary or raw OCR details', () => {
    const payload = sanitizeEvidenceRecoveryItem({
      id: 'evidence-2',
      name: 'site.webp',
      size: 4096,
      type: 'image/webp',
      note: 'before jointing',
      file: imageFile({ name: 'site.webp', type: 'image/webp' }),
      objectUrl: 'blob:https://example.invalid/private',
      previewUrl: 'data:image/webp;base64,PRIVATE',
      ocr: {
        status: 'detected',
        rawText: 'PRIVATE OCR BODY',
        normalizedText: 'PRIVATE OCR BODY',
        attempts: [{ text: 'PRIVATE' }],
        selectedCoordinate: {
          latitude: -6.5,
          longitude: 107.5,
          formatted: '-6.50000, 107.50000',
          format: 'decimal_pair',
        },
      },
    });

    expect(payload.localFileAvailable).toBe(false);
    expect(payload).not.toHaveProperty('file');
    expect(payload).not.toHaveProperty('objectUrl');
    expect(payload).not.toHaveProperty('previewUrl');
    expect(payload.ocr).not.toHaveProperty('rawText');
    expect(payload.ocr).not.toHaveProperty('normalizedText');
    expect(payload.ocr).not.toHaveProperty('attempts');
    expect(payload.ocr.selectedCoordinate).toMatchObject({
      latitude: -6.5,
      longitude: 107.5,
      detectedFormat: 'decimal_pair',
    });
    expect(evidenceRecoveryHasForbiddenBinaryFields(payload)).toBe(false);
  });

  it('restores metadata-only evidence honestly and supports explicit re-attach', () => {
    const recovered = restoreEvidenceRecoveryItems([
      {
        id: 'recover-1',
        name: 'old.png',
        size: 100,
        type: 'image/png',
        note: 'recovered metadata',
        localFileAvailable: true,
      },
    ]);

    expect(recovered[0]).toMatchObject({
      id: 'recover-1',
      file: null,
      localFileAvailable: false,
      note: 'recovered metadata',
    });

    const reattached = reattachEvidenceFile(
      recovered[0],
      imageFile({ name: 'replacement.png', type: 'image/png', size: 500 }),
    );
    expect(reattached.valid).toBe(true);
    expect(reattached.item).toMatchObject({
      id: 'recover-1',
      name: 'replacement.png',
      size: 500,
      type: 'image/png',
      localFileAvailable: true,
      note: 'recovered metadata',
    });
    expect(reattached.item.file).toBeInstanceOf(File);
  });

  it('caps recovery metadata to the queue bound', () => {
    const items = Array.from({ length: EVIDENCE_QUEUE_MAX_ITEMS + 3 }, (_, index) => ({
      id: `evidence-${index}`,
      name: `${index}.jpg`,
      size: 100,
      type: 'image/jpeg',
    }));
    expect(sanitizeEvidenceRecoveryItems(items)).toHaveLength(EVIDENCE_QUEUE_MAX_ITEMS);
  });
});
