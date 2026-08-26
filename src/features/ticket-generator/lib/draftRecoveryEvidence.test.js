import { describe, expect, it } from 'vitest';

import { readDraftRecovery, writeDraftRecovery } from './draftRecovery.js';

function memoryStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

describe('GEN-F8 evidence draft recovery', () => {
  it('stores only safe evidence metadata and restores no local file capability', () => {
    const storage = memoryStorage();
    const file = new File([new Uint8Array([1, 2, 3])], 'private.jpg', { type: 'image/jpeg' });

    expect(
      writeDraftRecovery(
        {
          formValues: { title: '[MANDAU] TEST' },
          evidenceItems: [
            {
              id: 'evidence-1',
              name: 'private.jpg',
              size: 3,
              type: 'image/jpeg',
              note: 'before jointing',
              file,
              previewUrl: 'blob:https://example.invalid/private',
              ocr: {
                status: 'detected',
                rawText: 'PRIVATE OCR TEXT',
                attempts: [{ text: 'PRIVATE' }],
                selectedCoordinate: {
                  latitude: -6.1,
                  longitude: 107.2,
                  formatted: '-6.10000, 107.20000',
                  detectedFormat: 'decimal_pair',
                },
              },
            },
          ],
          dirtyAt: new Date('2026-08-27T02:00:00+07:00'),
        },
        { storage },
      ),
    ).toBe(true);

    const recovery = readDraftRecovery(
      {},
      { storage, now: new Date('2026-08-27T02:05:00+07:00') },
    );
    expect(recovery.state).toBe('available');
    expect(recovery.payload.evidenceItems).toHaveLength(1);
    expect(recovery.payload.evidenceItems[0]).toMatchObject({
      id: 'evidence-1',
      name: 'private.jpg',
      size: 3,
      type: 'image/jpeg',
      note: 'before jointing',
      localFileAvailable: false,
      ocr: {
        status: 'detected',
        selectedCoordinate: {
          latitude: -6.1,
          longitude: 107.2,
          detectedFormat: 'decimal_pair',
        },
      },
    });
    expect(recovery.payload.evidenceItems[0]).not.toHaveProperty('file');
    expect(recovery.payload.evidenceItems[0]).not.toHaveProperty('previewUrl');
    expect(recovery.payload.evidenceItems[0].ocr).not.toHaveProperty('rawText');
    expect(recovery.payload.evidenceItems[0].ocr).not.toHaveProperty('attempts');
  });
});
